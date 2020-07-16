const LABELS = {
    CATEGORY: 'CATEGORY',
    LIST: 'LIST',
    PRODUCT: 'PRODUCT',
    DESCRIPTION: 'DESCRIPTION',
    FEEDBACK: 'FEEDBACK',
    QA: 'QA'
};

const LOCALE_SITE = {
        "en_US": "glo",
        "ru_RU": "rus",
        "pt_BR": "bra",
        "es_ES": "esp",
        "fr_FR": "fra",
        "pl_PL": "pol",
        "iw_IL": "isr",
        "it_IT": "ita",
        "tr_TR": "tur",
        "de_DE": "deu",
        "ko_KR": "kor",
        "ar_MA": "ara",
        "ja_JP": "jpn",
        "nl_NL": "nld",
        "th_TH": "tha",
        "vi_VN": "vnm",
        "in_ID": "idn",
}

const COMMON_HEADER = (referer = 'www.aliexpress.com') =>{
    return {
        authority: 'www.aliexpress.com',
        accept: 'application/json, text/plain, */*',
        referer: referer,
    }
};

const SEARCH_COOKIES_HEADER = (currency = 'USD', region = 'US', language = 'en_US') => `aep_usuc_f=site=${LOCALE_SITE[language]}&c_tp=${currency}&region=${region}&b_locale=${language};`;

const SEARCH_URL = (term, page = null) => `https://www.aliexpress.com/wholesale?d=y&origin=n&SearchText=${term}&catId=0${page ? `&page=${page}` : ''}`;
const FEEDBACK_URL = (productId, ownerMemberId, page = 1) => `https://feedback.aliexpress.com/display/productEvaluation.htm?v=2&page=${page}&productId=${productId}&ownerMemberId=${ownerMemberId}&i18n=true`;
const QA_URL = (productId, page) => `https://www.aliexpress.com/aeglodetailweb/api/questions?productId=${productId}&currentPage=${page}&pageSize=100`;

module.exports = {
    LABELS,
    LOCALE_SITE,
    COMMON_HEADER,
    SEARCH_COOKIES_HEADER,
    SEARCH_URL,
    FEEDBACK_URL,
    QA_URL,
};
