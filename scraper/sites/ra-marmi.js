// R.A. Marmi — categoria "Marmi/Lastre" WooCommerce, unica pagina, nome
// materiale in h3 senza classe dentro il loop prodotti.
const URL = "http://www.ramarmi.com/categoria-prodotto/marmi/lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("ul.products h3").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su ramarmi.com/categoria-prodotto/marmi/lastre");

  return {
    id: "ra-marmi",
    nome: "R.A. Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla categoria Marmi/Lastre (WooCommerce, unica pagina) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "ra-marmi" };
