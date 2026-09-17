const fs = require("node:fs/promises");
const path = require("node:path");
const { parse } = require("csv-parse/sync");

const CSV_FILE = path.join(
  __dirname,
  "data",
  "books-to-scrape-products.csv"
);

const REPORT_FILE = path.join(
  __dirname,
  "validation-report.json"
);

const REQUIRED_FIELDS = [
  "title",
  "category",
  "price_gbp",
  "rating_1_to_5",
  "availability",
  "upc",
  "product_url",
];

async function validateData() {
  const csvContent = await fs.readFile(CSV_FILE, "utf8");

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  const missingFields = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, 0])
  );

  const upcValues = [];
  const categories = new Set();

  let invalidPrices = 0;
  let invalidRatings = 0;
  let invalidUrls = 0;

  for (const row of rows) {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field]) {
        missingFields[field] += 1;
      }
    }

    const price = Number(row.price_gbp);
    const rating = Number(row.rating_1_to_5);

    if (!Number.isFinite(price) || price <= 0) {
      invalidPrices += 1;
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      invalidRatings += 1;
    }

    try {
      const url = new URL(row.product_url);

      if (
        url.protocol !== "https:" ||
        url.hostname !== "books.toscrape.com"
      ) {
        invalidUrls += 1;
      }
    } catch {
      invalidUrls += 1;
    }

    if (row.upc) {
      upcValues.push(row.upc);
    }

    if (row.category) {
      categories.add(row.category);
    }
  }

  const uniqueUpcs = new Set(upcValues);
  const duplicateUpcs = upcValues.length - uniqueUpcs.size;
  const missingFieldTotal = Object.values(missingFields)
    .reduce((sum, count) => sum + count, 0);

  const passed =
    rows.length === 1000 &&
    missingFieldTotal === 0 &&
    duplicateUpcs === 0 &&
    invalidPrices === 0 &&
    invalidRatings === 0 &&
    invalidUrls === 0;

  const report = {
    passed,
    checked_at: new Date().toISOString(),
    source: "https://books.toscrape.com/",
    csv_file: "data/books-to-scrape-products-node.csv",
    expected_products: 1000,
    products_found: rows.length,
    categories_found: categories.size,
    unique_upcs: uniqueUpcs.size,
    duplicate_upcs: duplicateUpcs,
    invalid_prices: invalidPrices,
    invalid_ratings: invalidRatings,
    invalid_urls: invalidUrls,
    missing_fields: missingFields,
  };

  await fs.writeFile(
    REPORT_FILE,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );

  console.log("\nVALIDERINGSRESULTAT");
  console.log("-------------------");
  console.log(`Godkänd: ${passed ? "JA" : "NEJ"}`);
  console.log(`Produkter: ${rows.length}/1000`);
  console.log(`Kategorier: ${categories.size}`);
  console.log(`Unika UPC: ${uniqueUpcs.size}`);
  console.log(`Duplicerade UPC: ${duplicateUpcs}`);
  console.log(`Ogiltiga priser: ${invalidPrices}`);
  console.log(`Ogiltiga betyg: ${invalidRatings}`);
  console.log(`Ogiltiga URL:er: ${invalidUrls}`);
  console.log(`Saknade fält: ${missingFieldTotal}`);
  console.log(`Rapport: ${REPORT_FILE}`);

  if (!passed) {
    process.exitCode = 1;
  }
}

validateData().catch((error) => {
  console.error("Valideringen misslyckades:", error);
  process.exitCode = 1;
});