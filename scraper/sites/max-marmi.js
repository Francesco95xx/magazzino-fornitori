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

  const names = [];
  for (const zona of Object.keys(data.marmi)) {
    for (const item of data.marmi[zona]) {
      if (item.name) names.push(item.name);
    }
  }

  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato nella risposta API");

  return {
    id: "max-marmi",
    nome: "Max Marmi Carrara",
    url: PAGE_URL,
    stato: "scraped",
    note:
      "Elenco letto dall'API pubblica della mappa 2D del magazzino (api/marmi/magazzino), tutte le zone unite — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "max-marmi" };
