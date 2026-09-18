const fs = require("node:fs/promises");
const path = require("node:path");
const cheerio = require("cheerio");

const BASE_URL = "https://books.toscrape.com/";
const OUTPUT_FOLDER = path.join(__dirname, "data");
const OUTPUT_FILE = path.join(
  OUTPUT_FOLDER,
  "books-to-scrape-products.csv"
);

const RATING_VALUES = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function getPage(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Erik-Hjelmstrom-Berghs-Educational-Project/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.log(
        `Försök ${attempt} misslyckades för ${url}: ${error.message}`
      );

      await delay(attempt * 1000);
    }
  }

  return null;
}

async function collectProductUrls() {
  const productUrls = [];
  const knownUrls = new Set();

  let pageUrl = BASE_URL;
  let pageNumber = 1;

  while (pageUrl) {
    console.log(`Läser katalogsida ${pageNumber}...`);

    const html = await getPage(pageUrl);

    if (!html) {
      break;
    }

    const $ = cheerio.load(html);

    $("article.product_pod h3 a").each((index, element) => {
      const href = $(element).attr("href");
      const productUrl = new URL(href, pageUrl).href;

      if (!knownUrls.has(productUrl)) {
        knownUrls.add(productUrl);
        productUrls.push(productUrl);
      }
    });

    const nextHref = $("li.next a").attr("href");
    pageUrl = nextHref
      ? new URL(nextHref, pageUrl).href
      : null;

    pageNumber += 1;
    await delay(100);
  }

  return productUrls;
}

async function scrapeProduct(productUrl) {
  const html = await getPage(productUrl);

  if (!html) {
    return null;
  }

  const $ = cheerio.load(html);

  const title = cleanText($("div.product_main h1").text());
  const priceText = cleanText($("p.price_color").first().text());
  const availability = cleanText(
    $("p.instock.availability").first().text()
  );

  const ratingClasses = $("p.star-rating")
    .first()
    .attr("class")
    ?.split(/\s+/) ?? [];

  const ratingWord = ratingClasses.find(
    (className) => RATING_VALUES[className]
  );

  const breadcrumbs = $("ul.breadcrumb li")
    .map((index, element) => cleanText($(element).text()))
    .get();

  const category = breadcrumbs.at(-2) ?? "";
  const productInformation = {};

  $("table.table.table-striped tr").each((index, row) => {
    const key = cleanText($(row).find("th").text());
    const value = cleanText($(row).find("td").text());

    productInformation[key] = value;
  });

  return {
    title,
    category,
    price_gbp: priceText.replace("£", "").trim(),
    rating_1_to_5: RATING_VALUES[ratingWord] ?? "",
    availability,
    upc: productInformation.UPC ?? "",
    product_url: productUrl,
  };
}

function escapeCsvValue(value) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

async function saveCsv(products) {
  const columns = [
    "title",
    "category",
    "price_gbp",
    "rating_1_to_5",
    "availability",
    "upc",
    "product_url",
  ];

  const lines = [
    columns.map(escapeCsvValue).join(","),
    ...products.map((product) =>
      columns
        .map((column) => escapeCsvValue(product[column]))
        .join(",")
    ),
  ];

  await fs.mkdir(OUTPUT_FOLDER, { recursive: true });

  await fs.writeFile(
    OUTPUT_FILE,
    `\uFEFF${lines.join("\n")}\n`,
    "utf8"
  );
}

async function main() {
  const productUrls = await collectProductUrls();

  console.log(`\nHittade ${productUrls.length} produktlänkar.\n`);

  const products = [];

  for (let index = 0; index < productUrls.length; index += 1) {
    console.log(
      `Scrapar produkt ${index + 1}/${productUrls.length}`
    );

    const product = await scrapeProduct(productUrls[index]);

    if (product) {
      products.push(product);
    }

    await delay(100);
  }

  await saveCsv(products);

  console.log("\nScrapingen är klar.");
  console.log(`Produkter sparade: ${products.length}`);
  console.log(`CSV-fil: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Scrapingen misslyckades:", error);
  process.exitCode = 1;
});