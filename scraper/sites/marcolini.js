// Marcolini Marmi — filtro "Filter by Name" è un <select id="filtroprodottoa"
// name="PRODOTTO"> con l'elenco completo dei materiali (prima opzione vuota).
const URL = "https://www.marcolinimarmi.com/outlet.asp";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("#filtroprodottoa option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro filtroprodottoa");

  return {
    id: "marcolini",
    nome: "Marcolini Marmi",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro "Filter by Name" (select filtroprodottoa) della pagina outlet — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marcolini" };
