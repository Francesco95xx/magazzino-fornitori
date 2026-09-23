// Corradini Group — pagina statica (WordPress/Astra), tutti i 160 materiali
// sono già presenti nel DOM al caricamento (nessuno scroll/paginazione
// necessario, verificato che il conteggio non cambia scrollando). Il nome
// materiale è nel primo <h2> di ogni voce dentro l'accordion dei filtri
// (#block-filters .accordion-item), che esclude automaticamente i 3 <h2>
// non pertinenti della pagina (titolo, CTA "Can't find...", "Featured
// products"). Non è "Marmi Corradini" (id esistente marmi-corradini,
// azienda diversa).
const URL = "https://www.corradinigroup.it/en/online-warehouse-italy/";
const SELECTOR = "#block-filters .accordion-item h2";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(1500);

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su corradinigroup.it/online-warehouse-italy");

  return {
    id: "corradini-group",
    nome: "Corradini Group",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dagli h2 dell'accordion filtri materiali, tutti già presenti nel DOM al caricamento (nessuno scroll necessario) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "corradini-group" };
