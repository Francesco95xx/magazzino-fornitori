// V. Fontanili Carrara — il filtro "Materiale" della pagina Slabs è una lista
// di pulsanti a.material-filter con l'elenco completo dei materiali distinti.
const URL = "https://www.nicolafontanili.com/slabs/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("a.material-filter").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro material-filter");

  return {
    id: "fontanili-carrara",
    nome: "V. Fontanili Carrara",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "Materiale" della pagina Slabs — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "fontanili-carrara" };
