// Franchi Umberto Marmi — pagina "Altri Materiali" (3 pagine), ogni blocco è
// testo tipo "NOME - BLOCCO <codice> NOME - 2 cm"; estraiamo il nome dal
// testo via regex (il DOM è virtualizzato e non offre un selettore stabile).
const BASE = "https://www.fum.it/franchi-store/altri-materiali/";
const PAGES = [BASE, `${BASE}page/2/`, `${BASE}page/3/`];
const RE = /-\s*BLOCCO\s+\S+\s+([A-ZÀ-Ü][A-ZÀ-Ü' /]+?)\s*-\s*\d/g;

async function scrape(context) {
  const page = await context.newPage();
  let all = [];

  for (const url of PAGES) {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(text))) all.push(m[1].trim());
  }
  await page.close();

  const unique = [...new Set(all)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su fum.it/franchi-store/altri-materiali");

  return {
    id: "franchi-fum",
    nome: "Franchi Umberto Marmi",
    url: BASE,
    stato: "scraped",
    note:
      'Elenco estratto via regex dal testo dei blocchi ("NOME - BLOCCO codice NOME - spessore") sulle 3 pagine di Altri Materiali — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "franchi-fum" };
