// Stonest — tutte le lastre sono su un'unica pagina, nome materiale in
// h1 dentro div.magProduct.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "http://www.stonest.net/it/magazzino/lastre";
const SELECTOR = "div.magProduct h1";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const a = el.querySelector("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );
  await page.close();

  const materiali = dedupeWithUrl(raw.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su stonest.net/magazzino/lastre");

  return {
    id: "stonest",
    nome: "Stonest",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai titoli lastra della pagina Magazzino (tutte le lastre su un'unica pagina), con link diretto alla scheda prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "stonest" };
