// Orchestratore: fa girare tutti gli scraper in scraper/sites/, unisce il
// risultato con i fornitori "statici" (non ancora automatizzati) in
// seed-static.json, e scrive ../data/fornitori.json.
//
// Se uno scraper fallisce, NON cancella i dati di quel fornitore: se esiste
// già un data/fornitori.json da una corsa precedente, tiene quella versione
// per il fornitore fallito invece di sparire dal sito.

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const SITES_DIR = path.join(__dirname, "sites");
const SEED_STATIC_PATH = path.join(__dirname, "seed-static.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "fornitori.json");

function loadJsonIfExists(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const siteModules = fs
    .readdirSync(SITES_DIR)
    .filter((f) => f.endsWith(".js"))
    .map((f) => require(path.join(SITES_DIR, f)));

  const previousOutput = loadJsonIfExists(OUTPUT_PATH) || [];
  const previousById = new Map(previousOutput.map((f) => [f.id, f]));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  const scraped = [];
  const failures = [];

  for (const mod of siteModules) {
    process.stdout.write(`Scraping ${mod.id}... `);
    try {
      const result = await mod.scrape(context);
      console.log(`OK (${result.materiali.length} materiali)`);
      scraped.push(result);
    } catch (err) {
      console.log(`FALLITO: ${err.message}`);
      failures.push({ id: mod.id, error: err.message });
      const fallback = previousById.get(mod.id);
      if (fallback) {
        console.log(`  -> uso l'ultima versione buona (${fallback.materiali.length} materiali)`);
        scraped.push(fallback);
      } else {
        console.log(`  -> nessuna versione precedente disponibile, fornitore omesso`);
      }
    }
  }

  await browser.close();

  const staticFornitori = loadJsonIfExists(SEED_STATIC_PATH) || [];
  const scrapedIds = new Set(scraped.map((f) => f.id));
  const merged = [...scraped, ...staticFornitori.filter((f) => !scrapedIds.has(f.id))];

  merged.sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), "utf8");

  console.log(
    `\nScritto ${OUTPUT_PATH}: ${merged.length} fornitori totali (${scraped.length} da scraping, ${staticFornitori.length} statici).`
  );

  if (failures.length > 0) {
    console.log(`\nFornitori falliti in questa corsa: ${failures.map((f) => f.id).join(", ")}`);
    process.exitCode = 1; // fa comparire il run come "fallito" in Actions, ma i dati non sono persi
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
