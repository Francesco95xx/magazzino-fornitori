// Marmi Bocchese — filtro "Materiale" è un <select name="IdMateriale"> con
// l'elenco completo dei materiali (prima opzione "Tutti" esclusa).
const URL = "http://www.marmibocchese.it/index.php?I=0&Nc=1002&IL=&";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 30000 });

  const names = await page.locator('select[name="IdMateriale"] option').allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^tutti$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro IdMateriale");

  return {
    id: "marmi-bocchese",
    nome: "Marmi Bocchese",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal filtro \"Materiale\" (select IdMateriale) della pagina Disponibilità in magazzino — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-bocchese" };
