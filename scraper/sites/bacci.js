// Bacci Marmi — griglia Elementor, nome materiale in h3.elementor-post__title.
// Ogni scheda prodotto (solo 16 materiali) riporta misure (il terzo numero
// è lo spessore), lastre disponibili, finitura e numero blocco in testo
// libero.
const URL = "https://www.marmibacci.com/lastre/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator("h3.elementor-post__title").evaluateAll((els) =>
    els.map((el) => {
      const a = el.querySelector("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );

  const seenHrefs = new Set();
  const byName = new Map();
  for (const { nome, href } of raw) {
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { href, spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    if (!href || seenHrefs.has(href)) continue;
    seenHrefs.add(href);

    try {
      await page.goto(href, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      continue;
    }
    const info = await page.evaluate(() => {
      const txt = document.body.innerText;
      const dimMatch = txt.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*([\d.]+)\s*cm/i);
      const qtyMatch = txt.match(/Lastre\s*[–-]\s*Slabs:\s*(\d+)/i);
      const finMatch = txt.match(/\n([A-Za-zÀ-ÿ]+)\s*[–-]\s*[A-Za-z]+\n(?:Blocco|Block)/i);
      const numMatch = txt.match(/Blocco\s*[–-]\s*Block Number:\s*([^\n]+)/i);
      return {
        spessore: dimMatch ? dimMatch[3] : null,
        quantita: qtyMatch ? Number(qtyMatch[1]) : null,
        lavorazione: finMatch ? finMatch[1].trim() : null,
        numero: numMatch ? numMatch[1].trim() : null,
      };
    });
    if (info.spessore) entry.spessori.add(Number(info.spessore));
    if (info.lavorazione) entry.lavorazioni.add(info.lavorazione);
    entry.blocchi.push({ numero: info.numero, spessore: info.spessore, lavorazione: info.lavorazione || "", quantita: info.quantita });
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su marmibacci.com/lastre");

  return {
    id: "bacci",
    nome: "Bacci Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dalla griglia lastre (Elementor), con link diretto, spessore/lastre disponibili/finitura/numero blocco letti dalla scheda di ogni prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "bacci" };
