// A.A.TC — filtro "Material" è un <select id="ew_materiale"
// name="desc_materiale"> con l'elenco completo dei materiali (opzione "Any"
// esclusa). Stessa piattaforma di Veneta Marmi (naming ew_*).
const URL = "http://warehouse.aatc.it/en/#";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("#ew_materiale option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^any$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro ew_materiale");

  return {
    id: "aatc",
    nome: "A.A.TC",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "Material" (select ew_materiale) del warehouse — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "aatc" };
