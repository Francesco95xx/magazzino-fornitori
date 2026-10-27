// Granitex — griglia materiali in h3.material-preview-small__title (link a
// /slabs/mat/<id>). Ogni pagina materiale ha una vera tabella blocchi
// (table.material-table__table) con blocco/lavorazione/spessore/misure/
// quantità — una visita per materiale (~106), non troppo pesante.
const URL = "https://www.granitex.it/lastre";
const SELECTOR = "h3.material-preview-small__title";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 15; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(700);
  }

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );

  const materiali = [];
  for (const { nome, href } of raw.filter((e) => e.nome)) {
    const entry = { nome, alias: [], url: href || undefined, spessori: [], lavorazioni: [], blocchi: [] };
    materiali.push(entry);
    if (!href) continue;

    try {
      await page.goto(href, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      continue;
    }
    const rows = await page.evaluate(() => {
      const get = (tr, label) => tr.querySelector(`td[data-mobile-title="${label}"]`)?.textContent.trim() || null;
      return [...document.querySelectorAll("table.material-table__table tbody tr")].map((tr) => ({
        numero: get(tr, "Blocco"),
        lavorazione: get(tr, "Lavorazione"),
        spessore: get(tr, "Spessore"),
        quantita: get(tr, "Quantità"),
      }));
    });

    const spessori = new Set();
    const lavorazioni = new Set();
    for (const r of rows) {
      const sp = r.spessore ? parseFloat(r.spessore) : null;
      const qta = r.quantita ? parseInt(r.quantita, 10) : null;
      if (sp) spessori.add(sp);
      if (r.lavorazione) lavorazioni.add(r.lavorazione);
      entry.blocchi.push({ numero: r.numero, spessore: sp != null ? String(sp) : null, lavorazione: r.lavorazione || "", quantita: qta });
    }
    entry.spessori = [...spessori].sort((a, b) => a - b);
    entry.lavorazioni = [...lavorazioni].sort();
  }
  await page.close();

  materiali.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su granitex.it/lastre");

  return {
    id: "granitex",
    nome: "Granitex",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalla pagina Lastre Disponibili con scroll fino a stabilizzazione, con link diretto alla scheda materiale e spessore/lavorazione/quantità per blocco letti dalla tabella di ogni materiale — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "granitex" };
