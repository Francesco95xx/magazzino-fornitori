// Vanti Franco — titoli lastra sono "<Materiale> BL <numero blocco>"
// (a volte senza suffisso); ripuliamo il suffisso per ottenere il materiale.
// Ogni scheda prodotto ha un riquadro "INFORMAZIONI AGGIUNTIVE" con Numero
// Blocco/Spessore/Finitura (una visita per materiale, ~57).
const URL = "https://www.vantifranco.com/index.php/it/magazzino/lastre";
const SELECTOR = "h4.nspHeader";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const a = el.querySelector("a");
      return { text: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );

  const byName = new Map();
  for (const { text, href } of raw) {
    const nome = text.replace(/\s+bl\s*\d+\s*$/i, "").trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { href, spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (!href) continue;

    try {
      await page.goto(href, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      continue;
    }
    const info = await page.evaluate(() => {
      const txt = document.body.innerText;
      const m = txt.match(/Numero Blocco:\s*\n?([^\n]+)[\s\S]{0,80}?Spessore:\s*\n?([\d.]+)\s*cm[\s\S]{0,60}?Finitura:\s*\n?([^\n]+)/);
      return m ? { numero: m[1].trim(), spessore: m[2].trim(), lavorazione: m[3].trim() } : null;
    });
    if (info) {
      entry.spessori.add(Number(info.spessore));
      entry.lavorazioni.add(info.lavorazione);
      entry.blocchi.push({ numero: info.numero, spessore: info.spessore, lavorazione: info.lavorazione, quantita: null });
    }
  }
  await page.close();

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href,
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su vantifranco.com/magazzino/lastre");

  return {
    id: "vanti",
    nome: "Vanti Franco",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dai titoli lastra della pagina Magazzino/Lastre, ripulendo il suffisso "BL <numero blocco>", con link diretto, spessore/lavorazione/numero blocco letti dalla scheda di ogni prodotto — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "vanti" };
