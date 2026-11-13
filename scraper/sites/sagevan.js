// Sa.Ge.Van. Marmi Store — paginato (/page/N/, ~12 pagine, 101 risultati).
// Ogni card (div.block) ha nome materiale (div.block-tit a), numero blocco
// (div.block-details strong) e testo libero "<spessore> cm | <lastre>
// lastre | <mq> mq".
const URL = "https://store.sagevanmarmi.com/";
const PAGE_URL = (n) => `https://store.sagevanmarmi.com/page/${n}/`;
const MAX_PAGES = 30;

function extractCards(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll("div.block")].map((card) => {
      const nome = card.querySelector(".block-tit a")?.textContent.trim() || null;
      const details = card.querySelector(".block-details");
      const numero = details?.querySelector("strong")?.textContent.trim() || null;
      const text = details?.textContent || "";
      const spMatch = text.match(/([\d.]+)\s*cm\s*\|/);
      const qtyMatch = text.match(/(\d+)\s*lastre/i);
      return {
        nome,
        numero,
        spessore: spMatch ? spMatch[1] : null,
        quantita: qtyMatch ? Number(qtyMatch[1]) : null,
      };
    });
  });
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);

  let all = await extractCards(page);
  for (let n = 2; n <= MAX_PAGES; n++) {
    try {
      await page.goto(PAGE_URL(n), { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(800);
    } catch {
      break;
    }
    const cards = await extractCards(page);
    if (cards.length === 0) break;
    all = all.concat(cards);
  }
  await page.close();

  const byName = new Map();
  for (const c of all) {
    if (!c.nome) continue;
    if (!byName.has(c.nome)) byName.set(c.nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(c.nome);
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su store.sagevanmarmi.com");

  return {
    id: "sagevan",
    nome: "Sa.Ge.Van. Marmi Store",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto scorrendo le pagine dello store, con spessore/numero blocco/lastre disponibili per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "sagevan" };
