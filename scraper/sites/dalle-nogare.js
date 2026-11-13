// Dalle Nogare Graniti — il vero magazzino (home, nessun filtro necessario)
// ha ogni blocco già nel DOM come tabella con bottone "Aggiungi"
// (button.add-to-cart), i cui attributi data-* portano già tutto pulito:
// data-material (nome), data-blocco (numero), data-spessore, data-altezza/
// data-larghezza (misure), data-finitura, data-disponibilita (lastre).
const URL = "https://www.dallenogaregraniti.it/en/online-warehouse/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const rows = await page.locator("button.add-to-cart").evaluateAll((els) =>
    els.map((el) => ({
      nome: el.dataset.material || null,
      numero: el.dataset.blocco || null,
      spessore: el.dataset.spessore || null,
      lavorazione: el.dataset.finitura || null,
      quantita: el.dataset.disponibilita ? Number(el.dataset.disponibilita) : null,
    }))
  );
  await page.close();

  const byName = new Map();
  for (const r of rows) {
    if (!r.nome) continue;
    if (!byName.has(r.nome)) byName.set(r.nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(r.nome);
    if (r.spessore) entry.spessori.add(Number(r.spessore));
    if (r.lavorazione) entry.lavorazioni.add(r.lavorazione);
    entry.blocchi.push(r);
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi.map(({ numero, spessore, lavorazione, quantita }) => ({ numero, spessore, lavorazione: lavorazione || "", quantita })),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nel magazzino Dalle Nogare");

  return {
    id: "dalle-nogare",
    nome: "Dalle Nogare Graniti",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal vero magazzino (home, nessun filtro necessario), con spessore/lavorazione/numero blocco/lastre disponibili per blocco letti dagli attributi data-* del bottone Aggiungi — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "dalle-nogare" };
