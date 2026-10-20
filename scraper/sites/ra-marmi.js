// R.A. Marmi — categoria "Marmi/Lastre" WooCommerce, unica pagina, nome
// materiale in h3 senza classe dentro il loop prodotti.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "http://www.ramarmi.com/categoria-prodotto/marmi/lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator("ul.products h3").evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );
  await page.close();

  const materiali = dedupeWithUrl(raw.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su ramarmi.com/categoria-prodotto/marmi/lastre");

  return {
    id: "ra-marmi",
    nome: "R.A. Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalla categoria Marmi/Lastre (WooCommerce, unica pagina), con link diretto alla scheda prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "ra-marmi" };
