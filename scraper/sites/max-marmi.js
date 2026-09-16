// Max Marmi Carrara — la pagina Magazzino elenca le famiglie di materiale
// come link filtro (a.oxy-read-more); non ci sono nomi lastra più specifici
// sulla pagina principale.
const URL = "https://www.maxmarmicarrara.com/it/magazzino/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("a.oxy-read-more").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su maxmarmicarrara.com/magazzino");

  return {
    id: "max-marmi",
    nome: "Max Marmi Carrara",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalle famiglie di materiale della pagina Magazzino — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "max-marmi" };
