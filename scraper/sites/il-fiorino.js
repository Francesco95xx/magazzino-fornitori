// Il Fiorino Marmi — store online statico (nessuna paginazione, tutte le
// lastre già nel DOM), nome materiale in h2 dentro div.box-lastra.
// Nota: page.goto con waitUntil "networkidle" va in timeout su questo sito
// (richieste in background persistenti); usare "load" invece.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "https://ilfiorino.store/";
const SELECTOR = "div.box-lastra h2";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2000);

  const raw = await page.locator(SELECTOR).evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a");
      return { nome: (el.textContent || "").trim(), href: a ? a.href : null };
    })
  );
  await page.close();

  const materiali = dedupeWithUrl(raw.filter((e) => e.nome));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su ilfiorino.store");

  return {
    id: "il-fiorino",
    nome: "Il Fiorino Marmi",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai titoli lastra dello store online, con link diretto alla scheda lastra — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "il-fiorino" };
