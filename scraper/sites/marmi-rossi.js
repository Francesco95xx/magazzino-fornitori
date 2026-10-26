// Marmi Rossi — magazzino online reale in HTML (non il PDF trovato in
// precedenza su un altro URL), piattaforma Angular con scroll infinito
// (stessa di CEV Marmi: classi `mag-col-*`). Lo scroll va fatto sulla
// pagina intera (window.scrollTo fino in fondo), non su un contenitore
// interno: il catalogo è grande (~600+ lastre), va ripetuto molte volte
// finché il conteggio si stabilizza.
// Ogni riga blocco (`.mag-grid-row`) ha un'intestazione (nome, numero
// blocco) e una o più righe di dettaglio (`.mag-detail-row`, una per ogni
// taglio/lavorazione/spessore dello stesso blocco) con lavorazione,
// dimensioni, spessore (suffisso "CM") e un <select> di quantità ordinabile
// il cui valore massimo è la quantità disponibile.
const URL = "https://marmirossi.com/it/magazzino-online/#/list";
const ROW_SELECTOR = ".mag-grid-row";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);

  let prevCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < 150 && stableRounds < 3; i++) {
    const count = await page.locator(ROW_SELECTOR).count();
    stableRounds = count === prevCount ? stableRounds + 1 : 0;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
  }

  const rows = await page.evaluate((rowSelector) => {
    return [...document.querySelectorAll(rowSelector)].map((row) => {
      const materialRaw = row.querySelector(".mag-grid-title .mag-col-material")?.textContent.trim() || "";
      const blockNum = row.querySelector(".mag-grid-title .mag-col-blocknumber")?.textContent.trim() || null;
      const details = [...row.querySelectorAll(".mag-detail-row")].map((d) => {
        const sp = d.querySelector(".mag-col-thickness span")?.textContent.replace(/cm/i, "").trim() || null;
        const fin = d.querySelector(".mag-col-finishing span")?.textContent.trim() || null;
        const opts = [...d.querySelectorAll(".mag-col-qta option")].map((o) => Number(o.value)).filter((n) => !isNaN(n));
        return { spessore: sp, lavorazione: fin, quantita: opts.length ? Math.max(...opts) : null };
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
    if (!byName.has(nome)) byName.set(nome, { alias: new Set(), spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    rest.filter(Boolean).forEach((a) => entry.alias.add(a));
    for (const d of row.details) {
      if (d.spessore) entry.spessori.add(Number(d.spessore));
      if (d.lavorazione) entry.lavorazioni.add(d.lavorazione);
      entry.blocchi.push({ numero: row.blockNum, spessore: d.spessore, lavorazione: d.lavorazione || "", quantita: d.quantita });
    }
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [...info.alias],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su marmirossi.com/magazzino-online");

  return {
    id: "marmi-rossi",
    nome: "Marmi Rossi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal Magazzino Online reale con scroll di pagina ripetuto fino a stabilizzazione, spessore/lavorazione/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "marmi-rossi" };
