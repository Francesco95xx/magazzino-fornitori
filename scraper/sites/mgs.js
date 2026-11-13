// MGS Marble and Granite Service — ogni lastra è un div.item-elemento con
// attributi data-* già puliti: data-name (materiale), data-code (numero
// blocco), data-type (lavorazione), data-measures (HTML con L/A/S, lo
// spessore è "S"). La quantità è nel testo di .count_stone. Scroll fino a
// stabilizzazione per caricare tutte le lastre (catalogo grande, ~700 pezzi).
const URL = "https://mgsitaly.com/it/magazzino/";
const ITEM_SELECTOR = "div.item-elemento";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 40; i++) {
    const count = await page.locator(ITEM_SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(600);
  }

  const rows = await page.locator(ITEM_SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const measures = el.dataset.measures || "";
      const spMatch = measures.match(/S<\/b>\s*([\d.]+)/i);
      const qtyText = el.querySelector(".count_stone")?.textContent.trim();
      return {
        nome: el.dataset.name || null,
        numero: el.dataset.code || null,
        spessore: spMatch ? spMatch[1] : null,
        lavorazione: el.dataset.type || null,
        quantita: qtyText ? Number(qtyText) : null,
      };
    })
  );
  await page.close();

  const byName = new Map();
  for (const r of rows) {
    const nome = r.nome && r.nome.trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su mgsitaly.com/magazzino");

  return {
    id: "mgs",
    nome: "MGS Marble and Granite Service",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dagli attributi data-* di ogni lastra (div.item-elemento) con scroll fino a stabilizzazione, spessore/lavorazione/numero blocco/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "mgs" };
