// Royal Marmi Carrara — filtro materiale è un
// <option class="facets-dropdown"> con l'elenco delle famiglie di materiale.
const URL = "https://www.royalmarmicarrara.it/it/prodotti";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("option.facets-dropdown").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro facets-dropdown");

  return {
    id: "royal-marmi-carrara",
    nome: "Royal Marmi Carrara",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dal filtro materiale della Ricerca Prodotti — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "royal-marmi-carrara" };
