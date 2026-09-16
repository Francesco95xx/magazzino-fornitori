// Bagnara (Materialkatalog) — elenco caricato con paginazione "infinite
// scroll" via pulsante pjax ("weitere Materialien laden"/"load more"); va
// cliccato ripetutamente finché non scompare. Il banner cookie iubenda
// blocca i click e va rimosso prima di iniziare.
const URL = "https://www.bagnara.net/it/le-nostre-pietre/catalogo-materiale/";
const ITEM_SELECTOR = "div.box.product-box h3.heading.medium a";
const TRIGGER_SELECTOR = "a.infinity-trigger, button.infinity-trigger, .infinity-trigger";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => {
    const banner = document.querySelector("#iubenda-cs-banner");
    if (banner) banner.remove();
  });

  for (let i = 0; i < 100; i++) {
    const trigger = page.locator(TRIGGER_SELECTOR);
    if ((await trigger.count()) === 0) break;
    try {
      await trigger.first().click({ timeout: 5000, force: true });
    } catch {
      break;
    }
    await page.waitForTimeout(1500);
  }

  const raw = await page.locator(ITEM_SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(raw.map((t) => t.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato sul catalogo Bagnara");

  return {
    id: "bagnara",
    nome: "Bagnara",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal Materialkatalog cliccando ripetutamente sul pulsante di caricamento successivo finché non scompare — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "bagnara" };
