// Errebi Marmi (RB Marmi) — ogni materiale è un h2>strong separato nel testo
// della pagina "Materiali Disponibili".
const URL = "https://www.rbmarmi.it/materiali-disponibili/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("h2 strong").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su rbmarmi.it/materiali-disponibili");

  return {
    id: "errebi-marmi",
    nome: "Errebi Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai titoli materiale (h2 > strong) della pagina Materiali Disponibili — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "errebi-marmi" };
