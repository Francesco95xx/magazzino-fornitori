// CEV Marmi (Verona) — vero magazzino online pubblico, nessun login,
// mostra data di ultimo aggiornamento in pagina. Stessa piattaforma di
// Marmi Rossi (classe `div.mag-col-material`), scroll di pagina intera
// ripetuto fino a stabilizzazione del conteggio (~600+ lastre, va ripetuto
// molte volte). Molti materiali sono elencati con più nomi commerciali
// separati da " - " (es. "AFRICAN GALAXY - COSMOS - STARGATE"): il primo
// diventa il nome, gli altri alias.
const URL = "https://www.cevmarmi.com/it/magazzino-online";
const SELECTOR = "div.mag-col-material";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  let prevCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < 200 && stableRounds < 4; i++) {
    const count = await page.locator(SELECTOR).count();
    stableRounds = count === prevCount ? stableRounds + 1 : 0;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const seen = new Set();
  const materiali = [];
  for (const text of raw.map((t) => t.trim()).filter(Boolean)) {
    if (seen.has(text)) continue;
    seen.add(text);
    const [nome, ...rest] = text.split(" - ").map((s) => s.trim());
    materiali.push({ nome, alias: rest.filter(Boolean) });
  }
  materiali.sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su cevmarmi.com/magazzino-online");

  return {
    id: "cev-marmi",
    nome: "CEV Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal vero Magazzino Online (nessun login, data di ultimo aggiornamento mostrata in pagina) con scroll di pagina ripetuto fino a stabilizzazione — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "cev-marmi" };
