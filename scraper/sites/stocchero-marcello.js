// Stocchero Marcello — griglia Angular con scroll infinito, ogni gruppo
// materiale ha un'intestazione .mat-header-row con il nome in .p-name.
const URL = "https://www.stocchero.it/magazzinoonline/";
const SELECTOR = ".mat-header-row .p-name";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 30; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(700);
  }

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su stocchero.it/magazzinoonline");

  return {
    id: "stocchero-marcello",
    nome: "Stocchero Marcello",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalle intestazioni dei gruppi materiale con scroll fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "stocchero-marcello" };
