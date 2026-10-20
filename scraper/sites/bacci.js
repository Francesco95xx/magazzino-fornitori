// Bacci Marmi — griglia Elementor, nome materiale in h3.elementor-post__title.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "https://www.marmibacci.com/lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator("h3.elementor-post__title").evaluateAll((els) =>
    els.map((el) => {
      const a = el.querySelector("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );
  await page.close();

  const materiali = dedupeWithUrl(raw.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su marmibacci.com/lastre");

  return {
    id: "bacci",
    nome: "Bacci Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla griglia lastre (Elementor), con link diretto alla scheda prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "bacci" };
