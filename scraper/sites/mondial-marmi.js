// Mondial Marmi — pagina Materiali (tema Avada/Fusion), nome pulito in
// a.fusion-rollover-title-link.
const URL = "https://www.mondialmarmi.com/materials/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("a.fusion-rollover-title-link").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su mondialmarmi.com/materials");

  return {
    id: "mondial-marmi",
    nome: "Mondial Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla pagina Materiali — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "mondial-marmi" };
