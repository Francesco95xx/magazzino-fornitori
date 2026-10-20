// A&G 23 — piattaforma StoneCash (OpenCart); param limit=1000 mostra tutti i
// prodotti in una sola pagina. Titolo è "<Materiale> <spessore> CM".
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL =
  "https://ag23.stonecash.net/index.php?route=product/manufacturer/info&manufacturer_id=0&limit=1000";
const SELECTOR = "div.name a";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => ({ text: (el.textContent || "").trim(), href: el.href }))
  );
  await page.close();

  const entries = raw
    .map(({ text, href }) => ({ nome: text.replace(/\s*\d+(\.\d+)?\s*cm\s*$/i, "").trim(), href }))
    .filter((e) => e.nome);
  const materiali = dedupeWithUrl(entries);
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su ag23.stonecash.net");

  return {
    id: "ag23",
    nome: "A&G 23",
    url: "https://ag23.stonecash.net/index.php?route=product/manufacturer/info",
    stato: "scraped",
    note:
      'Elenco letto dalla pagina prodotti con limit=1000 (tutti i risultati in una pagina), ripulendo il suffisso "<spessore> CM", con link diretto alla scheda prodotto — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "ag23" };
