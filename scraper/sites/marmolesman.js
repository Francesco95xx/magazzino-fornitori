// MarmolesMan — filtro "TIPOLOGIA MATERIALE" è un <select id="id_materiale">
// con l'elenco completo dei materiali (prima opzione "Seleziona" esclusa).
const URL = "https://www.marmolesman.it/magazzino-online/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 30000 });

  const names = await page.locator("#id_materiale option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^seleziona$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro id_materiale");

  return {
    id: "marmolesman",
    nome: "MarmolesMan",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal filtro \"Tipologia materiale\" (select id_materiale) del magazzino online — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmolesman" };
