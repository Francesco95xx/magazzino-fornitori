// Granitifavorita — il form di ricerca ha un <select name="material-name">
// con l'elenco completo dei nomi materiale distinti (opzione "TUTTI" esclusa).
const URL = "https://store.granitifavorita.com/store/it/search";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator('select[name="material-name"] option').allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && n !== "TUTTI"))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro material-name");

  return {
    id: "granitifavorita",
    nome: "Granitifavorita (magazzino)",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal filtro \"MATERIALE\" del motore di ricerca (select material-name), che contiene tutti i nomi materiale distinti a catalogo — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "granitifavorita" };
