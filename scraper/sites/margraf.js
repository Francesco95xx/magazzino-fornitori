// Margraf — richiede un account cliente. Login: #email/#password, bottone
// "Invia" dentro il form (niente id/name utile, si clicca per testo). Un
// banner cookie Cybot blocca i click se non rimosso prima. Dopo il login,
// "Tutti i prodotti" mostra le card materiale con nome in h2.font-bold
// (stesso selettore usato anche dal carosello "Margraf Selection" in
// cima, ma i nomi sono comunque materiali validi — dedup unifica i doppi).
// Scroll fino a stabilizzazione per caricare tutte le card.
// Credenziali da MARGRAF_EMAIL / MARGRAF_PASSWORD (GitHub Secret + env
// locale), mai hardcoded — stesso schema di GRMARMI_EMAIL/PASSWORD.
const URL = "https://magazzinoonline.margraf.it/it";
const SELECTOR = "h2.font-bold";

async function scrape(context) {
  const email = process.env.MARGRAF_EMAIL;
  const password = process.env.MARGRAF_PASSWORD;
  if (!email || !password) {
    throw new Error("Variabili d'ambiente MARGRAF_EMAIL / MARGRAF_PASSWORD mancanti (vedi README)");
  }

  const page = await context.newPage();
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

  let prevCount = -1;
  for (let i = 0; i < 30; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount && i > 2) break;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato dopo il login (login fallito?)");

  return {
    id: "margraf",
    nome: "Margraf",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dalla pagina "Tutti i prodotti" dopo login automatico, scroll fino a stabilizzazione — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "margraf" };
