/* eslint-disable linebreak-style */
const safeEval = require('safe-eval');
const flattenDeep = require('lodash/flattenDeep');
const tools = require('./tools')

// Fetch all main category paths from homepage
const getAllMainCategoryPaths = ($) => {
    return $('dd.sub-cate').map((i, el) => $(el).data('path')).get();
};

// Fetch every subcategory hidden pages (loaders)
const getAllSubCategories = async ($) => {
    const dataScript = $($('script').filter((i, script) => $(script).html().includes('runParams')).get()[0]).html();

    const data = flattenDeep(JSON.parse(
        dataScript.split('window.runParams = ')[2].split('window.runParams.csrfToken =')[0].replace(/;/g, ''),
    ).refineCategory
        .map(category => category.childCategories))
        .filter(el => el).map(item => ({ name: item.categoryName, link: `https:${item.categoryUrl}` }));

    return data;
};

// Filters sub categories with given options
const filterSubCategories = (categoryStartIndex = 0, categoryEndIndex = null, subCategories) => {
    // Calculate end index
    const endIndex = categoryEndIndex > 0 ? categoryEndIndex : subCategories.length - 1;

    // Slice array
    return subCategories.slice(categoryStartIndex, endIndex);
};

// Fetch all products from a global object `runParams`
const getProductsOfPage = ($) => {
    const dataScript = $($('script').filter((i, script) => $(script).html().includes('runParams')).get()[0]).html();
    const data = JSON.parse(
        dataScript.split('window.runParams = ')[2].split('window.runParams.csrfToken =')[0].replace(/;/g, ''),
    );

    if (!data.success) {
        throw new Error('We got blocked when trying to fetch products!');
    }
    return data.mods && data.mods.itemList.content.length > 0
        ? data.mods.itemList.content.map(item => ({ id: item.productId, name: item.title.displayTitle })) : [];
};

// Fetch basic product detail from a global object `runParams`
const getProductDetail = async ($, url, extendOutputFunction) => {
    const dataScript = $($('script').filter((i, script) => $(script).html().includes('runParams')).get()[0]).html();

    const { data } = safeEval(dataScript.split('window.runParams = ')[1].split('var GaData')[0].replace(/;/g, ''));

    const {
        actionModule,
        titleModule,
        storeModule,
        specsModule,
        imageModule,
        descriptionModule,
        skuModule,
        crossLinkModule,
        recommendModule,
        commonModule,
    } = data;
    let extendOutputData = {};
    if (extendOutputFunction) {
        extendOutputFunction = tools.evalExtendOutputFunction(extendOutputFunction);
        extendOutputData = await extendOutputFunction($);
    }


    return {
        id: actionModule.productId,
        link: url,
        ownerMemberId: commonModule.sellerAdminSeq,
        title: titleModule.subject,
        tradeAmount: `${titleModule.tradeCount ? titleModule.tradeCount : ''} ${titleModule.tradeCountUnit ? titleModule.tradeCountUnit : ''}`,
        averageStar: titleModule.feedbackRating.averageStar,
        descriptionURL: descriptionModule.descriptionUrl,
        store: {
            followingNumber: storeModule.followingNumber,
            establishedAt: storeModule.openTime,
            positiveNum: storeModule.positiveNum,
            positiveRate: storeModule.positiveRate,
            name: storeModule.storeName,
            id: storeModule.storeNum,
            url: `https:${storeModule.storeURL}`,
            topRatedSeller: storeModule.topRatedSeller,
        },
        specs: specsModule.props ? specsModule.props.map((spec) => {
            const obj = {};
            obj[spec.attrName] = spec.attrValue;
            return obj;
        }) : [],
        categories: crossLinkModule.breadCrumbPathList
            .map(breadcrumb => breadcrumb.target)
            .filter(breadcrumb => breadcrumb),
        wishedCount: actionModule.itemWishedCount,
        quantity: actionModule.totalAvailQuantity,
        photos: imageModule.imagePathList,
        skuOptions: skuModule.productSKUPropertyList ? skuModule.productSKUPropertyList
            .map(skuOption => ({
                name: skuOption.skuPropertyName,
                values: skuOption.skuPropertyValues
                    .map(skuPropVal => skuPropVal.propertyValueDefinitionName),
            })) : [],
        prices: skuModule.skuPriceList.map(skuPriceItem => ({
            price: skuPriceItem.skuVal.skuAmount.formatedAmount,
            attributes: skuPriceItem.skuPropIds.split(',')
                .map(propId => {
                    const propVal = skuModule.productSKUPropertyList ? skuModule.productSKUPropertyList
                    .reduce((arr, obj) => { return arr.concat(obj.skuPropertyValues); }, [])
                    .find(propVal => propVal.propertyValueId === parseInt(propId, 10)) : null
                    return propVal ? propVal.propertyValueName : null;
                }),
        })),
        companyId: recommendModule.companyId,
        memberId: commonModule.sellerAdminSeq,
        ...extendOutputData
    };
};


// Get description HTML of product
const getProductDescription = async ($) => {
    return $.html();
};

const getProductFeedback = async ($) => {
    const feedbackItems = $('.feedback-item').toArray();
    const scrapedFeeds = [];
    for (const item of feedbackItems) {
        const $item = $(item);
        let infos = $item.find('.user-order-info span').toArray();
        const info = [];
        for (const i of infos) {
            const text = $(i).text().trim().replace(/[\t|\n]+/, '');
            const arr = text.split(':');
            info[arr[0]] = arr[1].trim();
        }
        let star = undefined;
        const starsWidth = $('.f-rate-info .star-view > span').eq(0).attr('style');
        const pxMatch = starsWidth.match(/\d+/);
        if (pxMatch) {
            star = 6 - (100 / parseInt(pxMatch[0]));
        }
        scrapedFeeds.push({
            userName: $item.find('.user-name').text().trim(),
            userCountry: $item.find('.user-country').text().trim(),
            userStar: star,
            reviewContent: $item.find('.buyer-feedback span:first-child').text().trim(),
            reviewTime: $item.find('.buyer-feedback .r-time-new').text().trim(),
            info
        })
    }
    return scrapedFeeds;
};

const getProductQA = async (jsonBody) => {
    let totalAsk = 0;
    const productQA = [];
    for (const question of jsonBody.body.questionList) {
        totalAsk = question.totalAsk;
        const parsedQuestion = {
            lang: question.contentLang,
            totalAnswer: question.totalAnswer,
            originalContent: question.content,
            translateContent: question.translateContent,
            answers: []
        }
        for (const answers of question.answers) {
            parsedQuestion.answers.push({
                lang: answers.contentLang,
                totalAnswer: answers.totalAnswer,
                originalContent: answers.content,
                translateContent: answers.translateContent,
            })
        }
        productQA.push(parsedQuestion);
    }
    return productQA;
}

const getTotalQuestions = async (jsonBody) => {
    let totalQuestions = 0;
    for (const question of jsonBody.body.questionList) {
        totalQuestions = question.totalAsk;
        break;
    }
    return totalQuestions;
}

const getMaxReviews = async ($) => {
    const maxReviewsText = $('.customer-reviews').text();
    const match = maxReviewsText.match(/\d+/g);
    if (match){
        return match[0];
    }
    return 0;
}



module.exports = {
    getAllMainCategoryPaths,
    getAllSubCategories,
    filterSubCategories,
    getProductsOfPage,
    getProductDetail,
    getProductDescription,
    getProductFeedback,
    getMaxReviews,
    getProductQA,
    getTotalQuestions
};