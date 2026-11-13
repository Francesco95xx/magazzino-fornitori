// Stocchero Marcello — griglia Angular con scroll infinito, ogni gruppo
// materiale ha un'intestazione .mat-header-row (.p-name) seguita da una o
// più .product-row con lavorazione (.p-superficie), numero blocco
// (.p-codiceprodotto), spessore (.p-sp) e un <select> di quantità (.p-lastre
// select, valore massimo = disponibilità).
const URL = "https://www.stocchero.it/magazzinoonline/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 30; i++) {
    const count = await page.locator(".mat-header-row .p-name").count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(700);
  }

  const rows = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll(".mat-header-row, .product-row")];
    const out = [];
    let currentName = null;
    for (const el of nodes) {
      if (el.classList.contains("mat-header-row")) {
        currentName = el.querySelector(".p-name")?.textContent.trim() || null;
        continue;
      }
      const numero = el.querySelector(".p-codiceprodotto")?.textContent.trim() || null;
      const spessore = el.querySelector(".p-sp")?.textContent.trim() || null;
      const lavorazione = el.querySelector(".p-superficie")?.textContent.trim() || null;
      const opts = [...el.querySelectorAll(".p-lastre select option")].map((o) => Number(o.value)).filter((n) => !isNaN(n));
      out.push({
        nome: currentName,
        numero,
        spessore,
        lavorazione,
        quantita: opts.length ? Math.max(...opts) : null,
      });
    }
    return out;
  });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su stocchero.it/magazzinoonline");

  return {
    id: "stocchero-marcello",
    nome: "Stocchero Marcello",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalle intestazioni dei gruppi materiale con scroll fino a stabilizzazione, spessore/lavorazione/numero blocco/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "stocchero-marcello" };
