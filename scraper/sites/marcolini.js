// Marcolini Marmi — filtro "Filter by Name" è un <select id="filtroprodottoa"
// name="PRODOTTO"> ma selezionarlo via UI è inaffidabile (widget "chosen"
// nascosto). Usiamo invece direttamente la vista "Stone Gallery" con tutti
// i filtri a "all" (stone-gallery/s/all/all/all/all.asp): elenca ogni
// blocco con lavorazione, dimensioni (spessore = terzo numero) e
// disponibilità, paginata con link "NEXT PAGE" (.../all/all/all/all/B.asp,
// C.asp, ...). Il testo della pagina usa spazi unificatori (nbsp) attorno
// al trattino "<nome> - <codice>", va normalizzato prima del regex.
// Non va letto da outlet.asp ("Best Price Corner", solo i materiali in
// saldo/clearance): il vero magazzino online è questa Stone Gallery.
const BASE = "https://www.marcolinimarmi.com/stone-gallery/s/all/all/all/all.asp";
const MAX_PAGES = 60;
const BLOCK_RE =
  /([^\n]+?) - (\S+)\(0\)\nProcessing:\s*([^\n]*)\nApprox\. Sizes:\s*([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*CM\.\nAvailability:\s*([\d.,]+)\s*SQM\s*\/\s*n\.(\d+)\s*pieces/g;

function extractBlocks(page) {
  return page.evaluate((reSource) => {
    const txt = document.body.innerText.replace(/ /g, " ");
    const re = new RegExp(reSource, "g");
    const out = [];
    let m;
    while ((m = re.exec(txt))) out.push(m.slice(1));
    const nextHref = [...document.querySelectorAll("a")].find((e) => /NEXT/i.test(e.textContent))?.getAttribute("href") || null;
    return { blocks: out, nextHref };
  }, BLOCK_RE.source);
}

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1000);

  let allBlocks = [];
  let { blocks, nextHref } = await extractBlocks(page);
  allBlocks = allBlocks.concat(blocks);

  for (let i = 0; i < MAX_PAGES && nextHref; i++) {
    const url = new URL(nextHref, page.url()).href;
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(800);
    const res = await extractBlocks(page);
    if (res.blocks.length === 0) break;
    allBlocks = allBlocks.concat(res.blocks);
    nextHref = res.nextHref;
  }
  await page.close();

  const byName = new Map();
  for (const [nome, codice, lavorazione, , , spessore, , pezzi] of allBlocks) {
    const n = nome.trim();
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(n);
    const sp = Number(spessore);
    if (!isNaN(sp)) entry.spessori.add(sp);
    if (lavorazione) entry.lavorazioni.add(lavorazione.trim());
    entry.blocchi.push({ numero: codice, spessore, lavorazione: lavorazione.trim(), quantita: Number(pezzi) || null });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nella Stone Gallery di marcolinimarmi.com");

  return {
    id: "marcolini",
    nome: "Marcolini Marmi",
    url: "https://www.marcolinimarmi.com/stonegallery.asp",
    stato: "scraped",
    note:
      "Elenco letto dalla vera Stone Gallery online (non il solo outlet/clearance), con lavorazione/spessore/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "marcolini" };
