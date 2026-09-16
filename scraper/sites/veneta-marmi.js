// Veneta Marmi — filtro "Materiale" è un <select id="ew_materiale"
// name="desc_materiale"> con l'elenco completo dei materiali (opzione
// "Tutti" esclusa). Stessa piattaforma di A.A.TC (naming ew_*).
const URL = "https://magazzino.venetamarmi.it/it/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("#ew_materiale option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^tutti$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro ew_materiale");

  return {
    id: "veneta-marmi",
    nome: "Veneta Marmi",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "Materiale" (select ew_materiale) del Magazzino Online — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "veneta-marmi" };
