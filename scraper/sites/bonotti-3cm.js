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

async function scrape(context) {
  const page = await context.newPage();
  const rootItems = await listFolder(page, URL);
  const subfolders = rootItems.filter((i) => !i.alt && i.href);

  let names = rootItems.filter((i) => i.alt).map((i) => cleanName(i.alt));
  for (const sub of subfolders) {
    const items = await listFolder(page, sub.href);
    names = names.concat(items.filter((i) => i.alt).map((i) => cleanName(i.alt)));
  }
  await page.close();

  const unique = [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nella cartella Dropbox Bonotti Stock 3cm");

  return {
    id: "bonotti-3cm",
    nome: "Bonotti - Stock 3cm (Dropbox)",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai nomi file (root + sottocartelle _marble 3cm e _offer 3cm) della cartella Dropbox pubblica — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "bonotti-3cm" };
