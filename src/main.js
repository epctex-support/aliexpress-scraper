const Apify = require('apify');
const Promise = require('bluebird');
const tools = require('./tools');
const { SEARCH_COOKIES_HEADER, LABELS } = require('./constants');

const {
    utils: { log },
} = Apify;

// Create crawler
Apify.main(async () => {
    log.info('PHASE -- STARTING ACTOR.');

    const userInput = await Apify.getInput();

    if (userInput.debugLog) {
        log.setLevel(log.LEVELS.DEBUG);
    }

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

    await tools.categorizeStartUrls(userInput, requestQueue);

    // Create route
    const router = tools.createRouter({ requestQueue, stats });

    const proxyConfiguration = userInput.proxy && userInput.proxy.useApifyProxy ? await Apify.createProxyConfiguration({
        ...userInput.proxy,
        countryCode: (userInput.proxy.apifyProxyCountry ? userInput.proxy.apifyProxyCountry : undefined),
    }) : undefined;

    Apify.events.on('persistState', async () => {
        console.dir(stats);
        await Apify.setValue('STATS', stats);
    });

    const cookies = tools.appendCookies(proxyConfiguration);

    log.info('PHASE -- SETTING UP CRAWLER.');
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageTimeoutSecs: 99999,
        maxRequestRetries: 10,
        requestTimeoutSecs: 300,
        maxConcurrency: userInput.maxConcurrency,
        ignoreSslErrors: true,
        useSessionPool: true,
        // Proxy options
        proxyConfiguration,
        prepareRequestFunction: async ({ request, session }) => {
            const { language, shipTo, currency } = userInput;
            const { headers } = request;

            headers.Accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
            headers['Accept-Language'] = `${language.replace('_', '-')},${language.split('_')[0]};q=0.9`;
            headers['Accept-Encoding'] = 'gzip, deflate, br';
            headers['Cache-Control'] = 'no-cache';
            headers.Connection = 'keep-alive';
            headers.Pragma = 'no-cache';
            headers.DNT = 1;
            headers['Upgrade-Insecure-Requests'] = 1;

            if ([LABELS.CATEGORY, LABELS.LIST].includes(request.userData.label)) {
                await cookies({ session, headers, language, shipTo, currency });
                log.debug('Cookies were set', { url: request.url });
                headers.Referer = 'https://www.aliexpress.com';
            }

            headers.Cookie = session.getCookieString('https://www.aliexpress.com') || SEARCH_COOKIES_HEADER(currency, shipTo, language);
            headers['User-Agent'] = session.userData.userAgent || tools.randomUserAgent.random().toString();
        },
        handlePageFunction: async (context) => {
            const { request, response, $, body, session } = context;

            console.log(request.headers);

            log.debug(`CRAWLER -- Processing ${request.url}`);

            if (!response) {
                throw new Error('Empty response');
            }

            if (response.statusCode === 404) {
                request.noRetry = true;
                throw new Error('URL not found');
            }

            // Status code check
            if (body.includes('ui-unusual ui-unusual-busy')
                || body.includes('localStorage.x5referer')
                || $('body').data('spm') === 'buyerloginandregister') {
                session.retire();
                stats.errors++;
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
