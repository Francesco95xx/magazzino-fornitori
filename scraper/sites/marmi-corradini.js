// Marmi Corradini — pagina Magazzino online è un accordion Alpine.js, un
// button.accordion-button per materiale (171 in tutto). Cliccando TUTTI i
// bottoni insieme (un solo giro di evaluate, non uno per uno) Alpine
// renderizza subito ogni riga blocco (.accordion-tab-item) con N.Blocco,
// Misure/Spessore, Lavorazione, Quantità/Disponibili.
const URL = "https://www.corradinigroup.it/magazzino-online/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    document.querySelectorAll("button.accordion-button").forEach((b) => b.click());
  });
  await page.waitForTimeout(2000);

  const rows = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".accordion-item")];
    const out = [];
    for (const item of items) {
      const nome = item.querySelector("span[x-text]")?.textContent.trim();
      if (!nome) continue;
      for (const r of item.querySelectorAll(".accordion-tab-item")) {
        const cols = [...r.querySelectorAll(":scope > div")].map((c) => c.textContent.replace(/\s+/g, " ").trim());
        const spessoreText = cols[3] || "";
        const spessore = (spessoreText.match(/([\d.]+)/) || [])[1] || null;
        const qtyText = cols[6] || cols[5] || "";
        const qtyMatch = qtyText.match(/(\d+)/);
        out.push({
          nome,
          numero: cols[1] || null,
          spessore,
          lavorazione: cols[4] || null,
          quantita: qtyMatch ? Number(qtyMatch[1]) : null,
        });
      }
    }
    return out;
  });
  await page.close();

  const byName = new Map();
  for (const r of rows) {
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su corradinigroup.it/magazzino-online");

  return {
    id: "marmi-corradini",
    nome: "Marmi Corradini",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dall'accordion materiali del Magazzino online (aperti tutti insieme), con spessore/lavorazione/numero blocco/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "marmi-corradini" };
