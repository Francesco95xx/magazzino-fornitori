// Ferrari Marmi — magazzino paginato (?pagenum=N), ogni blocco è
// "BLOCCHI IN <MATERIALE>" in span.titolo.uppercase; ripuliamo il prefisso.
const BASE = "https://www.ferrarimarmi.com/it/magazzino";
const SELECTOR = "span.titolo.uppercase";
const MAX_PAGES = 25;

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : `${BASE}?pagenum=${n}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    const names = await page.locator(SELECTOR).allTextContents();
    if (names.length === 0) break;
    all = all.concat(names);
  }
  await page.close();

  const cleaned = all
    .map((t) => t.replace(/^(blocchi\s+in|lastre\s+grezze\s+in|lastre\s+in)\s+/i, "").trim())
    .filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su ferrarimarmi.com/magazzino");

  return {
    id: "ferrari-marmi",
    nome: "Ferrari Marmi",
    url: BASE,
    stato: "scraped",
    note:
      'Elenco letto scorrendo le pagine del Magazzino online, ripulendo il prefisso "BLOCCHI IN" dal titolo — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "ferrari-marmi" };
