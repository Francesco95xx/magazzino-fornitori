// R.A. Marmi — categoria "Marmi/Lastre" WooCommerce, unica pagina, nome
// materiale in h3 senza classe dentro il loop prodotti. Solo 10 materiali:
// la scheda di ciascuno riporta spessore e finitura in testo libero ("A 2
// cm di spessore", "a finitura lucida").
const URL = "http://www.ramarmi.com/categoria-prodotto/marmi/lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator("ul.products h3").evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );

  const byName = new Map();
  for (const { nome, href } of raw) {
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
      const spMatch = txt.match(/([\d.]+)\s*cm\s*di spessore/i);
      const finMatch = txt.match(/a finitura\s+(\w+)/i);
      return { spessore: spMatch ? spMatch[1] : null, lavorazione: finMatch ? finMatch[1] : null };
    });
    if (info.spessore) entry.spessori.add(Number(info.spessore));
    if (info.lavorazione) entry.lavorazioni.add(info.lavorazione);
    if (info.spessore || info.lavorazione) {
      entry.blocchi.push({ numero: null, spessore: info.spessore, lavorazione: info.lavorazione || "", quantita: null });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su ramarmi.com/categoria-prodotto/marmi/lastre");

  return {
    id: "ra-marmi",
    nome: "R.A. Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalla categoria Marmi/Lastre (WooCommerce, unica pagina), con link diretto, spessore/finitura letti dalla scheda di ogni prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "ra-marmi" };
