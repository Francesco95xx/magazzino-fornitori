// Stocchero Attilio — stessa piattaforma "mag-col-*" di CEV Marmi/Marmi
// Rossi/Marmi Meya (non serve il filtro MATERIALE: la griglia di default
// mostra già tutti i blocchi, basta scrollare la pagina intera fino a
// stabilizzazione). Catalogo grande (899 materiali distinti), lo scroll
// può richiedere più tempo del solito.
const URL = "https://www.stoccheroattilio.com/it/magazzino-online";
const ROW_SELECTOR = ".mag-grid-row";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  let prevCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < 400 && stableRounds < 4; i++) {
    const count = await page.locator(ROW_SELECTOR).count();
    stableRounds = count === prevCount ? stableRounds + 1 : 0;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
  }

  const rows = await page.evaluate((rowSelector) => {
    return [...document.querySelectorAll(rowSelector)].map((row) => {
      const nome = row.querySelector(".mag-grid-title .mag-col-material")?.textContent.trim() || "";
      const numero = row.querySelector(".mag-grid-title .mag-col-blocknumber span")?.textContent.trim() || null;
      const details = [...row.querySelectorAll(".mag-detail-row")].map((d) => {
        const sp = d.querySelector(".mag-col-thickness span")?.textContent.replace(/cm/i, "").replace(",", ".").trim() || null;
        const fin = d.querySelector(".mag-col-finishing span")?.textContent.trim() || null;
        const opts = [...d.querySelectorAll(".mag-col-qta option")].map((o) => Number(o.value)).filter((n) => !isNaN(n));
        return { spessore: sp, lavorazione: fin, quantita: opts.length ? Math.max(...opts) : null };
      });
      return { nome, numero, details };
    });
  }, ROW_SELECTOR);
  await page.close();

  const byName = new Map();
  for (const row of rows) {
    if (!row.nome) continue;
    if (!byName.has(row.nome)) byName.set(row.nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(row.nome);
    for (const d of row.details) {
      if (d.spessore && !isNaN(Number(d.spessore))) entry.spessori.add(Number(d.spessore));
      if (d.lavorazione) entry.lavorazioni.add(d.lavorazione);
      entry.blocchi.push({ numero: row.numero, spessore: d.spessore, lavorazione: d.lavorazione || "", quantita: d.quantita });
    }
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su stoccheroattilio.com/magazzino-online");

  return {
    id: "stocchero-attilio",
    nome: "Stocchero Attilio",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalla griglia di default (nessun filtro necessario) con scroll di pagina ripetuto fino a stabilizzazione, spessore/lavorazione/numero blocco/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "stocchero-attilio" };
