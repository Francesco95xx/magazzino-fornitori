// Dansk Marble — shop paginato (/magazzino-online/N/, 10 pagine), nome in
// h6.product_title.
const BASE = "https://www.danskmarble.com/magazzino-online/";
const SELECTOR = "h6.product_title";
const MAX_PAGES = 15;

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : `${BASE}${n}/`;
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    if (!res || res.status() >= 400) break;
    const names = await page.locator(SELECTOR).allTextContents();
    if (names.length === 0) break;
    all = all.concat(names);
  }
  await page.close();

  const unique = [...new Set(all.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su danskmarble.com/magazzino-online");

  return {
    id: "dansk-marble",
    nome: "Dansk Marble",
    url: BASE,
    stato: "scraped",
    note: "Elenco letto scorrendo le pagine del Magazzino Online — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "dansk-marble" };
