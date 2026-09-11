// Marimar — widget Angular (magazzino-online / app-griglia-lastre) con
// caricamento a scroll reale: bisogna scrollare per davvero (mouse wheel),
// uno scrollTo() programmatico non basta a far scattare il caricamento.
// Il widget a volte impiega diversi secondi a montarsi: ritentiamo prima di
// arrenderci (osservato durante lo sviluppo, sito a volte lento/instabile).

const URL = "https://marimar.net/it/magazzino";
const MOUNT_TIMEOUT_MS = 40000;
const SCROLL_ROUNDS = 60;
const STABLE_ROUNDS_TO_STOP = 8;

async function waitForWidgetMount(page) {
  const deadline = Date.now() + MOUNT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const len = await page.evaluate(() => {
      const el = document.querySelector("magazzino-online");
      return el ? el.innerHTML.length : -1;
    });
    if (len > 5) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function scrapeOnce(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  const mounted = await waitForWidgetMount(page);
  if (!mounted) {
    await page.close();
    throw new Error("Il widget magazzino-online non si è montato entro il timeout");
  }

  let lastCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < SCROLL_ROUNDS && stableRounds < STABLE_ROUNDS_TO_STOP; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1200);
    const count = await page.$$eval(".mag-grid-title", (els) => els.length);
    stableRounds = count === lastCount ? stableRounds + 1 : 0;
    lastCount = count;
  }

  const names = await page.$$eval(".mag-grid-title", (els) =>
    els.map((t) => t.children[0]?.textContent.trim()).filter(Boolean)
  );
  await page.close();

  const unique = [...new Set(names)].sort();
  if (unique.length === 0) throw new Error("Nessun materiale trovato dopo lo scroll");
  return unique;
}

async function scrape(context) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const unique = await scrapeOnce(context);
      return {
        id: "marimar",
        nome: "Marimar",
        url: URL,
        stato: "scraped",
        note: "Magazzino lastre in tempo reale (pagina /it/magazzino) — scraping automatico notturno.",
        materiali: unique.map((nome) => ({ nome, alias: [] })),
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

module.exports = { scrape, id: "marimar" };
