// Bonotti — Stock 2cm (Dropbox). File sciolti in radice + 2 sottocartelle
// (_marble 2cm, special offer 2cm). Nome file tipo
// "alga green quarzite b 9297.345_8 slabs_320x202x2cm.jpg" — il materiale
// è il testo prima del primo numero, ripulito dal marcatore finale
// "b"/"c" (indicatore blocco).
const { listFolder } = require("./_platforms/dropbox");
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL =
  "https://www.dropbox.com/scl/fo/uorcnmy9zgxcw5526tg8w/AHfOIfmDNx2rbn7GQNEknq4?rlkey=eo1yc3s3dxiu0z9afu7wiin7h&e=2&dl=0";

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
  if (materiali.length === 0) throw new Error("Nessun materiale trovato nella cartella Dropbox Bonotti Stock 2cm");

  return {
    id: "bonotti",
    nome: "Bonotti (Dropbox)",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai nomi file (root + sottocartelle _marble 2cm e special offer 2cm) della cartella Dropbox pubblica, ciascuno con link diretto all'anteprima del file su Dropbox — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "bonotti" };
