// Il Fiorino Marmi — store online statico (nessuna paginazione, tutte le
// lastre già nel DOM), nome materiale in h2 dentro div.box-lastra.
// Nota: page.goto con waitUntil "networkidle" va in timeout su questo sito
// (richieste in background persistenti); usare "load" invece.
// Ogni card ha 3 div ".gridstock" nell'ordine Block num / Slabs / Sizes
// (il terzo numero delle Sizes è lo spessore).
const URL = "https://ilfiorino.store/";
const SELECTOR = "div.box-lastra h2";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2000);

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a");
      const box = el.closest("div.box-lastra");
      const stocks = box ? [...box.querySelectorAll(".gridstock")].map((d) => d.textContent.trim()) : [];
      const [numero, slabs, sizes] = stocks;
      const dimMatch = sizes ? sizes.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*([\d.]+)/i) : null;
      return {
        nome: (el.textContent || "").trim(),
        href: a ? a.href : null,
        numero: numero || null,
        quantita: slabs ? Number(slabs) : null,
        spessore: dimMatch ? dimMatch[3] : null,
      };
    })
  );
  await page.close();

  const byName = new Map();
  for (const e of raw) {
    if (!e.nome) continue;
    if (!byName.has(e.nome)) byName.set(e.nome, { href: e.href, spessori: new Set(), blocchi: [] });
    const entry = byName.get(e.nome);
    if (e.spessore) entry.spessori.add(Number(e.spessore));
    entry.blocchi.push({ numero: e.numero, spessore: e.spessore, lavorazione: "", quantita: e.quantita });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su ilfiorino.store");

  return {
    id: "il-fiorino",
    nome: "Il Fiorino Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai titoli lastra dello store online, con link diretto, numero blocco/spessore/lastre disponibili per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "il-fiorino" };
