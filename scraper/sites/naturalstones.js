// NaturalStone — trovato un URL pubblico diverso da quello originale
// (naturalstones.isodata.it, che richiede login): naturalstones.marbler3.it
// è la stessa piattaforma MarbleR3 ma accessibile senza credenziali.
// Il catalogo mostra 24 lastre per pagina di default; selezioniamo la
// dimensione massima (48) cliccando il bottone corrispondente — è anche il
// totale reale dei blocchi attualmente a catalogo (non c'è altra
// paginazione/scroll). Ogni card ha nome, codice blocco, lavorazione,
// dimensioni (il terzo numero è lo spessore in cm) e lastre disponibili.
const URL = "https://naturalstones.marbler3.it/catalogo/";
const CARD_H3_SELECTOR = "h3.min-w-0.truncate";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  await page
    .locator('button:text-is("48")')
    .click({ timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(1500);

  const cards = await page.evaluate((h3Selector) => {
    return [...document.querySelectorAll(h3Selector)].map((h3) => {
      const card = h3.closest(".group") || h3.parentElement?.parentElement?.parentElement;
      const nome = h3.textContent.trim();
      const numero = h3.nextElementSibling ? h3.nextElementSibling.textContent.trim() : null;
      const p = card ? card.querySelector("p.text-muted-foreground") : null;
      const lavorazione = p ? p.textContent.trim() : null;
      const text = card ? card.textContent : "";
      const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)\s*cm/);
      const spessore = dimMatch ? dimMatch[3] : null;
      const qtaMatch = text.match(/(\d+)\s*Lastre/i);
      const quantita = qtaMatch ? Number(qtaMatch[1]) : null;
      return { nome, numero, lavorazione, spessore, quantita };
    });
  }, CARD_H3_SELECTOR);
  await page.close();

  const byName = new Map();
  for (const c of cards) {
    const nome = c.nome && c.nome.trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (c.spessore) entry.spessori.add(Number(c.spessore));
    if (c.lavorazione) entry.lavorazioni.add(c.lavorazione);
    entry.blocchi.push({ numero: c.numero, spessore: c.spessore, lavorazione: c.lavorazione || "", quantita: c.quantita });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su naturalstones.marbler3.it/catalogo");

  return {
    id: "naturalstones",
    nome: "NaturalStone",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal catalogo pubblico (dimensione pagina 48, il totale reale dei blocchi attuali) — piattaforma MarbleR3 accessibile senza login su questo dominio, a differenza di naturalstones.isodata.it. Spessore/lavorazione/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "naturalstones" };
