// Vitoria Stone — filtro "MATERIALI" è un <select id="framework"
// name="filtro_materali[]"> con l'elenco completo dei materiali.
const URL = "https://www.vitoriastone.it/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("#framework option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro framework");

  return {
    id: "vitoria-stone",
    nome: "Vitoria Stone",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "MATERIALI" (select framework) del magazzino online — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "vitoria-stone" };
