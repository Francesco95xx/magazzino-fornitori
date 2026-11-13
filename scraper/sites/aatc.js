// A.A.TC — il vero magazzino (non serve nemmeno filtrare: la home mostra
// già tutti i blocchi reali, con data di ultimo aggiornamento) è paginato
// a scroll infinito (+10 ogni scroll, nessun bottone). Ogni blocco è una
// `table.ew_result` con due righe: la prima (th) ha codice blocco e nome
// materiale, la seconda (td) ha lavorazione, dimensioni, spessore e un
// <select> di quantità il cui valore massimo è la disponibilità.
const URL = "http://warehouse.aatc.it/en/#";
const TABLE_SELECTOR = "table.ew_result";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  let prevCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < 150 && stableRounds < 4; i++) {
    const count = await page.locator(TABLE_SELECTOR).count();
    stableRounds = count === prevCount ? stableRounds + 1 : 0;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }

  const rows = await page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((t) => {
      const nome = t.querySelector("th.ew_materiale")?.textContent.trim() || null;
      const numero = t.querySelector("th.ew_commessa")?.textContent.trim() || null;
      const lavorazione = t.querySelector("td.lavorazione")?.textContent.trim() || null;
      const spessoreText = t.querySelector("td.ew_spessore")?.textContent.trim() || "";
      const spessore = (spessoreText.match(/([\d.]+)/) || [])[1] || null;
      const opts = [...t.querySelectorAll("select option")].map((o) => Number(o.value)).filter((n) => !isNaN(n));
      const quantita = opts.length ? Math.max(...opts) : null;
      return { nome, numero, lavorazione: lavorazione && lavorazione !== "" ? lavorazione : null, spessore, quantita };
    });
  }, TABLE_SELECTOR);
  await page.close();

  const byName = new Map();
  for (const r of rows) {
    if (!r.nome) continue;
    if (!byName.has(r.nome)) byName.set(r.nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(r.nome);
    if (r.spessore) entry.spessori.add(Number(r.spessore));
    if (r.lavorazione) entry.lavorazioni.add(r.lavorazione);
    entry.blocchi.push({ numero: r.numero, spessore: r.spessore, lavorazione: r.lavorazione || "", quantita: r.quantita });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nel warehouse AATC");

  return {
    id: "aatc",
    nome: "A.A.TC",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal vero magazzino (home, nessun filtro necessario) con scroll infinito fino a stabilizzazione, spessore/lavorazione/numero blocco/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "aatc" };
