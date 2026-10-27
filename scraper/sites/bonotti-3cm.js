// Bonotti — Stock 3cm (Dropbox). Stessa convenzione di nomi di bonotti.js
// (Stock 2cm), file sciolti in radice + 2 sottocartelle (_marble 3cm,
// _offer 3cm).
const { listFolder } = require("./_platforms/dropbox");

const URL =
  "https://www.dropbox.com/scl/fo/lgii850jk7aegr3gk6wm5/ABqQ1zi7RUpu66d5hRW6ZNc?rlkey=as52345zjet3wvxwbnscso0cp&e=3&dl=0";

function cleanName(alt) {
  const noExt = alt.replace(/\.[a-z0-9]+$/i, "");
  const m = noExt.match(/^(.*?)\d/);
  let prefix = m ? m[1] : noExt;
  prefix = prefix.replace(/[_\s]*[bc][_\s]*$/i, "");
  prefix = prefix.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return prefix;
}

function parseFile(alt) {
  const nome = cleanName(alt);
  const codeMatch = alt.match(/[bc]\s*([\d.]+)_/i);
  const qtyMatch = alt.match(/(\d+)\s*slabs?/i);
  const dimMatch = alt.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*([\d.]+)\s*cm/i);
  return {
    nome,
    numero: codeMatch ? codeMatch[1] : null,
    spessore: dimMatch ? dimMatch[3] : null,
    quantita: qtyMatch ? Number(qtyMatch[1]) : null,
  };
}

async function scrape(context) {
  const page = await context.newPage();
  const rootItems = await listFolder(page, URL);
  const subfolders = rootItems.filter((i) => !i.alt && i.href);

  let entries = rootItems.filter((i) => i.alt).map((i) => ({ ...parseFile(i.alt), href: i.href }));
  for (const sub of subfolders) {
    const items = await listFolder(page, sub.href);
    entries = entries.concat(items.filter((i) => i.alt).map((i) => ({ ...parseFile(i.alt), href: i.href })));
  }
  await page.close();

  const byName = new Map();
  for (const e of entries) {
    if (!e.nome) continue;
    if (!byName.has(e.nome)) byName.set(e.nome, { href: e.href, spessori: new Set(), blocchi: [] });
    const entry = byName.get(e.nome);
    if (e.spessore) entry.spessori.add(Number(e.spessore));
    entry.blocchi.push({ numero: e.numero, spessore: e.spessore, lavorazione: "", quantita: e.quantita });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href,
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [],
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nella cartella Dropbox Bonotti Stock 3cm");

  return {
    id: "bonotti-3cm",
    nome: "Bonotti - Stock 3cm (Dropbox)",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai nomi file (root + sottocartelle _marble 3cm e _offer 3cm) della cartella Dropbox pubblica, con link diretto all'anteprima del file, spessore/numero blocco/lastre disponibili ricavati dal nome file — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "bonotti-3cm" };
