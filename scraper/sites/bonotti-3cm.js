// Bonotti — Stock 3cm (Dropbox). Stessa convenzione di nomi di bonotti.js
// (Stock 2cm), file sciolti in radice + 2 sottocartelle (_marble 3cm,
// _offer 3cm).
const { listFolder } = require("./_platforms/dropbox");
const { dedupeWithUrl } = require("./_platforms/dedupe");

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

async function scrape(context) {
  const page = await context.newPage();
  const rootItems = await listFolder(page, URL);
  const subfolders = rootItems.filter((i) => !i.alt && i.href);

  let entries = rootItems.filter((i) => i.alt).map((i) => ({ nome: cleanName(i.alt), href: i.href }));
  for (const sub of subfolders) {
    const items = await listFolder(page, sub.href);
    entries = entries.concat(items.filter((i) => i.alt).map((i) => ({ nome: cleanName(i.alt), href: i.href })));
  }
  await page.close();

  const materiali = dedupeWithUrl(entries);
  if (materiali.length === 0) throw new Error("Nessun materiale trovato nella cartella Dropbox Bonotti Stock 3cm");

  return {
    id: "bonotti-3cm",
    nome: "Bonotti - Stock 3cm (Dropbox)",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai nomi file (root + sottocartelle _marble 3cm e _offer 3cm) della cartella Dropbox pubblica, ciascuno con link diretto all'anteprima del file su Dropbox — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "bonotti-3cm" };
