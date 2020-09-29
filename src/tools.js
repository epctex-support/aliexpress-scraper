const Apify = require('apify');
const URL = require('url');
const vm = require('vm');
const UserAgents = require('user-agents');
const routes = require('./routes');
const { LABELS, FEEDBACK_URL, QA_URL, COMMON_HEADER, SEARCH_URL, SEARCH_COOKIES_HEADER } = require('./constants');

const {
    utils: { log, requestAsBrowser },
} = Apify;

exports.randomUserAgent = new UserAgents(({ userAgent, viewportHeight, viewportWidth }) => {
    return (
        viewportHeight >= 600
        && viewportWidth >= 800
        && /^Mozilla/.test(userAgent)
        && !/Firefox/.test(userAgent)
        && /\d$/.test(userAgent)
        && /(X11|Win64|Intel Mac OS X)/.test(userAgent)
        && userAgent.length <= 120
    );
});

// Create router
exports.createRouter = (globalContext) => {
    return async function (routeName, requestContext) {
        const route = routes[routeName];
        if (!route) throw new Error(`No route for name: ${routeName}`);
        log.debug(`Invoking route: ${routeName}`);
        return route(requestContext, globalContext);
    };
};

exports.evalExtendOutputFunction = (functionString) => {
    let func;

    try {
        func = vm.runInThisContext(`(${functionString})`);
    } catch (err) {
        throw new Error(`Compilation of extendOutputFunction failed.\n${err.message}\n${err.stack.substr(err.stack.indexOf('\n'))}`);
    }

    return func;
};

exports.checkInputParams = (userInput) => {
    let run = false;
    const { startUrls, searchTerms } = userInput;
    if (startUrls && startUrls.length > 0) {
        run = true;
    } else if (searchTerms && searchTerms.length > 0) {
        run = true;
    }
    return run;
};

// Detects url and map them to routes
exports.categorizeStartUrls = async ({ startUrls, searchTerms }, requestQueue) => {
    if (startUrls && startUrls.length) {
        // enables using requestsFromUrl mixed with plain startUrls
        const rl = await Apify.openRequestList('STARTURLS', startUrls);
        let req;

        while (req = await rl.fetchNextRequest()) {
            const parsedURL = URL.parse(req.url);
            const link = `https://www.aliexpress.com${parsedURL.pathname}`;
            const url = link;
            let routeType = '';
            let userData = {};

            if (link.includes('/item/')) {
                routeType = LABELS.PRODUCT;
                userData = {
                    baseUrl: link,
                    productId: link.split('/item/')[1].split('.htm')[0],
                };
            } else if (link.includes('/category/') || link.includes('/wholesale')) {
                routeType = LABELS.CATEGORY;
                userData = {
                    baseUrl: link,
                    pageNum: 1,
                };
            } else if (link.includes('/store/')) {
                throw new Error('Stores urls arent implemented yet');
                // routeType = LABELS.SHOP;
                // userData = {
                //     baseUrl: link,
                //     pageNum: 1,
                // };
            } else {
                throw new Error('Wrong URL provided to Start URLS!');
            }

            userData.label = routeType;

            await requestQueue.addRequest({
                uniqueKey: link,
                url,
                userData,
            });
        }
    }

    if (searchTerms) {
        for (const searchTerm of searchTerms) {
            const st = searchTerm.replace(' ', '+');
            const url = SEARCH_URL(st);

            await requestQueue.addRequest({
                url,
                uniqueKey: url,
                userData: {
                    label: LABELS.LIST,
                    pageNum: 1,
                    searchTerm: st,
                    baseUrl: 'https://www.aliexpress.com/wholesale',
                },
            });
        }
    }
};

exports.getQAData = async (productId, referer, page = 1) => {
    const response = await requestAsBrowser({
        url: QA_URL(productId, page),
        headers: COMMON_HEADER(referer),
        json: true,
    });
    return response.body;
};

exports.whatNextToDo = async (product, userInput, request, requestQueue, maxReviews = 1, qaDone = false, reviewsDone = false) => {
    const { feedbackPage = 0 } = request.userData;
    const { includeDescription, maxFeedbacks, maxQuestions } = userInput;
    let { userFeedbacks, questionAndAnswers } = product;
    if (!userFeedbacks) {
        userFeedbacks = [];
        product.userFeedbacks = [];
    }
    if (!questionAndAnswers) {
        questionAndAnswers = [];
        product.questionAndAnswers = [];
    }

    if (includeDescription && !product.description) {
        // Fetch description
        await requestQueue.addRequest({
            url: product.descriptionURL,
            userData: {
                label: LABELS.DESCRIPTION,
                product,
            },
        }, { forefront: true });
    } else if (maxFeedbacks > 0 && userFeedbacks.length < maxFeedbacks && userFeedbacks.length < maxReviews && !qaDone && !reviewsDone) {
        const newFeedbackPage = feedbackPage + 1;
        await requestQueue.addRequest({
            url: FEEDBACK_URL(product.id, product.ownerMemberId, newFeedbackPage),
            userData: {
                label: LABELS.FEEDBACK,
                feedbackPage: newFeedbackPage,
                product,
            },
        }, { forefront: true });
    } else if (maxQuestions > 0 && questionAndAnswers.length < maxQuestions && !qaDone) {
        await requestQueue.addRequest({
            url: product.link,
            uniqueKey: `${product.link}/qa`,
            userData: {
                label: LABELS.QA,
                product,
            },
        }, { forefront: true });
    } else {
        await Apify.pushData({ ...product });
        log.debug(`CRAWLER -- Fetching product: ${product.id} completed and successfully pushed to dataset`);
    }
};

/**
 * Grabs the initial cookies to pass to category and search pages
 *
 * @param {Apify.ProxyConfiguration} proxyConfig
 * @returns {(params: { session: Apify.Session, headers: any, language: string, shipTo: string, currency: string }) => Promise<void>}
 */
exports.appendCookies = (proxyConfig) => {
    return async ({ session, headers, currency, shipTo, language }) => {
        const userAgent = exports.randomUserAgent.random().toString();

        log.debug('Going to get cookies', { headers, userAgent, userData: session.userData });

        const response = await requestAsBrowser({
            useInsecureHttpParser: true,
            proxyUrl: proxyConfig.newUrl(session.id),
            headers: {
                ...headers,
                Cookie: SEARCH_COOKIES_HEADER(currency, shipTo, language),
                'User-Agent': userAgent,
            },
            ignoreSslErrors: true,
            url: 'https://www.aliexpress.com',
        });

        session.userData.userAgent = userAgent;
        session.setCookiesFromResponse(response);
    };
};
