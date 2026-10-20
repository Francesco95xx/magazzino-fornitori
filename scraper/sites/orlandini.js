// Orlandini Gallery — il vero magazzino (lager.orlandini.de, piattaforma
// DDL) in realtà NON richiede login per vedere la griglia materiali e,
// cliccando un materiale, i blocchi/lastre reali con quantità, dimensioni e
// spessore (verificato dal vivo 2026-10-20 — il vecchio commento che
// indicava "richiede login" era superato, il sito è cambiato). Il sito
// pubblico su orlandini.de/store (Webflow, "Katalog") che scrapavamo prima
// era dichiaratamente solo una selezione parziale.
// La griglia iniziale carica 24 materiali, il bottone "Show more materials"
// ne aggiunge altri ad ogni click (si ferma da solo quando sparisce).
// Cliccare un materiale naviga via pushState a ?type=<nome url-encoded> —
// pattern verificato, lo costruiamo direttamente senza dover cliccare ogni
// card.
const URL = "https://lager.orlandini.de";
const SELECTOR = "div.product-item h3";
const MORE_SELECTOR = "text=Show more materials";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  for (let i = 0; i < 60; i++) {
    const btn = page.locator(MORE_SELECTOR);
    if ((await btn.count()) === 0) break;
    try {
      await btn.first().click({ timeout: 5000 });
    } catch {
      break;
    }
    await page.waitForTimeout(900);
  }

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(raw.map((n) => n.trim()).filter((n) => n && !/^-+$/.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato su lager.orlandini.de");

  return {
    id: "orlandini",
    nome: "Orlandini Gallery",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dal vero magazzino lager.orlandini.de (non richiede login), con link diretto alla scheda materiale (?type=<nome>) — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [], url: `${URL}/?type=${encodeURIComponent(nome)}` })),
  };
}

module.exports = { scrape, id: "orlandini" };
