// Marmi 3Esse — pagina statica "I nostri materiali", un h3 per materiale
// dentro div.column_attr (raggruppati per categoria Granito/Marmo/ecc).
const URL = "https://www.3essegraniti.it/materiali/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("div.column_attr h3").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su 3essegraniti.it/materiali");

  return {
    id: "marmi-3esse",
    nome: "Marmi 3Esse",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla pagina Materiali (statica, tutte le categorie) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-3esse" };
