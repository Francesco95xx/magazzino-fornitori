// Bufalini — nome materiale in div.title-s.my-2 > strong (il codice blocco
// è in un elemento separato, div.title-xs, che ignoriamo).
const URL = "https://www.bufalini.com/it/magazzino/";
const SELECTOR = "div.title-s.my-2 strong";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 15; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(700);
  }

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su bufalini.com/magazzino");

  return {
    id: "bufalini",
    nome: "Bufalini Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dalla pagina Magazzino con scroll fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "bufalini" };
