[https://apify.com/epctex/aliexpress-scraper](https://apify.com/epctex/aliexpress-scraper?fpr=yhdrb)

# Actor - Aliexpress Scraper

## Aliexpress scraper

Since Aliexpress doesn't provide an API, this actor should help you to retrieve data from it.

The Aliexpress data scraper supports the following features:

- Scrape product details - you can scrape attributes like images, shipping, and metadata. You can find details below.
- Scrape product descriptions - you can scrape the description HTML of the product.
- Scrape feedback on product detail - you can scrape user's feedback (name, country, original content, translated content)
- Scrape questions of product detail - you can scrape buyer's Q&A of product
- You can set language, currency, and region for shipping

### Aliexpress specific
Don't worry when you get a little bit different products than you saw on the browser page. Aliexpress is ordering products differently for each user.

## Need to find product pairs between Aliexpress and another online shop?

Use the [AI Product Matcher](https://apify.com/equidem/ai-product-matcher?fpr=yhdrb)🔗. This AI model allows you to compare items from different web stores, identifying exact matches and comparing real-time data obtained via web scraping. 

With the AI Product Matcher, you can use scraped product data to monitor product matches across the industry, implement dynamic pricing for your website, replace or complement manual mapping, and obtain realistic estimates against your competition for upcoming promo campaigns. Most importantly, it is relatively easy to get started with (just follow [this guide](https://blog.apify.com/product-matching-ai-pricing-intelligence-web-scraping/)) and is able to **match thousands of product pairs**.

## Bugs, fixes, updates, and changelog

This scraper is under active development. If you have any feature requests you can create an issue from [here](https://github.com/epctex/aliexpress-scraper/issues).

## Input Parameters

The input of this scraper should be JSON containing the list of pages on Aliexpress that should be visited. Possible fields are:

- `startUrls`: (Optional) (Array) List of Aliexpress URLs. You should only provide category detail or product detail URLs.

- `searchTerms`: (Optional) (Array) List of terms that can be searched in aliexpress search engine.

- `language`: (Optional) (String) Select a language from the list in which will be product's default is English (en_US).

- `shipTo`: (Optional) (String) Select the country where the products will be shipped default is US.

- `currency`: (Optional) (String) Select the currency in which the product's price will default is USD.

- `searchInSubcategories`: (Optional) (Boolean) You can turn off searching in subcategories. Default is true.

- `includeDescription`: (Optional) (Boolean) If you want to fetch description HTML you can enable this option. However, keep in mind that fetching description takes one extra request which makes your actor a bit slower and takes a bit much more resources.

- `maxFeedback`: (Optional) (Number)  Max count of scraped feedback.

- `maxQuestions`: (Optional) (Number)  Max count of scraped buyer Q&A.

- `maxItems`: (Optional) (Number)  You can limit scraped products. This should be useful when you search through all subcategories. The default is 1000 products.

- `proxy`: (Required) (Proxy Object) Proxy configuration.

- `extendOutputFunction`: (Optional) (String) Function that takes a JQuery handle ($) as an argument and returns an object with data.

This solution requires the use of **Proxy servers**, either your own proxy servers or you can use [Apify Proxy](https://www.apify.com/docs/proxy).


### Tip
When you want to scrape over a specific listing URL, just copy and paste the link as one of the **startUrl**.

When you add category URL to **startUrls** set **start** and **end** page and let **searchInSubcategories** parameter on
the logic of the start and end page will be propagated to all subcategories so in fact actors scrape much more products than you assume.

### Compute Unit Consumption
The actor is optimized to run blazing fast and scrape many listings as possible. Therefore, it forefronts all listing detail requests. If the actor doesn't block very often it'll scrape 100 listings in 2 minutes with ~0.03-0.05 compute units.

### Aliexpress Scraper Input example
```json
{
  "searchTerms": ["mobile"],
  "language": "en_US",
  "shipTo": "US",
  "currency": "USD",
  "includeDescription": false,
  "proxy":{"useApifyProxy": true},
  "startUrls":   [
    { "url": "https://www.aliexpress.com/category/200003482/dresses.html" },
    { "url": "https://www.aliexpress.com/item/32940810951.html" }
  ],
  "maxFeedbacks": 5,
  "maxQuestions":3
}

```

## During the Run

During the run, the actor stores results into a dataset. Each item is a separate item in the dataset.

You can manage the results in any languague (Python, PHP, Node JS/NPM). See the FAQ or <a href="https://www.apify.com/docs/api" target="blank">our API reference</a> to learn more about getting results from this Aliexpress actor.

## Aliexpress Export

During the run, the actor stores results into a dataset. Each item is a separate item in the dataset.

You can manage the results in any languague (Python, PHP, Node JS/NPM). See the FAQ or <a href="https://www.apify.com/docs/api" target="blank">our API reference</a> to learn more about getting results from this Aliexpress actor.

## Scraped Aliexpress Posts
The structure of each item in Aliexpress products looks like this:

```json
{
  "id": 33030949663,
  "link": "https://www.aliexpress.com/item/33030949663.html?algo_pvid=4f9da8f7-0d3c-4484-9db1-cafaf699a955&algo_expid=4f9da8f7-0d3c-4484-9db1-cafaf699a955-58&btsid=0ab6fab215937737510214942edbed&ws_ab_test=searchweb0_0,searchweb201602_,searchweb201603_",
  "ownerMemberId": 220138526,
  "title": "Ultra Thin Mobile Phone Cases for Xiaomi Mi 9T / 9T Pro Back Cover Case 360 Camera Protective Mi9TPro 9TPro Silicone TPU Coque",
  "tradeAmount": "2786 orders",
  "averageStar": "4.7",
  "descriptionURL": "https://aeproductsourcesite.alicdn.com/product/description/pc/v2/en_US/desc.htm?productId=33030949663&key=H8e670276aa194227861097826443d8f5D.zip&token=b95e1a6f392242c57140d3e166d276ad",
  "store": {
    "followingNumber": 9468,
    "establishedAt": "Oct 3, 2013",
    "positiveNum": 12506,
    "positiveRate": "94.7%",
    "name": "GOINSIE Official Store",
    "id": 937981,
    "url": "https://www.aliexpress.com/store/937981",
    "topRatedSeller": true
  },
  "specs": [
    {
      "Brand Name": "GOINSIE"
    },
    {
      "Type": "Fitted Case"
    },
    {
      "Features": "Transparent & Clear Soft"
    },
    {
      "Compatible Brand": "Xiaomi"
    },
    {
      "Design": "Plain"
    },
    {
      "Design": "Transparent"
    },
    {
      "Function": "Waterproof"
    },
    {
      "Function": "Dirt-resistant"
    },
    {
      "Function": "Anti-knock"
    },
    {
      "Function": "Heavy Duty Protection"
    },
    {
      "Function": "Adsorption"
    },
    {
      "Model Number": "for Xiaomi Mi 9T / 9T Pro"
    },
    {
      "Status": "In Stock"
    },
    {
      "Delivery": "Free Shipping"
    }
  ],
  "categories": [
    "All Categories",
    "Cellphones & Telecommunications",
    "Phone Bags & Cases",
    "Fitted Cases"
  ],
  "wishedCount": 4791,
  "quantity": 1258,
  "photos": [
    "https://ae01.alicdn.com/kf/H313c225b670445348cddb28c5648c3f70/Ultra-Thin-Mobile-Phone-Cases-for-Xiaomi-Mi-9T-9T-Pro-Back-Cover-Case-360-Camera.jpg",
    "https://ae01.alicdn.com/kf/H90116ac8272f4d4dba9b3843b94dbf28i/Ultra-Thin-Mobile-Phone-Cases-for-Xiaomi-Mi-9T-9T-Pro-Back-Cover-Case-360-Camera.jpg",
    "https://ae01.alicdn.com/kf/H34a75c2ff0054e939864a990bda3441bs/Ultra-Thin-Mobile-Phone-Cases-for-Xiaomi-Mi-9T-9T-Pro-Back-Cover-Case-360-Camera.jpg",
    "https://ae01.alicdn.com/kf/H1c5ffbcaf51943bcaf865635fafebe42D/Ultra-Thin-Mobile-Phone-Cases-for-Xiaomi-Mi-9T-9T-Pro-Back-Cover-Case-360-Camera.jpg",
    "https://ae01.alicdn.com/kf/H4b8c575d6ee240d3a8c291309ca5c978n/Ultra-Thin-Mobile-Phone-Cases-for-Xiaomi-Mi-9T-9T-Pro-Back-Cover-Case-360-Camera.jpg",
    "https://ae01.alicdn.com/kf/H983e6b11f05e48c38ac899ae11686ffem/Ultra-Thin-Mobile-Phone-Cases-for-Xiaomi-Mi-9T-9T-Pro-Back-Cover-Case-360-Camera.jpg"
  ],
  "skuOptions": [
    {
      "name": "Material",
      "values": [
        "Xiaomi Mi 9T",
        "Xiaomi Mi 9T Pro"
      ]
    },
    {
      "name": "Color",
      "values": [
        null
      ]
    }
  ],
  "prices": [
    {
      "price": "US $3.39",
      "attributes": [
        "PC",
        "Clear"
      ]
    },
    {
      "price": "US $3.39",
      "attributes": [
        "TPU",
        "Clear"
      ]
    }
  ],
  "shipping": [
    {
      "provider": "China Post Air Parcel",
      "isShippable": true,
      "isFree": true,
      "deliveryDate": "Jul 24",
      "from": "China",
      "to": "United States",
      "isTracked": false
    },
    {
      "provider": "Seller's Shipping Method",
      "isShippable": true,
      "isFree": true,
      "deliveryDate": "2023-08-12",
      "from": "China",
      "to": "United States",
      "isTracked": false
    },
    {
      "provider": "DHL",
      "isShippable": true,
      "isFree": false,
      "price": "$653.94",
      "deliveryDate": "Jun 16",
      "from": "China",
      "to": "United States",
      "isTracked": true
    }
  ],
  "companyId": 230202141,
  "memberId": 220138526,
  "userFeedbacks": [
    {
      "userName": "I***v",
      "userCountry": "RU",
      "productType": "Color:Clear",
      "reviewContent": "The seller is well done, fast delivery, all as in the description.",
      "reviewTime": "26 Jun 2020 03:40"
    },
    {
      "userName": "A***a",
      "userCountry": "RU",
      "productType": "Color:Clear",
      "reviewContent": "Ordered 04.12.2019, received 25.01.2020 in the Sverdlovsk region.\r\nSilicone Case, transparent, in the hands does not slip, hold in the hand comfortably, went perfectly to the phone, all holes in place,\r\nFingerprints leaves\r\nThe seller is honest, sent",
      "reviewTime": "25 Jan 2020 21:54"
    },
    {
      "userName": "P***v",
      "userCountry": "RU",
      "productType": "Color:Clear",
      "reviewContent": "Record delivery to Syzran. 12 days! Faster than the phone for which I ordered. A new way of gluing I liked, the films perfectly lay down and perfectly fit in size. Boldly order.",
      "reviewTime": "22 Jan 2020 04:01"
    },
    {
      "userName": "G***g",
      "userCountry": "RU",
      "productType": "Color:Clear",
      "reviewContent": "Normal silicone case. The side of the cover does not stand for the edges of the screen. The complete case is better.",
      "reviewTime": "16 May 2020 01:22"
    },
    {
      "userName": "A***v",
      "userCountry": "RU",
      "productType": "Color:Clear",
      "reviewContent": "Everything came quickly, quality. I ordered 2 PCs transparent",
      "reviewTime": "06 Apr 2020 09:08"
    }
  ],
  "questionAndAnswers": [
    {
      "lang": "ru",
      "totalAnswer": 4,
      "originalContent": "Подойдёт для xiaomi k20? ",
      "translateContent": "Suitable for Xiaomi K20?",
      "answers": [
        {
          "lang": "ru",
          "originalContent": "конечно да",
          "translateContent": "Of course yes"
        }
      ]
    },
    {
      "lang": "es",
      "totalAnswer": 3,
      "originalContent": "protege las cámaras??",
      "translateContent": "Protects the still cameras??",
      "answers": [
        {
          "lang": "ru",
          "originalContent": "Абсолютно свободное движение. ",
          "translateContent": "Absolutely free movement."
        }
      ]
    },
    {
      "lang": "ru",
      "totalAnswer": 3,
      "originalContent": "скольский?",
      "translateContent": "Skolsky?",
      "answers": [
        {
          "lang": "uk",
          "originalContent": "нет,как раз норм ",
          "translateContent": ""
        }
      ]
    },
    {
      "lang": "ru",
      "totalAnswer": 2,
      "originalContent": "Защитное стекло не поднимает?",
      "translateContent": "Protective glass does not lift?",
      "answers": [
        {
          "lang": "ru",
          "originalContent": "ой,бро, это не тот чехол, а этот чехол мне даже не пришел",
          "translateContent": "Oh, bro, this is not the case, and this case did not even come to me"
        }
      ]
    },
    {
      "lang": "ru",
      "totalAnswer": 2,
      "originalContent": "Заказал прошло 78 дней не пришло продавец не отвечает УРО Д",
      "translateContent": "Ordered 78 days passed did not come the seller does not answer the uro D",
      "answers": [
        {
          "lang": "ru",
          "originalContent": "Мне дошел за три недели, одним пакетом вместе с еще пятью заказами от разных продавцов. ",
          "translateContent": "I got in three weeks, one package together with five more orders from different sellers."
        }
      ]
    }
  ]
}

```

## Contact
Please visit us through [epctex.com](https://epctex.com) to see all the products that are available for you. If you are looking for any custom integration or so, please reach out to us through the chat box in [epctex.com](https://epctex.com). In need of support? [devops@epctex.com](mailto:devops@epctex.com) is at your service.
