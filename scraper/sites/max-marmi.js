// Max Marmi Carrara — il sito è stato rifatto (2026-09) come mappa 2D
// interattiva del magazzino; il vecchio scraper basato sui link categoria
// (a.oxy-read-more) non trova più nulla. La nuova pagina chiama un'API
// pubblica che restituisce tutti i marmi raggruppati per zona del
// magazzino: niente browser necessario, un semplice fetch basta (come
// marimar.js).
const API_URL = "https://www.maxmarmicarrara.com/api/marmi/magazzino?locale=it";
const PAGE_URL = "https://www.maxmarmicarrara.com/magazzino";

async function scrape() {
  const res = await fetch(API_URL, {
    headers: { Accept: "application/json", Referer: PAGE_URL },
  });
  if (!res.ok) throw new Error(`API magazzino ha risposto ${res.status}`);

  const data = await res.json();
  if (!data || !data.ok || !data.marmi) throw new Error("Risposta API inattesa (manca 'marmi')");

  const byName = new Map();
  for (const zona of Object.keys(data.marmi)) {
    for (const item of data.marmi[zona]) {
      if (!item.name) continue;
      if (!byName.has(item.name)) byName.set(item.name, { spessori: new Set(), lavorazioni: new Set(), blocchi: [], href: null });
      const entry = byName.get(item.name);
      if (!entry.href && item.slug) entry.href = `https://www.maxmarmicarrara.com/marmi/${item.slug}`;

      const acf = item.acf || {};
      const dim = acf.marmo_dettagli_dimensions || {};
      const spessore = dim.spessore ? Number(dim.spessore) : null;
      const lavorazione = acf.marmo_dettagli_finitura || null;
      if (spessore) entry.spessori.add(spessore);
      if (lavorazione) entry.lavorazioni.add(lavorazione);
      entry.blocchi.push({
        numero: acf.marmo_dettagli_codice || null,
        spessore: spessore != null ? String(spessore) : null,
        lavorazione: lavorazione || "",
        quantita: acf.marmo_dettagli_quantita_lastre ? Number(acf.marmo_dettagli_quantita_lastre) : null,
      });
    }
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href || undefined,
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato nella risposta API");

  return {
    id: "max-marmi",
    nome: "Max Marmi Carrara",
    url: PAGE_URL,
    stato: "scraped",
    note:
      "Elenco letto dall'API pubblica della mappa 2D del magazzino (api/marmi/magazzino), tutte le zone unite, con link diretto alla scheda materiale (/marmi/<slug>) e spessore/lavorazione/quantità per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "max-marmi" };
