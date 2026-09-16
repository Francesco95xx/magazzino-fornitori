// Vanti Franco — titoli lastra sono "<Materiale> BL <numero blocco>"
// (a volte senza suffisso); ripuliamo il suffisso per ottenere il materiale.
const URL = "https://www.vantifranco.com/index.php/it/magazzino/lastre";
const SELECTOR = "h4.nspHeader";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.locator(SELECTOR).allTextContents();
  await page.close();

  const cleaned = raw.map((t) => t.replace(/\s+bl\s*\d+\s*$/i, "").trim()).filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su vantifranco.com/magazzino/lastre");

  return {
    id: "vanti",
    nome: "Vanti Franco",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dai titoli lastra della pagina Magazzino/Lastre, ripulendo il suffisso \"BL <numero blocco>\" — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "vanti" };
