// Solfagroup — store paginato via ?page=N. Ogni card (.item) ha nome
// (span.realTitle), codice blocco, misure cm (il terzo numero è lo
// spessore), finitura e disponibilità (mq) dentro .title/.description.
const BASE = "https://www.solfagroup.com/it/store/index";
const MAX_PAGES = 30;

function extractCards(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll(".item")].map((item) => {
      const nome = item.querySelector(".realTitle")?.textContent.trim() || null;
      const titleText = item.querySelector(".title")?.textContent || "";
      const codiceMatch = titleText.match(/codice:\s*([^\n]+)/);
      const misureMatch = titleText.match(/misure \(cm\):\s*([\d.]+)x([\d.]+)x([\d.]+)/);
      const descText = item.querySelector(".description")?.textContent || "";
      const finMatch = descText.match(/finiture:\s*([^\n]+)/);
      const dispMatch = descText.match(/disponibilità:\s*([\d.,]+)/);
      return {
        nome,
        codice: codiceMatch ? codiceMatch[1].trim() : null,
        spessore: misureMatch ? misureMatch[3] : null,
        lavorazione: finMatch ? finMatch[1].trim() : null,
        quantita: dispMatch ? dispMatch[1].trim() : null,
      };
    });
  });
}

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : `${BASE}/0?page=${n}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    const cards = await extractCards(page);
    if (cards.length === 0) break;
    all = all.concat(cards);
  }
  await page.close();

  const byName = new Map();
  for (const c of all) {
    const nome = c.nome && c.nome.trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (c.spessore) entry.spessori.add(Number(c.spessore));
    if (c.lavorazione) entry.lavorazioni.add(c.lavorazione);
    entry.blocchi.push({
      numero: c.codice,
      spessore: c.spessore,
      lavorazione: c.lavorazione || "",
      quantita: c.quantita ? Number(c.quantita.replace(",", ".")) : null,
    });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su solfagroup.com/store");

  return {
    id: "solfagroup",
    nome: "Solfagroup",
    url: BASE,
    stato: "scraped",
    note:
      "Elenco letto scorrendo le pagine dello store (parametro ?page=N), con spessore/lavorazione/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "solfagroup" };
