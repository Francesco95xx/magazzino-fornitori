// Galvani Trading — 3 pagine di risultati con paginazione a bottoni (stato
// JS, niente URL/href), nome materiale in h3.text-xl.font-bold.
const URL = "https://www.warehousenaturalstone.com/galvani-trading/slabs";
const SELECTOR = "h3.text-xl.font-bold";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let all = [];
  for (let n = 1; n <= 20; n++) {
    all = all.concat(await page.locator(SELECTOR).allTextContents());
    const btn = page.locator(`button:text-is("${n + 1}")`);
    if ((await btn.count()) === 0) break;
    await btn.first().click();
    await page.waitForTimeout(1200);
  }
  await page.close();

  const unique = [...new Set(all.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su warehousenaturalstone.com/galvani-trading");

  return {
    id: "galvani-trading",
    nome: "Galvani Trading",
    url: URL,
    stato: "scraped",
    note: "Elenco letto scorrendo le pagine di risultati (paginazione a bottoni) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "galvani-trading" };
