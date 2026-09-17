// Marmi Rossi — magazzino online reale in HTML (non il PDF trovato in
// precedenza su un altro URL), piattaforma Angular con scroll infinito.
// Il nome materiale è in div.mag-col-material (alcune istanze sono vuote,
// usate come segnaposto per righe di continuazione dello stesso blocco).
// Lo scroll va fatto sulla pagina intera (window.scrollTo fino in fondo),
// non su un contenitore interno: il catalogo è grande (~600+ lastre), va
// ripetuto molte volte finché il conteggio si stabilizza.
const URL = "https://marmirossi.com/it/magazzino-online/#/list";
const SELECTOR = "div.mag-col-material";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);

  let prevCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < 150 && stableRounds < 3; i++) {
    const count = await page.locator(SELECTOR).count();
    stableRounds = count === prevCount ? stableRounds + 1 : 0;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
  }

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const unique = [...new Set(raw.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su marmirossi.com/magazzino-online");

  return {
    id: "marmi-rossi",
    nome: "Marmi Rossi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dal Magazzino Online reale (non più il catalogo PDF) con scroll di pagina ripetuto fino a stabilizzazione — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-rossi" };
