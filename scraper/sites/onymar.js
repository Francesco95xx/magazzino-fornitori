// Onymar — pagina Materiali paginata (3 pagine), nome in
// h3.grid-entry-title.
const BASE = "https://onymar.com/materials/";
const PAGES = [BASE, `${BASE}page/2/`, `${BASE}page/3/`];
const SELECTOR = "h3.grid-entry-title";

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (const url of PAGES) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    const names = await page.locator(SELECTOR).allTextContents();
    all = all.concat(names);
  }
  await page.close();

  const unique = [...new Set(all.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su onymar.com/materials");

  return {
    id: "onymar",
    nome: "Onymar",
    url: BASE,
    stato: "scraped",
    note: "Elenco letto scorrendo le 3 pagine di Materiali — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "onymar" };
