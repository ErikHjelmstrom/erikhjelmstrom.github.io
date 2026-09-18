# From HTML to analysis-ready product data

An educational web scraping project created for Erik Hjelmström’s Growth Marketing portfolio at Berghs.

## Question

How can an ecommerce catalogue be transformed from website content into a structured and validated dataset?

## Source

The data was collected from [Books to Scrape](https://books.toscrape.com/), a demo ecommerce website created specifically for web scraping practice.

The website states that its prices and ratings are randomly assigned. The dataset must therefore not be interpreted as evidence about real customers, demand or the book market.

## Dataset

The scraper collects:

- Product title
- Category
- Price in GBP
- Rating from 1 to 5
- Availability
- UPC product identifier
- Product URL

The final CSV contains:

- 1,000 products
- 50 categories
- 1,000 unique UPC identifiers

The generated dataset is stored in:

```text
data/books-to-scrape-products.csv
```

## Method

The Node.js scraper:

1. Visits all catalogue pages.
2. Collects every product URL.
3. Visits each product page.
4. Extracts the selected fields from the HTML.
5. Structures the results as CSV.
6. Pauses briefly between requests.
7. Validates the resulting dataset.

## Responsible use

The scraper targets a demonstration website made specifically for scraping practice.

Requests are made sequentially with a short delay to avoid unnecessary load. The project should not be adapted to scrape another website without first checking that website’s terms, robots guidance and applicable rules.

## Scraper file

The scraper source is published as:

```text
scraper.txt
```

It contains JavaScript but uses a text-file extension so it cannot be treated as a normal browser script on the published portfolio.

It is only executed through Node.js with an explicit local command.

## Run the project

Node.js and npm are required.

Install the dependencies:

```bash
npm install
```

Run the scraper explicitly:

```bash
npm run scrape
```

Validate the generated CSV:

```bash
npm run validate
```

## Validation

The validation script checks:

- Expected product count
- Required fields
- Unique UPC identifiers
- Valid prices
- Ratings between 1 and 5
- Valid product URLs
- Missing values

The completed validation returned:

- Products: 1,000 of 1,000
- Categories: 50
- Unique UPC identifiers: 1,000
- Duplicate UPC identifiers: 0
- Invalid prices: 0
- Invalid ratings: 0
- Invalid URLs: 0
- Missing fields: 0
- Validation passed: yes

The machine-readable report is stored in:

```text
validation-report.json
```

## Limitations

Books to Scrape is a fictional catalogue. Its prices, ratings and availability do not represent real commercial behaviour.

The project demonstrates collection, structuring and validation methodology rather than market research or customer analysis.