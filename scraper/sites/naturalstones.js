// NaturalStone — trovato un URL pubblico diverso da quello originale
// (naturalstones.isodata.it, che richiede login): naturalstones.marbler3.it
// è la stessa piattaforma MarbleR3 ma accessibile senza credenziali.
// Il catalogo mostra 24 lastre per pagina di default; selezioniamo la
// dimensione massima (48) cliccando il bottone corrispondente per avere
// più risultati in un colpo solo. Nome materiale in h3.min-w-0.truncate.
const URL = "https://naturalstones.marbler3.it/catalogo/";
const SELECTOR = "h3.min-w-0.truncate";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  await page
    .locator('button:text-is("48")')
    .click({ timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(1500);

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su naturalstones.marbler3.it/catalogo");

  return {
    id: "naturalstones",
    nome: "NaturalStone",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal catalogo pubblico (dimensione pagina 48) — piattaforma MarbleR3 accessibile senza login su questo dominio, a differenza di naturalstones.isodata.it — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "naturalstones" };
