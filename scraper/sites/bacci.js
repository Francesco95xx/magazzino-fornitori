// Bacci Marmi — griglia Elementor, nome materiale in h3.elementor-post__title.
const URL = "https://www.marmibacci.com/lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("h3.elementor-post__title").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su marmibacci.com/lastre");

  return {
    id: "bacci",
    nome: "Bacci Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla griglia lastre (Elementor) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "bacci" };
