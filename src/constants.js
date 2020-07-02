const LABELS = {
    CATEGORY: 'CATEGORY',
    LIST: 'LIST',
    PRODUCT: 'PRODUCT',
    DESCRIPTION: 'DESCRIPTION',
    FEEDBACK: 'FEEDBACK',
    QA: 'QA'
};

const COMMON_HEADER = (referer = 'www.aliexpress.com') =>{
    return {
        authority: 'www.aliexpress.com',
        accept: 'application/json, text/plain, */*',
        referer: referer,
    }
};

const SEARCH_URL = (term) => `https://www.aliexpress.com/af/${term}.html?d=y&origin=n&SearchText=${term}&catId=0`;
const FEEDBACK_URL = (productId, ownerMemberId, page = 1) => `https://feedback.aliexpress.com/display/productEvaluation.htm?v=2&page=${page}&productId=${productId}&ownerMemberId=${ownerMemberId}&i18n=true`;
const QA_URL = (productId, page) => `https://www.aliexpress.com/aeglodetailweb/api/questions?productId=${productId}&currentPage=${page}&pageSize=100`;

module.exports = {
    LABELS,
    COMMON_HEADER,
    SEARCH_URL,
    FEEDBACK_URL,
    QA_URL,
};
