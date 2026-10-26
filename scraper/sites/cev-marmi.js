// CEV Marmi (Verona) — vero magazzino online pubblico, nessun login,
// mostra data di ultimo aggiornamento in pagina. Stessa piattaforma di
// Marmi Rossi (classe `div.mag-col-material`), scroll di pagina intera
// ripetuto fino a stabilizzazione del conteggio (~600+ lastre, va ripetuto
// molte volte). Molti materiali sono elencati con più nomi commerciali
// separati da " - " (es. "AFRICAN GALAXY - COSMOS - STARGATE"): il primo
// diventa il nome, gli altri alias.
// Ogni riga blocco (`.mag-grid-row`) ha un'intestazione (nome, numero
// blocco) e una o più righe di dettaglio (`.mag-detail-row`, una per ogni
// taglio/spessore dello stesso blocco) con dimensioni, spessore e un
// <select> di quantità ordinabile il cui valore massimo è la quantità
// disponibile. Nessuna colonna "lavorazione" su questo sito.
const URL = "https://www.cevmarmi.com/it/magazzino-online";
const ROW_SELECTOR = ".mag-grid-row";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  let prevCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < 200 && stableRounds < 4; i++) {
    const count = await page.locator(ROW_SELECTOR).count();
    stableRounds = count === prevCount ? stableRounds + 1 : 0;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }

  const rows = await page.evaluate((rowSelector) => {
    return [...document.querySelectorAll(rowSelector)].map((row) => {
      const materialRaw = row.querySelector(".mag-grid-title .mag-col-material")?.textContent.trim() || "";
      const blockNum = row.querySelector(".mag-grid-title .mag-col-blocknumber span")?.textContent.trim() || null;
      const details = [...row.querySelectorAll(".mag-detail-row")].map((d) => {
        const sp = d.querySelector(".mag-col-thickness span")?.textContent.trim() || null;
        const opts = [...d.querySelectorAll(".mag-col-qta option")].map((o) => Number(o.value)).filter((n) => !isNaN(n));
        return { spessore: sp, quantita: opts.length ? Math.max(...opts) : null };
      });
      return { materialRaw, blockNum, details };
    });
  }, ROW_SELECTOR);
  await page.close();

  const byName = new Map();
  for (const row of rows) {
    if (!row.materialRaw) continue;
    const [nome, ...rest] = row.materialRaw.split(" - ").map((s) => s.trim());
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { alias: new Set(), spessori: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    rest.filter(Boolean).forEach((a) => entry.alias.add(a));
    for (const d of row.details) {
      if (d.spessore) entry.spessori.add(Number(d.spessore));
      entry.blocchi.push({ numero: row.blockNum, spessore: d.spessore, lavorazione: "", quantita: d.quantita });
    }
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [...info.alias],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [],
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su cevmarmi.com/magazzino-online");

  return {
    id: "cev-marmi",
    nome: "CEV Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal vero Magazzino Online (nessun login, data di ultimo aggiornamento mostrata in pagina) con scroll di pagina ripetuto fino a stabilizzazione, spessore e quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "cev-marmi" };
