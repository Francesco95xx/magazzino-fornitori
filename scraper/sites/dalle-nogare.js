// Dalle Nogare Graniti — la pagina ha due filtri "Nome" separati (catalogo
// generale + sezione Quarzo), entrambi <select id="filter-nome">; li uniamo.
const URL = "https://www.dallenogaregraniti.it/en/online-warehouse/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator('select[id="filter-nome"] option').allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^nome$/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nei filtri filter-nome");

  return {
    id: "dalle-nogare",
    nome: "Dalle Nogare Graniti",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai filtri \"Nome\" (select filter-nome, catalogo generale + sezione Quarzo) del magazzino online — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "dalle-nogare" };
