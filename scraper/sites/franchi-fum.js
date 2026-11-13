// Franchi Umberto Marmi — pagina "Altri Materiali" (3 pagine), ogni blocco è
// testo tipo "NOME - BLOCCO <codice> - <spessore> cm"; estraiamo tutto via
// regex (il DOM è virtualizzato e non offre un selettore stabile).
const BASE = "https://www.fum.it/franchi-store/altri-materiali/";
const PAGES = [BASE, `${BASE}page/2/`, `${BASE}page/3/`];
const RE = /^(.+?)\s*-\s*BLOCCO\s+(\S+)\s*-\s*([\d.]+)\s*cm/gm;

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (const url of PAGES) {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(text))) all.push({ nome: m[1].trim(), numero: m[2].trim(), spessore: m[3].trim() });
  }
  await page.close();

  const byName = new Map();
  for (const r of all) {
    if (!r.nome) continue;
    if (!byName.has(r.nome)) byName.set(r.nome, { spessori: new Set(), blocchi: [] });
    const entry = byName.get(r.nome);
    entry.spessori.add(Number(r.spessore));
    entry.blocchi.push({ numero: r.numero, spessore: r.spessore, lavorazione: "", quantita: null });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su fum.it/franchi-store/altri-materiali");

  return {
    id: "franchi-fum",
    nome: "Franchi Umberto Marmi",
    url: BASE,
    stato: "scraped",
    note:
      'Elenco estratto via regex dal testo dei blocchi ("NOME - BLOCCO codice - spessore cm") sulle 3 pagine di Altri Materiali, con numero blocco/spessore per blocco — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "franchi-fum" };
