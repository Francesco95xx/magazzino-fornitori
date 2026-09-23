// Marmo Elite — pagina WordPress (custom post type "lastra") con scroll
// infinito: nessun bottone "load more" nel DOM, nessuna paginazione via URL
// (/lastra/page/2/ restituisce lo stesso contenuto della pagina 1), il
// caricamento è innescato solo dallo scroll reale. Il nome materiale è nel
// primo <h3> di ogni blocco lastra (content_lastra_title / lastra-wall).
//
// In precedenza (vedi seed-static.json) lo scroll headless si bloccava a
// 12-18 materiali per throttling del browser in background; con un browser
// headed (finestra in foreground, come Elite Stone/Margraf) e una soglia di
// stabilità più alta (6 controlli invariati invece di 1) lo scroll arriva
// fino in fondo: 634 lastre, 156 materiali unici.
const { chromium } = require("playwright");

const URL = "https://www.marmoelite.com/lastra";
const SELECTOR = "h3";

async function scrape() {
  const browser = await chromium.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: "load", timeout: 45000 });
    await page.waitForTimeout(1500);

    let prevCount = -1;
    let stableStreak = 0;
    for (let i = 0; i < 80 && stableStreak < 6; i++) {
      const count = await page.locator(SELECTOR).count();
      stableStreak = count === prevCount ? stableStreak + 1 : 0;
      prevCount = count;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
    }

    const names = await page.locator(SELECTOR).allTextContents();
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
    if (unique.length === 0) throw new Error("Nessun materiale trovato su marmoelite.com/lastra");

    return {
      id: "marmoelite",
      nome: "Marmo Elite",
      url: URL,
      stato: "scraped",
      note:
        "Elenco letto dagli h3 di ogni lastra dopo scroll infinito fino a stabilizzazione (browser headed per evitare il throttling in background) — scraping automatico notturno.",
      materiali: unique.map((nome) => ({ nome, alias: [] })),
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrape, id: "marmoelite" };
