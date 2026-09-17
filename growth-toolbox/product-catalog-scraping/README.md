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

## Method

The Node.js scraper:

1. Visits all catalogue pages.
2. Collects every product URL.
3. Visits each product page.
4. Extracts the selected fields from the HTML.
5. Structures the results as CSV.
6. Pauses briefly between requests.
7. Validates the resulting dataset.

## Run the project

Install the dependencies:

```bash
npm install