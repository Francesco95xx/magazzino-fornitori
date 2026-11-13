// Marmi Colombare — una table.tabellaMagazzino per materiale (intestazione
// td.tableHeadRow col nome), righe tbody con colonne fisse: ID, Blocco,
// Disponibilità (PZ), Lunghezza, Larghezza, Spessore, Um., Giacenza (MQ).
const URL = "https://colombare.it/magazzino-lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  const rows = await page.evaluate(() => {
    const out = [];
    for (const table of document.querySelectorAll("table.tabellaMagazzino")) {
      const nome = table.querySelector("td.tableHeadRow")?.textContent.trim();
      if (!nome) continue;
      for (const tr of table.querySelectorAll("tbody tr")) {
        const cells = [...tr.querySelectorAll("td")].map((td) => td.textContent.trim());
        out.push({
          nome,
          numero: cells[1] || null,
          quantita: cells[2] ? Number(cells[2]) : null,
          spessore: cells[5] || null,
        });
      }
    }
    return out;
  });
  await page.close();

  const byName = new Map();
  for (const r of rows) {
    if (!r.nome) continue;
    if (!byName.has(r.nome)) byName.set(r.nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(r.nome);
    if (r.spessore) entry.spessori.add(Number(r.spessore));
    entry.blocchi.push({ numero: r.numero, spessore: r.spessore, lavorazione: "", quantita: r.quantita });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [],
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su colombare.it/magazzino-lastre");

  return {
    id: "marmi-colombare",
    nome: "Marmi Colombare",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalla tabella Magazzino Lastre (una tabella per materiale), con spessore/numero blocco/lastre disponibili per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "marmi-colombare" };
