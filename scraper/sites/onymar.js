// Onymar — pagina Materiali paginata (3 pagine), nome in
// h3.grid-entry-title.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const BASE = "https://onymar.com/materials/";
const PAGES = [BASE, `${BASE}page/2/`, `${BASE}page/3/`];
const SELECTOR = "h3.grid-entry-title";

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (const url of PAGES) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    const entries = await page.locator(SELECTOR).evaluateAll((els) =>
      els.map((el) => {
        const a = el.querySelector("a");
        return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
      })
    );
    all = all.concat(entries);
  }
  await page.close();

  const materiali = dedupeWithUrl(all.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su onymar.com/materials");

  return {
    id: "onymar",
    nome: "Onymar",
    url: BASE,
    stato: "scraped",
    note: "Elenco letto scorrendo le 3 pagine di Materiali, con link diretto alla scheda materiale — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "onymar" };
