// Zagross Marmi — shop WooCommerce con scroll infinito, nome pulito in
// h2.woocommerce-loop-product__title.
const URL = "https://zagrossmarmi.com/pronta-consegna/";
const SELECTOR = "h2.woocommerce-loop-product__title";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 20; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(700);
  }

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su zagrossmarmi.com/pronta-consegna");

  return {
    id: "zagross",
    nome: "Zagross Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dallo shop Pronta Consegna (WooCommerce) con scroll fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "zagross" };
