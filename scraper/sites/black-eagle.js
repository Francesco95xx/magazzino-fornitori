// Black Eagle — shop WooCommerce paginato (/stock-online/page/N/), titolo
// prodotto è "<Materiale> (<codice>)".
const BASE = "https://blackeaglesrl.com/stock-online/";
const SELECTOR = "h1.woocommerce-loop-product__title";
const MAX_PAGES = 25;

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : `${BASE}page/${n}/`;
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    if (!res || res.status() >= 400) break;
    const names = await page.locator(SELECTOR).allTextContents();
    if (names.length === 0) break;
    all = all.concat(names);
  }
  await page.close();

  const cleaned = all.map((t) => t.replace(/\s*\([^)]*\)\s*$/, "").trim()).filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su blackeaglesrl.com/stock-online");

  return {
    id: "black-eagle",
    nome: "Black Eagle",
    url: BASE,
    stato: "scraped",
    note:
      'Elenco letto scorrendo le pagine dello shop (WooCommerce), ripulendo il suffisso "(codice)" dal titolo — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "black-eagle" };
