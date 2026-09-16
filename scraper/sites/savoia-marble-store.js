// Savoia Marble Store — il filtro laterale "MATERIALI" ha una checkbox per
// ogni materiale distinto, value="<id>|<NOME>" — evita di paginare le 43
// pagine di risultati.
const URL = "https://savoiamarmi.store/ITA.html";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const values = await page.evaluate(() =>
    [...document.querySelectorAll('input[type="checkbox"]')]
      .map((c) => c.value)
      .filter((v) => v.includes("|"))
  );
  await page.close();

  const names = values.map((v) => v.split("|").slice(1).join("|").trim()).filter(Boolean);
  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro MATERIALI");

  return {
    id: "savoia-marble-store",
    nome: "Savoia Marble Store",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dal filtro laterale "MATERIALI" (checkbox per ogni materiale distinto a catalogo) — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "savoia-marble-store" };
