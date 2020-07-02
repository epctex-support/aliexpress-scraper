# Actor - Aliexpress Scraper

## Aliexpress scraper

Since Aliexpress doesn't provide an API, this actor should help you to retrieve data from it.

The Aliexpress data scraper supports the following features:

- Scrape product details - you can scrape attributes like images, metadata. You can find details below.
- Scrape product descriptions - you can scrape description HTML of the product.
- Scrape feedbacks of product detail - you can scrape users feedbacks (name, country, original content, translated content)
- Scrape questions of product detail - you can scrape buyers Q&A of product

## Aliexpress Scraper - future

In the future, this solution will be extended with following features:

- Implement `extendOutputFunction` so that you can execute your own scraping method.

## Input Parameters

The input of this scraper should be JSON containing the list of pages on Aliexpress that should be visited. Required fields are:

| Field | Type | Description |
| ----- | ---- | ----------- |
| startPage | Integer | (optional) Starting page for each category that scraped. With that option you can split your actor into multiple tasks. Default is 1. |
| endPage | Integer | (optional) End page for each category that scraped. With that option you can split your actor into multiple tasks. If not defined, then the actor will scrape all pages    |
| includeDescription | Boolean | (optional) If you want to fetch description HTML you can enable this option. However keep in mind that fetching description takes one extra request which makes your actor a bit slower and takes a bit much CUs.  |
| startUrls | Array | (optional) List of Aliexpress URLs. You should only provide category detail or product detail URLs |
| searchTerms | Array | (optional) List of terms what can be searched in aliexpress search engine |
| proxy | Object | Proxy configuration |
| maxFeedback | Integer | (optional) Max count of scraped feedbacks |
| maxQuestions | Integer | (optional) Max count of scraped buyer Q&A |
This solution requires the use of **Proxy servers**, either your own proxy servers or you can use <a href="https://www.apify.com/docs/proxy">Apify Proxy</a>.


### Compute Unit Consumption
The actor optimized to run blazing fast and scrape many product as possible. Therefore, it forefronts all product detail requests. If actor doesn't block very often it'll scrape ~14K products in 14 minutes with ~1.8-2.0 compute units.

### Aliexpress Scraper Input example
```json
{
	"startPage": 1,
	"endPage": 10,
	"includeDescription": false,
	"proxy":{"useApifyProxy": true},
	"startUrls":   [
		{ "url": "https://www.aliexpress.com/category/200003482/dresses.html" },
		{ "url": "https://www.aliexpress.com/item/32940810951.html" }
	],
        "maxFeedbacks": 10,
        "maxQuestions": 15
}

```

## During the Run

During the run, the actor will output messages letting you know what is going on. Each message always contains a short label specifying which page from the provided list is currently specified.
When items are loaded from the page, you should see a message about this event with a loaded item count and total item count for each page.

If you provide incorrect input to the actor, it will immediately stop with failure state and output an explanation of
what is wrong.

## Aliexpress Export

During the run, the actor stores results into a dataset. Each item is a separate item in the dataset.

You can manage the results in any languague (Python, PHP, Node JS/NPM). See the FAQ or <a href="https://www.apify.com/docs/api" target="blank">our API reference</a> to learn more about getting results from this Aliexpress actor.

## Scraped Aliexpress Posts
The structure of each item in Aliexpress products looks like this:

```json
{
  "id": 32940810951,
  "link": "https://www.aliexpress.com/item/32940810951.html",
  "title": "50Pcs  M3  M4 M5 M6 M8 M10 M12  DIN9021 GB96 304/A2-70 Stainless Steel Large Size Flat Washer",
  "tradeAmount": "747 orders",
  "averageStar": "5.0",
  "store": {
    "followingNumber": 367,
    "establishedAt": "Sep 2, 2014",
    "positiveNum": 6675,
    "positiveRate": "99.0%",
    "name": "Chang Da Transmission Store",
    "id": 1420163,
    "url": "https://www.aliexpress.com/store/1420163",
    "topRatedSeller": false
  },
  "specs": [
    {
      "Model Number": "M3 M4 M5 M6 M8 M10 M12"
    },
    {
      "is_customized": "Yes"
    },
    {
      "DIY Supplies": "Metalworking"
    }
  ],
  "categories": [
    "All Categories",
    "Home Improvement",
    "Hardware",
    "Fasteners & Hooks",
    "Washers"
  ],
  "wishedCount": 612,
  "quantity": 5036,
  "photos": [
    "https://ae01.alicdn.com/kf/HTB1qvwsXnHuK1RkSndVq6xVwpXa0/50Pcs-M3-M4-M5-M6-M8-M10-M12-DIN9021-GB96-304-A2-70-Stainless-Steel-Large.jpg"
  ],
  "skuOptions": [
    {
      "name": "Inner Diameter",
      "values": [
        "M4  50PCS",
        "M5  50PCS",
        "M6  20PCS",
        "M8  20PCS",
        "M10  10PCS",
        "M12  5PCS",
        "M3   50PCS"
      ]
    }
  ],
  "prices": [
    {
      "price": "US $0.88",
      "attributes": [
        "M16"
      ]
    },
    {
      "price": "US $3.99",
      "attributes": [
        "M18"
      ]
    },
    {
      "price": "US $3.12",
      "attributes": [
        "M1.5"
      ]
    },
    {
      "price": "US $2.99",
      "attributes": [
        "M21"
      ]
    },
    {
      "price": "US $3.99",
      "attributes": [
        "M3.5"
      ]
    },
    {
      "price": "US $3.99",
      "attributes": [
        "M2.6"
      ]
    },
    {
      "price": "US $1.99",
      "attributes": [
        "M17"
      ]
    }
  ],
  "companyId": 231710547,
  "memberId": 221826159,
  "description": "<h1 style=\"text-align: center;\">\tM3 &#xA0;M4 M5 M6 M8 M10 M12 &#xA0;DIN9021 GB96 304/A2-70 Stainless Steel Large Size Flat Washer </h1><p style=\"margin: 0.0px;text-align: center;\">\t<img src=\"https://ae01.alicdn.com/kf/HTB1xwcsXdfvK1RjSspfq6zzXFXaR.jpg?width=800&amp;height=800&amp;hash=1600\"><img src=\"https://ae01.alicdn.com/kf/HTB1lPv8fxTpK1RjSZFKq6y2wXXaL.jpg?width=775&amp;height=469&amp;hash=1244\"><img src=\"https://ae01.alicdn.com/kf/HTB1oJQcfAPoK1RjSZKbq6x1IXXaA.jpg?width=768&amp;height=456&amp;hash=1224\"></p><p style=\"text-align: center;\">\t&#xA0; </p><p style=\"text-align: center;\">\t&#xA0; </p><p style=\"margin: 0.0px;text-align: center;\">\t&#xA0; </p><p style=\"text-align: center;\">\t&#xA0; </p><p style=\"text-align: center;\">\t&#xA0; </p>\n<script>window.adminAccountId=221826159;</script>\n"
}

```
