// A&G 23 — piattaforma StoneCash (OpenCart); param limit=1000 mostra tutti i
// prodotti in una sola pagina. Titolo è "<Materiale> <spessore> CM" (lo
// spessore è quindi già nel nome, non serve una pagina di dettaglio).
const URL = "https://ag23.stonecash.net/index.php?route=product/manufacturer/info&manufacturer_id=0&limit=1000";
const SELECTOR = "div.name a";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => ({ text: (el.textContent || "").trim(), href: el.href }))
  );
  await page.close();

  const byName = new Map();
  for (const { text, href } of raw) {
    const m = text.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*cm\s*$/i);
    const nome = (m ? m[1] : text).trim();
    const spessore = m ? m[2] : null;
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { href, spessori: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (spessore) entry.spessori.add(Number(spessore));
    entry.blocchi.push({ numero: null, spessore, lavorazione: "", quantita: null });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href,
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [],
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su ag23.stonecash.net");

  return {
    id: "ag23",
    nome: "A&G 23",
    url: "https://ag23.stonecash.net/index.php?route=product/manufacturer/info",
    stato: "scraped",
    note:
      'Elenco letto dalla pagina prodotti con limit=1000 (tutti i risultati in una pagina), con link diretto alla scheda prodotto e spessore ricavato dal suffisso del titolo — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "ag23" };
