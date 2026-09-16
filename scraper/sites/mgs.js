// MGS Marble and Granite Service — nome materiale in h4 dentro
// div.title_stone. Scroll fino a stabilizzazione per caricare tutte le
// lastre (catalogo grande, ~700 pezzi).
const URL = "https://mgsitaly.com/it/magazzino/";
const SELECTOR = "div.title_stone h4";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 40; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(600);
  }

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su mgsitaly.com/magazzino");

  return {
    id: "mgs",
    nome: "MGS Marble and Granite Service",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai titoli lastra (div.title_stone h4) con scroll fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "mgs" };
