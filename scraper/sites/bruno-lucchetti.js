// Bruno Lucchetti — shop WooCommerce, nome pulito in
// h2.woocommerce-loop-product__title.
const URL = "https://brunolucchetti.it/materiali/";
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

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su brunolucchetti.it/materiali");

  return {
    id: "bruno-lucchetti",
    nome: "Bruno Lucchetti",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dallo shop (WooCommerce) con scroll fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "bruno-lucchetti" };
