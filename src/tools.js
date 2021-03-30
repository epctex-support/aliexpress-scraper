const Apify = require('apify');
const URL = require('url');
const vm = require('vm');
const routes = require('./routes');
const { LABELS, FEEDBACK_URL, QA_URL, COMMON_HEADER, SEARCH_URL } = require('./constants')
const {
    utils: { log, requestAsBrowser },
} = Apify;

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
}

//
exports.proxyConfiguration = async ({
    proxyConfig,
    required = true,
    force = Apify.isAtHome(),
    blacklist = ['GOOGLESERP'],
    hint = [],
}) => {
    const configuration = await Apify.createProxyConfiguration(proxyConfig);

    // this works for custom proxyUrls
    if (Apify.isAtHome() && required) {
        if (!configuration || (!configuration.usesApifyProxy && (!configuration.proxyUrls || !configuration.proxyUrls.length)) || !configuration.newUrl()) {
            throw new Error('\n=======\nYou must use Apify proxy or custom proxy URLs\n\n=======');
        }
    }

    // check when running on the platform by default
    if (force) {
        // only when actually using Apify proxy it needs to be checked for the groups
        if (configuration && configuration.usesApifyProxy) {
            if (blacklist.some((blacklisted) => (configuration.groups || []).includes(blacklisted))) {
                throw new Error(`\n=======\nThese proxy groups cannot be used in this actor. Choose other group or contact support@apify.com to give you proxy trial:\n\n*  ${blacklist.join('\n*  ')}\n\n=======`);
            }

            // specific non-automatic proxy groups like RESIDENTIAL, not an error, just a hint
            if (hint.length && !hint.some((group) => (configuration.groups || []).includes(group))) {
                Apify.utils.log.info(`\n=======\nYou can pick specific proxy groups for better experience:\n\n*  ${hint.join('\n*  ')}\n\n=======`);
            }
        }
    }

    return configuration;
};

// Creates proxy URL with user input
exports.createProxyUrl = async (userInput) => {
    const { apifyProxyGroups, useApifyProxy, proxyUrls } = userInput;
    if (proxyUrls && proxyUrls.length > 0) {
        return proxyUrls[0];
    }

    if (useApifyProxy) {
        return `http://${apifyProxyGroups ? apifyProxyGroups.join(',') : 'auto'}:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`;
    }

    return '';
};

exports.checkInputParams = (userInput) => {
    let run = false;
    const { startUrls, searchTerms } = userInput;
    if (startUrls && startUrls.length > 0){
        run = true;
    } else if (searchTerms && searchTerms.length > 0) {
        run = true;
    }
    return run;
}

// this is the utils function to add urls form text file (either Google sheet or csv)
const fromStartUrls = async function* (startUrls, name = 'STARTURLS') {
    const rl = await Apify.openRequestList(name, startUrls);

    /** @type {Apify.Request | null} */
    let rq;

    // eslint-disable-next-line no-cond-assign
    while (rq = await rl.fetchNextRequest()) {
        yield rq;
    }
};

// Detects url and map them to routes
exports.mapStartUrls = async ({ startUrls, searchTerms }) => {
    let urls = [];
    // Fetch start urls
    if (startUrls) {
        for await (const startUrl of fromStartUrls(startUrls)) {
            const parsedURL = URL.parse(startUrl.url);
            const link = `https://www.aliexpress.com${parsedURL.pathname}`;
            let url = link;
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
            } else {
                throw new Error('Wrong URL provided to Start URLS!');
            }

            userData.label = routeType;

            return {
                uniqueKey: link,
                url,
                userData,
            };
        };
    }
    if (searchTerms) {
        urls = urls.concat(searchTerms.map((searchTerms) => {
            searchTerms = searchTerms.replace(" ", "+");
            const url = SEARCH_URL(searchTerms);
            return {
                url,
                uniqueKey: url,
                userData: {
                    label: LABELS.LIST,
                    pageNum: 1,
                    searchTerm: searchTerms,
                    baseUrl: 'https://www.aliexpress.com/wholesale'
                }
            }
        }))
    }
    return urls;
};

exports.getQAData = async (productId, referer, page = 1) => {
    const response = await requestAsBrowser({
        url: QA_URL(productId, page),
        headers: COMMON_HEADER(referer),
        json: true
    })
    return response.body;
}

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
}
