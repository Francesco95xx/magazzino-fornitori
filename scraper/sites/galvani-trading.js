// Galvani Trading — 3 pagine di risultati con paginazione a bottoni (stato
// JS, niente URL/href), nome materiale in h3.text-xl.font-bold. Ogni card
// (3 livelli sopra l'h3) ha testo libero "NOME\nBL-codice\nColore\nTipo\n...
// \n<N>x\n<L>x<W>x<spessore>\n(<mq> M²)".
const URL = "https://www.warehousenaturalstone.com/galvani-trading/slabs";
const SELECTOR = "h3.text-xl.font-bold";

function extractCards(page) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((h3) => {
      let card = h3;
      for (let i = 0; i < 3 && card; i++) card = card.parentElement;
      const text = card ? card.innerText : "";
      const numero = (text.match(/BL-?(\S+)/i) || [])[0] || null;
      const qtyMatch = text.match(/(\d+)x\s*\n/);
      const dimMatch = text.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x([\d.]+)/);
      return {
        nome: (h3.textContent || "").trim(),
        numero,
        quantita: qtyMatch ? Number(qtyMatch[1]) : null,
        spessore: dimMatch ? dimMatch[3] : null,
      };
    });
  }, SELECTOR);
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let all = [];
  for (let n = 1; n <= 20; n++) {
    all = all.concat(await extractCards(page));
    const btn = page.locator(`button:text-is("${n + 1}")`);
    if ((await btn.count()) === 0) break;
    await btn.first().click();
    await page.waitForTimeout(1200);
  }
  await page.close();

  const byName = new Map();
  for (const c of all) {
    const nome = c.nome && c.nome.trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (c.spessore) entry.spessori.add(Number(c.spessore));
    entry.blocchi.push({ numero: c.numero, spessore: c.spessore, lavorazione: "", quantita: c.quantita });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [],
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su warehousenaturalstone.com/galvani-trading");

  return {
    id: "galvani-trading",
    nome: "Galvani Trading",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto scorrendo le pagine di risultati (paginazione a bottoni), con numero blocco/spessore/lastre disponibili per blocco letti dal testo di ogni card — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "galvani-trading" };
