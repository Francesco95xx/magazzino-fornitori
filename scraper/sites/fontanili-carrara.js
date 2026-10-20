// V. Fontanili Carrara — il filtro "Materiale" della pagina Slabs è una lista
// di pulsanti a.material-filter con l'elenco completo dei materiali distinti.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "https://www.nicolafontanili.com/slabs/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator("a.material-filter").evaluateAll((els) =>
    els.map((el) => ({ nome: (el.textContent || "").trim(), href: el.href }))
  );
  await page.close();

  const materiali = dedupeWithUrl(raw.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato nel filtro material-filter");

  return {
    id: "fontanili-carrara",
    nome: "V. Fontanili Carrara",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dal filtro "Materiale" della pagina Slabs, con link diretto alla pagina filtrata sul solo materiale — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "fontanili-carrara" };
