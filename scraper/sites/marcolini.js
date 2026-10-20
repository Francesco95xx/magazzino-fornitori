// Marcolini Marmi — filtro "Filter by Name" è un <select id="filtroprodottoa"
// name="PRODOTTO"> con l'elenco completo dei materiali (prima opzione vuota).
// Non va letto da outlet.asp ("Best Price Corner", solo 35 materiali in
// saldo/clearance): il vero magazzino online è stonegallery.asp ("Stone
// Gallery", 215 materiali) — verificato dal vivo 2026-10-20.
const URL = "https://www.marcolinimarmi.com/stonegallery.asp";

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
    note:
      'Elenco letto dal filtro "Filter by Name" (select filtroprodottoa) della vera Stone Gallery online (non più il solo outlet/clearance) — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marcolini" };
