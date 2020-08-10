// routes.js
const Apify = require('apify');
const extractors = require('./extractors');
const tools = require('./tools');
const { LABELS, SEARCH_URL } = require('./constants');

const {
    utils: { log },
} = Apify;

// Categoy page crawler
// Add next page on request queue
// Fetch products from list and add all links to request queue
exports.CATEGORY = async ({ $, userInput, request }, { requestQueue, stats }) => {
    log.info(`CRAWLER -- Fetching category link: ${request.url}`);
    const { searchInSubcategories = true, maxItems = 1000 } = userInput;
    // Extract sub category links
    const subCategories = await extractors.getAllSubCategories($);
    // If enqueued details are higher than maxItems INPUT params break category enqueuing
    if (maxItems <= stats.enqueueDetails){
        return;
    }

    // If sub categories are more than 0 and input param is true
    if (subCategories.length > 0 && searchInSubcategories) {
        stats.categories += subCategories.length;
        // Add all sub categories to request queue
        for (const subCategory of subCategories) {
            let url = subCategory.link;
            await requestQueue.addRequest({
                uniqueKey: url,
                url,
                userData: {
                    label: LABELS.CATEGORY,
                    pageNum: 1,
                },
            });
        }
    } else {
        // Move to listing
        await requestQueue.addRequest({
            uniqueKey: `${request.url}-LIST`,
            url: request.url,
            userData: {
                label: LABELS.LIST,
                pageNum: 1,
                baseUrl: request.url,
            },
        });
    }
    log.debug(`CRAWLER -- Fetched ${subCategories.length} subcategories and moving to each of them`);
};

// Categoy page crawler
// Add next page on request queue
// Fetch products from list and add all links to request queue
exports.LIST = async ({ $, userInput, request }, { requestQueue, stats }) => {
    const { scrapProducts = true, maxItems = 1000 } = userInput;
    const { pageNum = 1, baseUrl, searchTerm = null } = request.userData;

    // If enqueued details are higher than maxItems INPUT params break list enqueuing
    if (maxItems <= stats.enqueueDetails){
        return;
    }

    log.info(`CRAWLER -- Fetching category: ${request.url} with page: ${pageNum}`);

    // Extract product links
    const productLinks = await extractors.getProductsOfPage($);

    // If products are more than 0
    if (productLinks.length > 0) {
        let url;
        if (searchTerm) {
            url = SEARCH_URL(searchTerm, pageNum + 1)
        } else {
            url = `${baseUrl}?page=${pageNum + 1}&SortType=total_tranpro_desc&g=y`;
        }
        // Add next page of same category to queue
        await requestQueue.addRequest({
            url,
            userData: {
                label: LABELS.LIST,
                pageNum: pageNum + 1,
                searchTerm,
                baseUrl,
            },
        });

        // Add all products to request queue
        if (scrapProducts) {
            for (const productLink of productLinks) {
                if (maxItems <= stats.enqueueDetails){
                    return;
                }
                await requestQueue.addRequest({
                    uniqueKey: `${productLink.id}`,
                    url: `https:${productLink.link}`,
                    userData: {
                        label: LABELS.PRODUCT,
                        productId: productLink.id,
                    },
                }, { forefront: true });
                stats.enqueueDetails++;
            }
        }
    } else {
        // End of category with page
        log.debug(`CRAWLER -- Last page of category: ${request.url} with page: ${pageNum}.`);
    }


    log.debug(`CRAWLER -- Fetched product links from ${request.url} with page: ${pageNum}`);
};


// Product page crawler
// Fetches product detail from detail page
exports.PRODUCT = async ({ $, userInput, request, body }, { requestQueue, stats }) => {
    const { productId } = request.userData;
    const { extendOutputFunction } = userInput;

    log.info(`CRAWLER -- Fetching product: ${productId}`);

    // Fetch product details
    const product = await extractors.getProductDetail($, request.url, extendOutputFunction);
    stats.details++;
    await tools.whatNextToDo(product, userInput, request, requestQueue);
};


// Description page crawler
// Fetches description detail and push data
exports.DESCRIPTION = async ({ $, userInput,  request }, { requestQueue }) => {
    const { product } = request.userData;

    log.info(`CRAWLER -- Fetching product description: ${product.id}`);

    // Fetch product details
    product.description = await extractors.getProductDescription($);
    delete product.descriptionURL;

    await tools.whatNextToDo(product, userInput, request, requestQueue);

};

exports.FEEDBACK = async ({ $, userInput, request }, { requestQueue }) => {
    const { product, feedbackPage } = request.userData;
    const { maxFeedbacks } = userInput;

    log.info(`CRAWLER -- Fetching product feedback ${product.id}, page: ${feedbackPage}`);

    const { userFeedbacks } = product;
    let reviewsDone = false;
    const maxReviews = await extractors.getMaxReviews($);
    if (userFeedbacks.length < maxReviews) {
        const newFeedbacks = await extractors.getProductFeedback($);
        reviewsDone = newFeedbacks.length === 0
        for (const f of newFeedbacks) {
            if (userFeedbacks.length < maxFeedbacks) {
                userFeedbacks.push(f);
            }
        }
        product.userFeedbacks = userFeedbacks;
    }
    await tools.whatNextToDo(product, userInput, request, requestQueue, maxReviews, false, reviewsDone);
};

exports.QA = async ({ userInput, request }) => {
    const { product } = request.userData;
    const { maxQuestions } = userInput;

    log.info(`CRAWLER -- Fetching product question & answers ${product.id}`);

    const { questionAndAnswers } = product;
    let page = 1;
    let totalQuestions = maxQuestions;
    do {
        const responseBody = await tools.getQAData(product.id, product.link, page);
        totalQuestions = await extractors.getTotalQuestions(responseBody);
        for (const qa of await extractors.getProductQA(responseBody)) {
            if (questionAndAnswers.length < maxQuestions) {
                questionAndAnswers.push(qa);
            } else {
                break;
            }
        }
        page++;
    } while (questionAndAnswers.length < maxQuestions && questionAndAnswers.length < totalQuestions)
    product.questionAndAnswers = questionAndAnswers;
    await tools.whatNextToDo(product, userInput, request, null, 1, true);
}
