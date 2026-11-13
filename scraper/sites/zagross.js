// Zagross Marmi — shop WooCommerce con scroll infinito, nome pulito in
// h2.woocommerce-loop-product__title. Ogni scheda prodotto riporta N°
// blocco/Quantità/spessore/Lavorazione in testo libero.
const URL = "https://zagrossmarmi.com/pronta-consegna/";
const SELECTOR = "h2.woocommerce-loop-product__title";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 20; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(700);
  }

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a") || el.parentElement.querySelector("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );

  const byName = new Map();
  const seenHrefs = new Set();
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
      const numero = (txt.match(/N°?\s*blocco:\s*([^\n]+)/i) || [])[1]?.trim() || null;
      const quantita = (txt.match(/Quantità:\s*(\d+)/i) || [])[1];
      const spessore = (txt.match(/spessore:\s*([\d.]+)\s*cm/i) || [])[1] || null;
      const lavorazione = (txt.match(/Lavorazione:\s*([^\n]+)/i) || [])[1]?.trim() || null;
      return { numero, quantita: quantita ? Number(quantita) : null, spessore, lavorazione };
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

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su zagrossmarmi.com/pronta-consegna");

  return {
    id: "zagross",
    nome: "Zagross Marmi",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dallo shop Pronta Consegna (WooCommerce) con scroll fino a stabilizzazione, con link diretto, numero blocco/spessore/lavorazione/quantità letti dalla scheda di ogni prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "zagross" };
