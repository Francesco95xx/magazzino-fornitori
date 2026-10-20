// Bagnara — il vero Magazzino Online richiede un account cliente (non il
// catalogo pubblico generico). Login su /mitgliederbereich/ (form
// uname/pwd, bottone "Accedi" `button[type="submit"][name="action"]`), poi
// pagina /magazzino-online?type=random (il valore "random" del filtro
// "categoria" corrisponde a "Tutti i prodotti", non a una selezione
// casuale). Stessa paginazione a scroll infinito del vecchio scraper sul
// catalogo pubblico (`.infinity-trigger`), elementi `.product-item .text`.
// Il banner cookie iubenda blocca i click e va rimosso prima di procedere.
// Credenziali da BAGNARA_EMAIL / BAGNARA_PASSWORD (GitHub Secret + env
// locale), mai hardcoded — stesso schema di GRMARMI_EMAIL/GRMARMI_PASSWORD.
//
// Nota (2026-10-20): in headless (context condiviso di run-all.js) il
// caricamento successivo via "infinity-trigger" e' inaffidabile — a volte
// si ferma al primo batch (32 materiali) senza errori, altre volte arriva
// solo a meta' (448 su 577 reali), stesso sintomo gia' visto con Margraf.
// Come per Margraf, lo scraper apre un proprio browser headed indipendente
// (ignora il `context` passato da run-all.js) ed usa uno stop basato sulla
// stabilita' del conteggio materiali (4-6 controlli invariati) invece che
// sulla sola scomparsa del trigger, perche' il trigger puo' restare nel DOM
// anche a catalogo esaurito.
const { chromium } = require("playwright");

const LOGIN_URL = "https://www.bagnara.net/mitgliederbereich/";
const WAREHOUSE_URL = "https://www.bagnara.net/magazzino-online?type=random";
const ITEM_SELECTOR = ".product-item .text";
const TRIGGER_SELECTOR = ".infinity-trigger";

async function removeCookieBanner(page) {
  await page.evaluate(() => {
    const banner = document.querySelector("#iubenda-cs-banner");
    if (banner) banner.remove();
  });
}

async function scrape() {
  const email = process.env.BAGNARA_EMAIL;
  const password = process.env.BAGNARA_PASSWORD;
  if (!email || !password) {
    throw new Error("Variabili d'ambiente BAGNARA_EMAIL / BAGNARA_PASSWORD mancanti (vedi README)");
  }

  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    await page.goto(LOGIN_URL, { waitUntil: "networkidle", timeout: 45000 });
    await removeCookieBanner(page);

    await page.fill('input[name="uname"]', email);
    await page.fill('input[name="pwd"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 20000 }).catch(() => null),
      page.locator('button[type="submit"][name="action"]').first().click(),
    ]);
    await page.waitForTimeout(1000);

    await page.goto(WAREHOUSE_URL, { waitUntil: "networkidle", timeout: 45000 });
    await removeCookieBanner(page);
    // la pagina attacca il gestore di click sul pulsante "carica altro" con un
    // leggero ritardo dopo il caricamento iniziale — senza questa attesa i primi
    // click non hanno alcun effetto (visto empiricamente in debug).
    await page.waitForTimeout(3000);

    let prevCount = await page.locator(ITEM_SELECTOR).count();
    let stableStreak = 0;
    for (let i = 0; i < 80 && stableStreak < 4; i++) {
      const trigger = page.locator(TRIGGER_SELECTOR);
      if ((await trigger.count()) === 0) break;
      try {
        await trigger.first().click({ timeout: 5000, force: true });
      } catch {
        break;
      }

      // la risposta AJAX del "carica altro" ha latenza variabile: invece di
      // un'attesa fissa, si fa polling finche' il conteggio sale o scade un
      // tetto massimo — altrimenti con una rete lenta si rischia di fermarsi
      // credendo (erroneamente) che non ci sia piu' nulla da caricare.
      const deadline = Date.now() + 6000;
      let newCount = prevCount;
      while (Date.now() < deadline) {
        await page.waitForTimeout(300);
        newCount = await page.locator(ITEM_SELECTOR).count();
        if (newCount > prevCount) break;
      }

      stableStreak = newCount > prevCount ? 0 : stableStreak + 1;
      prevCount = newCount;
    }

    const raw = await page.locator(ITEM_SELECTOR).allTextContents();
    const unique = [...new Set(raw.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "it")
    );
    if (unique.length === 0) throw new Error("Nessun materiale trovato nel Magazzino Online Bagnara (login fallito?)");

    return {
      id: "bagnara",
      nome: "Bagnara",
      url: WAREHOUSE_URL,
      stato: "scraped",
      note:
        "Elenco letto dal vero Magazzino Online (riservato clienti, login automatico, browser headed per evitare il blocco in headless) cliccando ripetutamente sul pulsante di caricamento successivo fino a stabilizzazione del conteggio — scraping automatico notturno.",
      materiali: unique.map((nome) => ({ nome, alias: [] })),
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrape, id: "bagnara" };
