// Savoia Marble Store — risultati paginati (41 pagine, /index.php?page=N).
// Ogni blocco ha un form nascosto (id "updBasket", ripetuto per ogni card)
// con i dati puliti: descr (materiale), productNU (numero blocco), Alt
// (spessore cm), form_pezzi (lastre disponibili) — più affidabile del
// parsing testo visibile. Il filtro laterale "MATERIALI" (checkbox) non
// serve più per l'elenco nomi, lo deriviamo direttamente dai blocchi reali.
const BASE = "https://savoiamarmi.store/ITA.html";
const PAGE_URL = (n) => `https://savoiamarmi.store/index.php?page=${n}`;
const MAX_PAGES = 60;

function extractCards(page) {
  return page.evaluate(() => {
    const forms = [...document.querySelectorAll('form[action*="task=cart"]')];
    return forms.map((form) => {
      const get = (name) => form.querySelector(`input[name="${name}"]`)?.value || null;
      return {
        nome: get("descr"),
        numero: get("productNU"),
        spessore: get("Alt"),
        quantita: get("form_pezzi"),
      };
    });
  });
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1000);

  let all = await extractCards(page);
  for (let n = 2; n <= MAX_PAGES; n++) {
    await page.goto(PAGE_URL(n), { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(800);
    const cards = await extractCards(page);
    if (cards.length === 0) break;
    all = all.concat(cards);
  }
  await page.close();

  const byName = new Map();
  for (const c of all) {
    const nome = c.nome && c.nome.trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    const spessore = c.spessore ? Number(c.spessore) : null;
    if (spessore) entry.spessori.add(spessore);
    entry.blocchi.push({
      numero: c.numero,
      spessore: c.spessore,
      lavorazione: "",
      quantita: c.quantita ? Number(c.quantita) : null,
    });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su savoiamarmi.store");

  return {
    id: "savoia-marble-store",
    nome: "Savoia Marble Store",
    url: BASE,
    stato: "scraped",
    note:
      "Elenco letto scorrendo le pagine dei risultati (dati puliti dai form nascosti per blocco: materiale, numero blocco, spessore, pezzi) — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "savoia-marble-store" };
