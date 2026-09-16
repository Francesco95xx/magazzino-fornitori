// Alberti & Alberti — filtro "Nome Materiale" è un <select id="nomeMat">
// con l'elenco completo dei materiali (prima opzione "tutti" esclusa).
const URL = "https://magazzino.marmialberti.it/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("#nomeMat option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^tutti$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro nomeMat");

  return {
    id: "marmi-alberti",
    nome: "Alberti & Alberti",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "Nome Materiale" (select nomeMat) del magazzino online — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-alberti" };
