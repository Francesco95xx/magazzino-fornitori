// Marmi Orobici — WordPress/WooCommerce, catalogo prodotto paginato
// (una lastra = un prodotto, stesso materiale ripetuto su più pagine).
// Non ci fidiamo dei link di paginazione (mostrano solo pagine vicine con
// puntini "…"): incrementiamo la pagina finché non troviamo più prodotti.

const BASE_URL = "https://www.marmiorobici.it/product/";
const MAX_PAGES_SAFETY = 200; // limite di sicurezza, il sito oggi ne ha ~41

async function scrapePage(page, url) {
  // Il sito a volte fa una redirect/rewrite subito dopo il caricamento
  // iniziale, distruggendo l'execution context proprio mentre leggiamo il
  // DOM ("Execution context was destroyed"). Un retry risolve il caso
  // transitorio senza mascherare un fallimento vero.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await page.goto(url, { waitUntil: "load", timeout: 30000 });
      if (!resp || resp.status() === 404) return null;
      await page.waitForTimeout(300);
      return await page.$$eval(".product-title", (els) =>
        els.map((e) => e.textContent.trim()).filter(Boolean)
      );
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(1000);
    }
  }
}

async function scrape(context) {
  const page = await context.newPage();
  const names = new Set();

  for (let p = 1; p <= MAX_PAGES_SAFETY; p++) {
    const url = p === 1 ? BASE_URL : `${BASE_URL}page/${p}/`;
    const pageNames = await scrapePage(page, url);
    if (pageNames === null || pageNames.length === 0) break;
    pageNames.forEach((n) => names.add(n));
  }

  await page.close();

  return {
    id: "orobici",
    nome: "Marmi Orobici",
    url: BASE_URL,
    stato: "scraped",
    note:
      "Magazzino lastre in tempo reale (pagina /product/, tutte le categorie: Marmo, Granito, Quarzite, Onice, Dolomite, Pietra, ecc.) — scraping automatico notturno.",
    materiali: [...names].sort().map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "orobici" };
