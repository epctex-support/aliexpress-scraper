/* eslint-disable linebreak-style */
const Apify = require('apify');
const Promise = require('bluebird');
const tools = require('./tools');
const { SEARCH_COOKIES_HEADER } = require('./constants')

const {
    utils: { log },
} = Apify;

// Create crawler
Apify.main(async () => {
    log.info('PHASE -- STARTING ACTOR.');

    const userInput = await Apify.getInput();

    log.info('ACTOR OPTIONS: -- ', userInput);

    const stats = (await Apify.getValue('STATS')) || {
        categories: 0,
        enqueueDetails: 0,
        details: 0,
        errors: 0,
    };

    // Create request queue
    const requestQueue = await Apify.openRequestQueue();

    if (!tools.checkInputParams(userInput)) {
        throw new Error('You must define at least one of these parameters: searchTerm, startUrls ');
    }

    const mappedStartUrls = await tools.mapStartUrls(userInput);
    // Initialize first requests
    for (const mappedStartUrl of mappedStartUrls) {
        await requestQueue.addRequest(mappedStartUrl);
    }

    // Create route
    const router = tools.createRouter({ requestQueue, stats });

    const proxyConfig = await tools.proxyConfiguration({proxyConfig: userInput.proxy});

    Apify.events.on('persistState', async () => {
        console.dir(stats);
        await Apify.setValue('STATS', stats);
    });

    log.info('PHASE -- SETTING UP CRAWLER.');
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageTimeoutSecs: 120,
        maxRequestRetries: 10,
        requestTimeoutSecs: 120,
        maxConcurrency: userInput.maxConcurrency,
        ignoreSslErrors: true,
        // Proxy options
        proxyConfiguration: proxyConfig,
        prepareRequestFunction: ({ request }) => {
            const { language, shipTo, currency } = userInput;
            request.headers = {
                Connection: 'keep-alive',
                cookie: SEARCH_COOKIES_HEADER(currency, shipTo, language),
            };
            return request;
        },
        handlePageFunction: async (context) => {
            const { request, response, $, body } = context;

            log.debug(`CRAWLER -- Processing ${request.url}`);

            // Status code check
            if (!response || response.statusCode !== 200
                || request.url.includes('login.')
                || body.includes('x5referer')
                || $('body').data('spm') === 'buyerloginandregister') {
                stats.errors ++;
                throw new Error(`We got blocked by target on ${request.url}`);
            }

            // Random delay
            await Promise.delay(Math.random() * 3000);

            // Add user input to context
            context.userInput = userInput;

            // Redirect to route
            await router(request.userData.label, context);
        },
    });

    log.info('PHASE -- STARTING CRAWLER.');

    await crawler.run();

    log.info('PHASE -- ACTOR FINISHED.');
});
