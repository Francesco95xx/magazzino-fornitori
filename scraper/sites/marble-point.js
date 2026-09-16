// Marble Point — stessa piattaforma di Dalle Nogare: filtro "Nome" è un
// <select id="filter-nome"> con l'elenco completo dei materiali.
const URL = "https://www.marblepoint.it/magazzino-online-new/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator('select[id="filter-nome"] option').allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^nome$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro filter-nome");

  return {
    id: "marble-point",
    nome: "Marble Point",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "Nome" (select filter-nome) del magazzino online — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marble-point" };
