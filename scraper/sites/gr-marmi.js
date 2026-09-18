// GR Marmi — il "Magazzino Online" vero e proprio richiede un account
// cliente (login email/password). La pagina "I Materiali"
// (materiali-marmi-carrara/) è pubblica e elenca il catalogo materiali
// dell'azienda: nome in figcaption.vc_figure-caption.
const URL = "https://www.grmarmi.it/materiali-marmi-carrara/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator("figcaption.vc_figure-caption").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su grmarmi.it/materiali-marmi-carrara");

  return {
    id: "gr-marmi",
    nome: "GR Marmi",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dalla pagina pubblica "I Materiali" (il Magazzino Online vero richiede un account cliente, non ancora automatizzato) — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "gr-marmi" };
