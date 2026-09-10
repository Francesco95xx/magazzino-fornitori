// Marmi Orobici — WordPress/WooCommerce, catalogo prodotto paginato
// (una lastra = un prodotto, stesso materiale ripetuto su più pagine).
// Non ci fidiamo dei link di paginazione (mostrano solo pagine vicine con
// puntini "…"): incrementiamo la pagina finché non troviamo più prodotti.

const BASE_URL = "https://www.marmiorobici.it/product/";
const MAX_PAGES_SAFETY = 200; // limite di sicurezza, il sito oggi ne ha ~41

async function scrape(context) {
  const page = await context.newPage();
  const names = new Set();

  for (let p = 1; p <= MAX_PAGES_SAFETY; p++) {
    const url = p === 1 ? BASE_URL : `${BASE_URL}page/${p}/`;
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!resp || resp.status() === 404) break;

    const pageNames = await page.$$eval(".product-title", (els) =>
      els.map((e) => e.textContent.trim()).filter(Boolean)
    );
    if (pageNames.length === 0) break;
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
