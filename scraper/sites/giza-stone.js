// Giza Stone — il filtro "Materiale" della pagina è un
// <select id="filtroIDMateriale"> con l'elenco completo dei materiali
// (molto più affidabile dei gruppi mostrati di default, che si fermano ai
// primi caricati senza scroll infinito).
const URL = "https://www.gizastone.com/it/magazzino-online/magazzino-online.asp";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("#filtroIDMateriale option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^-\s*tutti/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro filtroIDMateriale");

  return {
    id: "giza-stone",
    nome: "Giza Stone",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai titoli dei gruppi materiale (b.titleMag) con scroll fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "giza-stone" };
