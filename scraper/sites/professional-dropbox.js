// Professional — AVAILABLE MATERIALS 2CM! (Dropbox). Cartella unica, senza
// sottocartelle. Nome file tipo
// "Arabescato Corchia Venato PRM 31097 n. 24 Polished slabs 305x200x2.png"
// — il materiale è il testo prima del marcatore "n. <numero lastre>",
// ripulito dal codice blocco finale (token tutto maiuscolo e/o numerico).
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
  if (m) {
    s = m[1];
    const m2 = s.match(/^(.*?)\s+([A-Z]{2,6})$/);
    if (m2) s = m2[1];
  }
  return s.replace(/\s+/g, " ").trim();
}

async function scrape(context) {
  const page = await context.newPage();
  const items = await listFolder(page, URL);
  await page.close();

  const names = items.filter((i) => i.alt).map((i) => cleanName(i.alt));
  const unique = [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nella cartella Dropbox Professional");

  return {
    id: "professional-dropbox",
    nome: "Professional (Dropbox)",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai nomi file della cartella Dropbox pubblica AVAILABLE MATERIALS 2CM! — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "professional-dropbox" };
