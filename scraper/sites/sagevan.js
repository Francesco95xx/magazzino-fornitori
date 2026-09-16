// Sa.Ge.Van. Marmi Store — il filtro laterale "MATERIALI" elenca ogni
// materiale con conteggio blocchi tra parentesi (es. "Bianco Carrara (25)");
// estraiamo i nomi dal testo tra le sezioni MATERIALI e MISURE.
const URL = "https://store.sagevanmarmi.com/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);

  const text = await page.evaluate(() => document.body.innerText);
  await page.close();

  const start = text.indexOf("MATERIALI");
  const end = text.indexOf("MISURE");
  const chunk = start >= 0 && end > start ? text.slice(start, end) : "";
  const names = chunk
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /\(\d+\)$/.test(l))
    .map((l) => l.replace(/\s*\(\d+\)$/, "").trim());

  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro MATERIALI di sagevanmarmi");

  return {
    id: "sagevan",
    nome: "Sa.Ge.Van. Marmi Store",
    url: URL,
    stato: "scraped",
    note: 'Elenco letto dal filtro laterale "MATERIALI" (con conteggio blocchi) — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "sagevan" };
