// Mondial Marmi — pagina Materiali (tema Avada/Fusion), nome pulito in
// a.fusion-rollover-title-link.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "https://www.mondialmarmi.com/materials/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator("a.fusion-rollover-title-link").evaluateAll((els) =>
    els.map((el) => ({ nome: (el.textContent || "").trim(), href: el.href }))
  );
  await page.close();

  const materiali = dedupeWithUrl(raw.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su mondialmarmi.com/materials");

  return {
    id: "mondial-marmi",
    nome: "Mondial Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla pagina Materiali, con link diretto alla scheda materiale — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "mondial-marmi" };
