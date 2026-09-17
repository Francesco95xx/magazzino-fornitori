// Venturini Marmi — sito Wix statico, pagina piccola con poco testo:
// prendiamo tutti gli span di testo della pagina ed escludiamo titolo,
// intestazione "MARMI DI CAVA", il paragrafo lungo sul finanziamento POR
// FESR e le righe di contatto/footer (riconoscibili da lunghezza/contenuto),
// il resto sono i nomi materiale.
const URL = "https://www.venturinimarmisrl.com/it/materiales";

function isBoilerplate(text) {
  if (text.length > 60) return true; // paragrafo lungo sul finanziamento
  if (/@|VENTURINI MARMI S\.R\.L|ARTE DELLA SELEZIONE|MASTERS OF STONE|MARMI DI CAVA/i.test(text)) return true;
  return false;
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2000);

  const names = await page.locator("span.wixui-rich-text__text").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !isBoilerplate(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato sulla pagina Materiali");

  return {
    id: "venturini-marmi",
    nome: "Venturini Marmi",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dalla sezione "Marmi di Cava" della pagina Materiali — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "venturini-marmi" };
