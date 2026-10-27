// Mondial Marmi — si leggeva /materials/ (tema Avada/Fusion, pagina
// marketing con TUTTI i materiali che lavorano, non lo stock reale). Il
// vero magazzino è /stock/ (mostra la data di ultimo aggiornamento),
// ciascuna voce è un <h2><strong>NOME</strong>[, CODICE][, n.LOTTO], N
// slab[s] L x W x T approx</h2> — alcune voci senza dati (fine lista/altre
// categorie) restano solo col nome.
const URL = "https://www.mondialmarmi.com/stock/";

function parseLine(line) {
  const parts = line.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const rawName = parts[0];

  let numero = null;
  let quantita = null;
  let spessore = null;
  for (const p of parts.slice(1)) {
    const nMatch = p.match(/^n\.(\S+)/i);
    if (nMatch) numero = nMatch[1];
    const qMatch = p.match(/(\d+)\s*slabs?/i);
    if (qMatch) quantita = Number(qMatch[1]);
    const dimMatch = p.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*([\d.]+)\s*approx/i);
    if (dimMatch) spessore = dimMatch[3];
  }
  if (!spessore) {
    const dimMatch = line.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*([\d.]+)\s*approx/i);
    if (dimMatch) spessore = dimMatch[3];
  }
  if (!quantita) {
    const qMatch = line.match(/(\d+)\s*slabs?/i);
    if (qMatch) quantita = Number(qMatch[1]);
  }

  const codeMatch = rawName.match(/^(.*?)\s+(\S*\d\S*)$/);
  let nome = rawName;
  if (codeMatch) {
    nome = codeMatch[1];
    if (!numero) numero = codeMatch[2];
  }
  return { nome: nome.trim(), numero, spessore, quantita };
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const lines = await page.locator("h2:has(strong)").allTextContents();
  await page.close();

  const byName = new Map();
  for (const line of lines) {
    const parsed = parseLine(line.trim());
    if (!parsed || !parsed.nome) continue;
    if (!byName.has(parsed.nome)) byName.set(parsed.nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(parsed.nome);
    if (parsed.spessore) entry.spessori.add(Number(parsed.spessore));
    if (parsed.numero || parsed.spessore || parsed.quantita) {
      entry.blocchi.push({ numero: parsed.numero, spessore: parsed.spessore, lavorazione: "", quantita: parsed.quantita });
    }
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su mondialmarmi.com/stock");

  return {
    id: "mondial-marmi",
    nome: "Mondial Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal vero Stock (non più la pagina Materiali, un catalogo marketing), con spessore/numero blocco/lastre disponibili per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "mondial-marmi" };
