// Margraf — richiede un account cliente. Login: #email/#password, bottone
// "Invia" dentro il form (niente id/name utile, si clicca per testo). Un
// banner cookie Cybot blocca i click se non rimosso prima. Dopo il login,
// "Tutti i prodotti" mostra le card materiale con nome in h2.font-bold
// (stesso selettore usato anche dal carosello "Margraf Selection" in
// cima, ma i nomi sono comunque materiali validi — dedup unifica i doppi).
// Credenziali da MARGRAF_EMAIL / MARGRAF_PASSWORD (GitHub Secret + env
// locale), mai hardcoded — stesso schema di GRMARMI_EMAIL/PASSWORD.
//
// Nota: in modalità headless il login sembra andare a buon fine (nessun
// errore) ma la pagina risultante non ha materiali — stesso sintomo visto
// con l'anti-bot di slabware.com. Testato headed in locale funziona
// sempre; per questo, come per Elite Stone, apriamo un browser headed
// indipendente dal context condiviso (headless) di run-all.js. Effetto
// collaterale: apre per qualche secondo una finestra Chromium visibile sul
// PC del runner self-hosted durante la corsa.
//
// Nota (2026-09-24): il sito è passato da scroll infinito a un bottone
// "CARICA ALTRO" (in realtà un <div class="label">, non un vero <button>/
// <a> — va cliccato via JS, page.click per testo non lo trova sempre in
// modo affidabile). Senza questo fix lo scraper si fermava al primo batch
// (~51 materiali unici, carosello "Margraf Selection" + prima pagina della
// griglia) invece dei ~400 reali. Il bottone resta nel DOM anche a
// catalogo esaurito (continua a rispondere "cliccabile" ma il conteggio
// non sale più), per questo lo stop è basato sulla stabilità del conteggio
// e non sulla scomparsa dell'elemento.
const { chromium } = require("playwright");

const URL = "https://magazzinoonline.margraf.it/it";
const SELECTOR = "h2.font-bold";

async function scrape() {
  const email = process.env.MARGRAF_EMAIL;
  const password = process.env.MARGRAF_PASSWORD;
  if (!email || !password) {
    throw new Error("Variabili d'ambiente MARGRAF_EMAIL / MARGRAF_PASSWORD mancanti (vedi README)");
  }

  const browser = await chromium.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: "load", timeout: 45000 });

    await page.evaluate(() => {
      const banner = document.querySelector("#CybotCookiebotDialog");
      if (banner) banner.remove();
    });

    await page.fill("#email", email);
    await page.fill("#password", password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 20000 }).catch(() => null),
      page.click('button:has-text("Invia")'),
    ]);
    await page.waitForTimeout(2000);

    // il banner cookie puo' ricomparire dopo il login (dominio diverso
    // /it dopo redirect) e blocca i click sul bottone "CARICA ALTRO"
    // sottostante se non rimosso di nuovo qui.
    await page.evaluate(() => {
      const banner = document.querySelector("#CybotCookiebotDialog");
      if (banner) banner.remove();
    });

    let prevCount = -1;
    let stableStreak = 0;
    for (let i = 0; i < 40 && stableStreak < 4; i++) {
      const count = await page.locator(SELECTOR).count();
      stableStreak = count === prevCount ? stableStreak + 1 : 0;
      prevCount = count;

      const clicked = await page.evaluate(() => {
        const el = [...document.querySelectorAll("button, a, div, span")].find(
          (e) => e.children.length === 0 && /carica altro/i.test(e.textContent || "") && e.offsetParent !== null
        );
        if (el) {
          el.scrollIntoView();
          el.click();
          return true;
        }
        return false;
      });
      if (!clicked) break;
      await page.waitForTimeout(1200);
    }

    const names = await page.locator(SELECTOR).allTextContents();
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
    if (unique.length === 0) throw new Error("Nessun materiale trovato dopo il login (login fallito?)");

    return {
      id: "margraf",
      nome: "Margraf",
      url: URL,
      stato: "scraped",
      note:
        'Elenco letto dalla pagina "Tutti i prodotti" dopo login automatico (browser headed per aggirare il blocco headless), cliccando ripetutamente "CARICA ALTRO" fino a stabilizzazione del conteggio — scraping automatico notturno.',
      materiali: unique.map((nome) => ({ nome, alias: [] })),
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrape, id: "margraf" };
