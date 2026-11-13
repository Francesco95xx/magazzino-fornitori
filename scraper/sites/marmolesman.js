// MarmolesMan — "Online Stock" (Elementor Jet-Engine), paginato
// (?jsf=jet-engine&pagenum=N, ~7 pagine). Ogni card è un <a href="/prodotto/...">
// con testo libero "NOME\nCODICE\nSlabs N\nDimensions LxWxT CM".
const BASE = "https://www.marmolesman.it/magazzino-online/";
const PAGE_URL = (n) => `https://www.marmolesman.it/online-stock/?jsf=jet-engine&pagenum=${n}`;
const MAX_PAGES = 30;

async function scrapeCards(page) {
  return page.locator('a[href*="/prodotto/"]').evaluateAll((els) =>
    els.map((el) => el.innerText.trim())
  );
}

function parseCard(text) {
  const m = text.match(/^(.+?)\n+(\S+\s*\d+)\n+Slabs\s+(\d+)\n+Dimensions\s+([\d.]+)x\n+([\d.]+)x\n+([\d.]+)\s*CM/i);
  if (!m) {
    const nameOnly = text.split("\n")[0]?.trim();
    return nameOnly ? { nome: nameOnly, numero: null, quantita: null, spessore: null } : null;
  }
  return { nome: m[1].trim(), numero: m[2].trim(), quantita: Number(m[3]), spessore: String(Number(m[6])) };
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });

  let all = await scrapeCards(page);
  for (let n = 2; n <= MAX_PAGES; n++) {
    try {
      await page.goto(PAGE_URL(n), { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      break;
    }
    const cards = await scrapeCards(page);
    if (cards.length === 0) break;
    all = all.concat(cards);
  }
  await page.close();

  const byName = new Map();
  for (const text of all) {
    const parsed = parseCard(text);
    if (!parsed || !parsed.nome) continue;
    if (!byName.has(parsed.nome)) byName.set(parsed.nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(parsed.nome);
    if (parsed.spessore) entry.spessori.add(Number(parsed.spessore));
    if (parsed.numero || parsed.quantita || parsed.spessore) {
      entry.blocchi.push({ numero: parsed.numero, spessore: parsed.spessore, lavorazione: "", quantita: parsed.quantita });
    }
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su marmolesman.it/magazzino-online");

  return {
    id: "marmolesman",
    nome: "MarmolesMan",
    url: BASE,
    stato: "scraped",
    note:
      "Elenco letto dalla pagina Online Stock paginata, con numero blocco/spessore/lastre disponibili per blocco letti dal testo di ogni card — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "marmolesman" };
