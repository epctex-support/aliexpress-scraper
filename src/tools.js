const Apify = require('apify');
const URL = require('url');
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
    const { startUrls, searchTerm } = userInput;
    if (startUrls.length > 0){
        run = true;
    } else if (searchTerm.length > 0) {
        run = true;
    }
    return run;
}

// Detects url and map them to routes
exports.mapStartUrls = ({ startUrls, searchTerms }) => {
    let urls = [];
    // Fetch start urls
    if (startUrls) {
        urls = urls.concat(startUrls.map((startUrl) => {
            const parsedURL = URL.parse(startUrl.url);
            const link = `https://www.aliexpress.com${parsedURL.pathname}`;
            let routeType = '';
            let userData = {};

            if (link.includes('/item/')) {
                routeType = LABELS.PRODUCT;
                userData = {
                    baseUrl: link,
                    productId: link.split('/item/')[1].split('.htm')[0],
                };
            } else if (link.includes('/category/')) {
                routeType = LABELS.CATEGORY;
                userData = {
                    baseUrl: link,
                };
            } else {
                throw new Error('Wrong URL provided to Start URLS!');
            }

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        }));
    }
    if (searchTerms) {
        urls = urls.concat(searchTerms.map((searchTerms) => {
            const url = SEARCH_URL(searchTerms);
            return {
                url,
                uniqueKey: url,
                userData: {
                    label: LABELS.CATEGORY,
                    baseUrl: url
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

exports.whatNextToDo = async (product, userInput, request, requestQueue, maxReviews = 1, qaDone = false) => {
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
    } else if (maxFeedbacks > 0 && userFeedbacks.length < maxFeedbacks && userFeedbacks.length < maxReviews) {
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
