// Stocchero Attilio — stessa piattaforma Angular di Marimar, ma qui il
// campo "MATERIALE" è un autocomplete che carica TUTTI i nomi materiale nel
// DOM appena viene aperto (899 <mat-option> osservati) — non serve scroll
// nella lista dei materiali, solo aprire il pannello autocomplete.

const URL = "https://www.stoccheroattilio.com/it/magazzino-online";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  const input = await page.waitForSelector("#searchSingleEl", { timeout: 20000 });
  await input.click();
  await page.waitForSelector("mat-option", { timeout: 15000 });
  // il pannello riempie gli option in modo incrementale nei primi istanti
  await page.waitForTimeout(1500);

  const names = await page.$$eval("mat-option", (els) => els.map((e) => e.textContent.trim()));
  await page.close();

  const unique = [...new Set(names)].filter(Boolean).sort();
  if (unique.length === 0) throw new Error("Nessuna opzione trovata nell'autocomplete materiale");

  return {
    id: "stocchero-attilio",
    nome: "Stocchero Attilio e C.",
    url: URL,
    stato: "scraped",
    note:
      "Elenco completo letto direttamente dall'autocomplete \"Materiale\" del magazzino online (tutte le voci disponibili nel filtro) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "stocchero-attilio" };
