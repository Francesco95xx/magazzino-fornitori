// Orlandini Gallery — il vero magazzino (lager.orlandini.de, piattaforma
// DDL) richiede login. Il sito principale ha però un Katalog pubblico
// (orlandini.de/store, Webflow CMS) con una selezione di materiali —
// dichiaratamente non tutti quelli disponibili, ma comunque utile.
// La paginazione è ad accumulo: ogni click su "Next Page" AGGIUNGE altri
// 24 elementi alla lista esistente (non la sostituisce), il bottone
// scompare all'ultima pagina.
const URL = "https://www.orlandini.de/store";
const SELECTOR = "div.katalog-preview p";
const NEXT_SELECTOR = 'a[aria-label="Next Page"]';

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  for (let i = 0; i < 20; i++) {
    const next = page.locator(NEXT_SELECTOR);
    if ((await next.count()) === 0) break;
    const visible = await next.first().isVisible().catch(() => false);
    if (!visible) break;
    try {
      await next.first().click({ timeout: 5000 });
    } catch {
      break;
    }
    await page.waitForTimeout(1200);
  }

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(raw.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su orlandini.de/store");

  return {
    id: "orlandini",
    nome: "Orlandini Gallery",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dal Katalog pubblico (il vero magazzino lager.orlandini.de richiede login, non ancora automatizzato), cliccando "Next Page" fino a esaurimento — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "orlandini" };
