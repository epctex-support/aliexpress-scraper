const Apify = require('apify');
const Promise = require('bluebird');
const tools = require('./tools');
const countries = require('./countries.json');

const {
    utils: { log },
} = Apify;

// Create crawler
Apify.main(async () => {
    log.info('PHASE -- STARTING ACTOR.');

    const c = countries.result.map(c => {
        return c.currencyName;
    })

    const userInput = await Apify.getInput();

    log.info('ACTOR OPTIONS: -- ', userInput);

    // Create request queue
    const requestQueue = await Apify.openRequestQueue();


    if (!tools.checkInputParams(userInput)) {
        throw new Error('You must define at least one of these parameters: searchTerm, startPage ');
    }

    const mappedStartUrls = tools.mapStartUrls(userInput);
    // Initialize first requests
    for (const mappedStartUrl of mappedStartUrls) {
        await requestQueue.addRequest({
            ...mappedStartUrl,
        });
    }

    // Create route
    const router = tools.createRouter({ requestQueue });

    const proxyConfiguration = userInput.proxy.useApifyProxy ? await Apify.createProxyConfiguration({
        groups: userInput.proxy.apifyProxyGroups ? userInput.proxy.apifyProxyGroups : [],
        countryCode: userInput.proxy.countryCode ? userInput.proxy.countryCode : null,
    }) : null;

    log.info('PHASE -- SETTING UP CRAWLER.');
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageTimeoutSecs: 99999,
        maxRequestRetries: 10,
        requestTimeoutSecs: 300,
        maxConcurrency: userInput.maxConcurrency,
        ignoreSslErrors: true,
        // Proxy options
        proxyConfiguration,
        prepareRequestFunction: ({ request }) => {
            request.headers = {
                Connection: 'keep-alive',
            };
            return request;
        },
        handlePageFunction: async (context) => {
            const { request, response, $,  body } = context;

            log.debug(`CRAWLER -- Processing ${request.url}`);

            // Status code check
            if (!response || response.statusCode !== 200
                || request.url.includes('login.')
                || $('body').data('spm') === 'buyerloginandregister') {
                throw new Error(`We got blocked by target on ${request.url}`);
            }

            // if (request.userData.label !== 'DESCRIPTION' && !$('script').text().includes('runParams')) {
            //     throw new Error(`We got blocked by target on ${request.url}`);
            // }
            //
            // if ($('html').text().includes('/_____tmd_____/punish')) {
            //     throw new Error(`We got blocked by target on ${request.url}`);
            // }

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
