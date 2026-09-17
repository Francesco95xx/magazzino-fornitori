// Il Fiorino Marmi — store online statico (nessuna paginazione, tutte le
// lastre già nel DOM), nome materiale in h2 dentro div.box-lastra.
// Nota: page.goto con waitUntil "networkidle" va in timeout su questo sito
// (richieste in background persistenti); usare "load" invece.
const URL = "https://ilfiorino.store/";
const SELECTOR = "div.box-lastra h2";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2000);

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su ilfiorino.store");

  return {
    id: "il-fiorino",
    nome: "Il Fiorino Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai titoli lastra dello store online — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "il-fiorino" };
