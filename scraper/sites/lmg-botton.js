// L.M.G. di Botton — shop WooCommerce, titolo prodotto è "<Materiale> Nr.
// Blocco <numero>"; ripuliamo il suffisso per ottenere il solo materiale.
const URL = "https://lmgdibotton.it/shop/";
const SELECTOR = "h2.woocommerce-loop-product__title";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 15; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(700);
  }

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const cleaned = raw.map((t) => t.replace(/\s*nr\.?\s*(blocco\s*)?\d+\s*$/i, "").trim()).filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su lmgdibotton.it/shop");

  return {
    id: "lmg-botton",
    nome: "L.M.G. di Botton",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai titoli prodotto dello shop (WooCommerce), ripulendo il suffisso \"Nr. Blocco\" — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "lmg-botton" };
