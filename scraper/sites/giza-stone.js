// Giza Stone — la home mostra già lo stock reale (nessun filtro
// necessario), paginata (?view=store&pag=N): gruppi materiale (b.titleMag)
// seguiti da uno o più blocchi (div.tabPanel, b.subTitleMag per il numero
// blocco), ciascuno con una o più righe lavorazione/dimensioni/spessore/
// deposito/quantità (la quantità è il valore massimo di un <select>).
const URL = "https://www.gizastone.com/it/magazzino-online/magazzino-online.asp";
const PAGE_URL = (n) => `https://www.gizastone.com/it/magazzino-online/magazzino-online.asp?view=store&pag=${n}`;
const MAX_PAGES = 30;

function extractRows(page) {
  return page.evaluate(() => {
    const container = document.querySelector("#panelContainerStore");
    if (!container) return [];
    const items = [...container.querySelectorAll("b.titleMag, div.tabPanel")];
    const out = [];
    let currentName = null;
    for (const el of items) {
      if (el.classList.contains("titleMag")) {
        currentName = el.textContent.trim();
        continue;
      }
      const numero = el.querySelector("b.subTitleMag")?.textContent.trim() || null;
      const bigCol = el.querySelector(":scope > div[class*='col-lg-10']");
      const subRows = bigCol ? [...bigCol.querySelectorAll(":scope > div.row")] : [];
      for (const r of subRows) {
        const cells = [...r.children];
        const lavorazione = cells[0]?.textContent.trim() || null;
        const spText = cells[2]?.textContent.trim() || "";
        const spessore = (spText.match(/([\d.]+)/) || [])[1] || null;
        const opts = cells[4]
          ? [...cells[4].querySelectorAll("select option")].map((o) => Number(o.value)).filter((n) => !isNaN(n))
          : [];
        out.push({
          nome: currentName,
          numero,
          spessore,
          lavorazione,
          quantita: opts.length ? Math.max(...opts) : null,
        });
      }
    }
    return out;
  });
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let all = await extractRows(page);
  for (let n = 2; n <= MAX_PAGES; n++) {
    try {
      await page.goto(PAGE_URL(n), { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      break;
    }
    const rows = await extractRows(page);
    if (rows.length === 0) break;
    all = all.concat(rows);
  }
  await page.close();

  const byName = new Map();
  for (const r of all) {
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nel magazzino Giza Stone");

  return {
    id: "giza-stone",
    nome: "Giza Stone",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal vero magazzino (nessun filtro necessario, paginato) con spessore/lavorazione/numero blocco/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "giza-stone" };
