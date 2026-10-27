// Professional — AVAILABLE MATERIALS 2CM! (Dropbox). Cartella unica, senza
// sottocartelle. Nome file tipo
// "Arabescato Corchia Venato PRM 31097 n. 24 Polished slabs 305x200x2.png"
// — il materiale è il testo prima del marcatore "n. <numero lastre>",
// ripulito dal codice blocco finale (token tutto maiuscolo e/o numerico).
// Spessore sempre 2cm (nome cartella), lavorazione e lastre disponibili
// ricavate dallo stesso nome file.
const { listFolder } = require("./_platforms/dropbox");

const URL =
  "https://www.dropbox.com/scl/fo/zwzx26kytdb26cvkjhf79/AIU_qbkI6KNJfSilICYWAmk?rlkey=vvotvwav1xvblsemwrn1mdmjo&e=2&st=f23yd1m6&dl=0";

function cleanName(alt) {
  const noExt = alt.replace(/\.[a-z0-9]+$/i, "");
  let s = noExt.split(/\s+n\.\s*\d+/i)[0].trim();
  // il codice blocco è l'ultimo token e contiene sempre almeno una cifra
  // (es. "26296A", "31097"); una volta tolto quello, se resta anche un
  // marcatore tutto maiuscolo (es. "PRM") lo togliamo pure. Non tocchiamo
  // token che non contengono cifre: potrebbero far parte del nome vero
  // (es. "Naica" da solo, senza sigla).
  const m = s.match(/^(.*?)\s+(\S*\d\S*)$/);
  let numero = null;
  if (m) {
    s = m[1];
    numero = m[2];
    const m2 = s.match(/^(.*?)\s+([A-Z]{2,6})$/);
    if (m2) s = m2[1];
  }
  return { nome: s.replace(/\s+/g, " ").trim(), numero };
}

function parseFile(alt) {
  const { nome, numero } = cleanName(alt);
  const qtyMatch = alt.match(/n\.\s*(\d+)/i);
  const finMatch = alt.match(/n\.\s*\d+\s+([A-Za-z]+)\s+slabs/i);
  return {
    nome,
    numero,
    spessore: "2",
    lavorazione: finMatch ? finMatch[1] : "",
    quantita: qtyMatch ? Number(qtyMatch[1]) : null,
  };
}

async function scrape(context) {
  const page = await context.newPage();
  const items = await listFolder(page, URL);
  await page.close();

  const byName = new Map();
  for (const i of items.filter((i) => i.alt)) {
    const e = parseFile(i.alt);
    if (!e.nome) continue;
    if (!byName.has(e.nome)) byName.set(e.nome, { href: i.href, lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(e.nome);
    if (e.lavorazione) entry.lavorazioni.add(e.lavorazione);
    entry.blocchi.push({ numero: e.numero, spessore: e.spessore, lavorazione: e.lavorazione, quantita: e.quantita });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href,
      spessori: [2],
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nella cartella Dropbox Professional");

  return {
    id: "professional-dropbox",
    nome: "Professional (Dropbox)",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai nomi file della cartella Dropbox pubblica AVAILABLE MATERIALS 2CM!, con link diretto, lavorazione/lastre disponibili per blocco ricavati dal nome file (spessore sempre 2cm) — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "professional-dropbox" };
