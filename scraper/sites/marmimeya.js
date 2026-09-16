// Marmi Meya — stessa piattaforma Angular di Marimar/Stocchero Attilio: il
// campo "Materiale" è un autocomplete che carica tutti i nomi nel DOM
// appena aperto.
const URL = "https://www.marmimeya.com/it/magazzino-lastre";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const input = await page.waitForSelector("#searchSingleEl", { timeout: 20000 });
  await input.click();
  await page.waitForSelector("mat-option", { timeout: 15000 });
  await page.waitForTimeout(1500);

  const names = await page.$$eval("mat-option", (els) => els.map((e) => e.textContent.trim()));
  await page.close();

  const unique = [...new Set(names)].filter(Boolean).sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessuna opzione trovata nell'autocomplete materiale");

  return {
    id: "marmimeya",
    nome: "Marmi Meya",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto direttamente dall\'autocomplete "Materiale" del magazzino lastre — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmimeya" };
