// Marmi Corradini — pagina Magazzino online è un accordion, un
// button.accordion-button per materiale.
const URL = "https://www.corradinigroup.it/magazzino-online/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("button.accordion-button").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su corradinigroup.it/magazzino-online");

  return {
    id: "marmi-corradini",
    nome: "Marmi Corradini",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai titoli dell'accordion materiali del Magazzino online — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-corradini" };
