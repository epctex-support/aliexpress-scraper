### 2020-09-29 - Patch SDK version and better handling of search and categories listings

#### Fixes
- Bump SDK to 0.21.4 because of a proxy bug that could abort the run
- More browser-like headers to lessen the chance of blocking
- Better error when trying to use store urls
- Allows using requestsFromUrl / categorize urls
- Linting
- Random user agents

#### New Features
- Use sessionPool and retire blocked sessions
- debugLog : Enable seeing the debug log

### 2020-07-16 - New SDK version, new parameters for better scraping.

#### New features
- searchTerms : List of terms witch can be searched by Aliexpress search engine
- language : Select language of aliexpress site, option has effect on product detail, product feedback, Q&A
- shipTo : Select country where product will be shipped
- currency : Select currency of the product price
- maxItems : You can limit scraped products
- searchInSubcategories : You can turn off enqueuing products from subcategories
- maxFeedback : You can limit of scraped feedback items
- maxQuestions : You can limit of scraped Q&A items
- extendOutputFunction : You can write your own scraped function which will be applicated on product detail page
