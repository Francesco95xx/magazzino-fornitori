// Piattaforma condivisa slabware.com — protetta da una verifica anti-bot
// Cloudflare che riconosce e blocca Chromium headless (pagina
// "Just a moment..."). In modalità headed (finestra reale, non headless)
// la verifica passa senza intervento. Per questo NON usiamo il context
// condiviso di run-all.js (headless) ma apriamo un browser proprio, headed,
// solo per questa piattaforma.
// Nota: essendo headed, sul runner self-hosted apre per pochi secondi una
// finestra Chromium visibile sullo schermo del PC.
const { chromium } = require("playwright");

async function scrapeMaterialFilter({ id, nome, url }) {
  const browser = await chromium.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    const names = await page.locator("#MaterialDropDownList option").allTextContents();
    const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^\(\s*select\s*\)$/i.test(n)))].sort(
      (a, b) => a.localeCompare(b, "it")
    );
    if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro MaterialDropDownList");

    return {
      id,
      nome,
      url,
      stato: "scraped",
      note:
        'Elenco letto dal filtro "MATERIAL" (select MaterialDropDownList). Richiede un browser headed (non headless) per superare la verifica anti-bot Cloudflare — scraping automatico notturno.',
      materiali: unique.map((n) => ({ nome: n, alias: [] })),
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeMaterialFilter };
