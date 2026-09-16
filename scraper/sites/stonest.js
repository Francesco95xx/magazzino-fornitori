// Stonest — tutte le lastre sono su un'unica pagina, nome materiale in
// h1 dentro div.magProduct.
const URL = "http://www.stonest.net/it/magazzino/lastre";
const SELECTOR = "div.magProduct h1";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su stonest.net/magazzino/lastre");

  return {
    id: "stonest",
    nome: "Stonest",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai titoli lastra della pagina Magazzino (tutte le lastre su un'unica pagina) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "stonest" };
