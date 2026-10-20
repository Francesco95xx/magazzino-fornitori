// Vanti Franco — titoli lastra sono "<Materiale> BL <numero blocco>"
// (a volte senza suffisso); ripuliamo il suffisso per ottenere il materiale.
const { dedupeWithUrl } = require("./_platforms/dedupe");

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
  await page.close();

  const entries = raw
    .map(({ text, href }) => ({ nome: text.replace(/\s+bl\s*\d+\s*$/i, "").trim(), href }))
    .filter((e) => e.nome);
  const materiali = dedupeWithUrl(entries);
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su vantifranco.com/magazzino/lastre");

  return {
    id: "vanti",
    nome: "Vanti Franco",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai titoli lastra della pagina Magazzino/Lastre, ripulendo il suffisso \"BL <numero blocco>\", con link diretto alla scheda prodotto — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "vanti" };
