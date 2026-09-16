// Solfagroup — store paginato via ?page=N, nome materiale in span.realTitle.
const BASE = "https://www.solfagroup.com/it/store/index";
const SELECTOR = "span.realTitle";
const MAX_PAGES = 30;

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : `${BASE}/0?page=${n}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    const names = await page.locator(SELECTOR).allTextContents();
    if (names.length === 0) break;
    all = all.concat(names);
  }
  await page.close();

  const unique = [...new Set(all.map((t) => t.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su solfagroup.com/store");

  return {
    id: "solfagroup",
    nome: "Solfagroup",
    url: BASE,
    stato: "scraped",
    note: "Elenco letto scorrendo le pagine dello store (parametro ?page=N) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "solfagroup" };
