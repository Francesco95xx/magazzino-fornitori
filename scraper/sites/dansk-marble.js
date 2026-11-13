// Dansk Marble — shop paginato (/magazzino-online/N/, 10 pagine), nome in
// h6.product_title. Ogni card linka a una pagina /cat/magazzino-online/<slug>/
// con Dimensioni (il terzo numero è lo spessore), Finitura e "N DISPONIBILI".
const BASE = "https://www.danskmarble.com/magazzino-online/";
const SELECTOR = "h6.product_title";
const MAX_PAGES = 15;

async function scrape(context) {
  const page = await context.newPage();
  let raw = [];

  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : `${BASE}${n}/`;
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    if (!res || res.status() >= 400) break;
    const items = await page.locator(SELECTOR).evaluateAll((els) =>
      els.map((el) => {
        let card = el;
        for (let i = 0; i < 5 && card; i++) card = card.parentElement;
        const a = card ? card.querySelector('a[href*="/cat/magazzino-online/"]') : null;
        return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
      })
    );
    if (items.length === 0) break;
    raw = raw.concat(items);
  }

  const byName = new Map();
  const seenHrefs = new Set();
  for (const { nome, href } of raw) {
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { href, spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (!href || seenHrefs.has(href)) continue;
    seenHrefs.add(href);

    try {
      await page.goto(href, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      continue;
    }
    const info = await page.evaluate(() => {
      const txt = document.body.innerText;
      const dimMatch = txt.match(/Dimensioni\s+([\d.]+)\s*×\s*([\d.]+)\s*×\s*([\d.]+)\s*cm/i);
      const finMatch = txt.match(/Finitura\s*\n+\s*([^\n]+)/i);
      const qtyMatch = txt.match(/(\d+)\s*DISPONIBILI/i);
      return {
        spessore: dimMatch ? dimMatch[3] : null,
        lavorazione: finMatch ? finMatch[1].trim() : null,
        quantita: qtyMatch ? Number(qtyMatch[1]) : null,
      };
    });
    if (info.spessore) entry.spessori.add(Number(info.spessore));
    if (info.lavorazione) entry.lavorazioni.add(info.lavorazione);
    entry.blocchi.push({ numero: null, spessore: info.spessore, lavorazione: info.lavorazione || "", quantita: info.quantita });
  }
  await page.close();

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href,
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su danskmarble.com/magazzino-online");

  return {
    id: "dansk-marble",
    nome: "Dansk Marble",
    url: BASE,
    stato: "scraped",
    note:
      "Elenco letto scorrendo le pagine del Magazzino Online, con link diretto, spessore/finitura/quantità disponibile letti dalla scheda di ogni materiale — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "dansk-marble" };
