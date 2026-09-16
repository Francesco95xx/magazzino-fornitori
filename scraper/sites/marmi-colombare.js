// Marmi Colombare — tabella statica, nome materiale in td.tableHeadRow.
const URL = "https://colombare.it/magazzino-lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("td.tableHeadRow").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su colombare.it/magazzino-lastre");

  return {
    id: "marmi-colombare",
    nome: "Marmi Colombare",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla tabella Magazzino Lastre — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-colombare" };
