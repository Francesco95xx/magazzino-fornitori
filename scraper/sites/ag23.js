// A&G 23 — piattaforma StoneCash (OpenCart); param limit=1000 mostra tutti i
// prodotti in una sola pagina. Titolo è "<Materiale> <spessore> CM".
const URL =
  "https://ag23.stonecash.net/index.php?route=product/manufacturer/info&manufacturer_id=0&limit=1000";
const SELECTOR = "div.name a";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const cleaned = raw.map((t) => t.replace(/\s*\d+(\.\d+)?\s*cm\s*$/i, "").trim()).filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su ag23.stonecash.net");

  return {
    id: "ag23",
    nome: "A&G 23",
    url: "https://ag23.stonecash.net/index.php?route=product/manufacturer/info",
    stato: "scraped",
    note:
      'Elenco letto dalla pagina prodotti con limit=1000 (tutti i risultati in una pagina), ripulendo il suffisso "<spessore> CM" — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "ag23" };
