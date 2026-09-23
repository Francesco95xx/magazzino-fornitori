// Marmi di Carrara — pagina ASP server-rendered (nessun JS/scroll
// necessario), un semplice fetch() basta: niente browser, più veloce e
// stabile in CI. Il nome materiale è nel primo <strong> di ogni voce
// dentro #portfolioitems (l'unico falso positivo è il conteggio "Numero
// materiali: N", anch'esso in <strong>, escluso filtrando le stringhe
// numeriche).
//
// In precedenza il sito rispondeva con connessione rifiutata/reset
// ripetuto (probabile disservizio lato loro, non un blocco per IP/bot) e
// veniva coperta solo la categoria Marmo. Ora tutte e 5 le categorie del
// menu MAGAZZINO rispondono 200: le uniamo in un unico elenco deduplicato.
const CATEGORIE = ["Marmo", "Granito", "Travertino", "Onice", "Quarzite"];

async function scrape() {
  const tutti = new Set();

  for (const categoria of CATEGORIE) {
    const url = `http://www.marmidicarrara.com/magazzino.asp?mat=${categoria}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} per categoria ${categoria}`);
    const html = await res.text();

    const matches = [...html.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1].trim());
    for (const nome of matches) {
      if (nome && !/^\d+$/.test(nome)) tutti.add(nome);
    }
  }

  const unique = [...tutti].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su marmidicarrara.com (tutte le categorie)");

  return {
    id: "marmi-di-carrara",
    nome: "Marmi di Carrara",
    url: "http://www.marmidicarrara.com/magazzino.asp?mat=Marmo",
    stato: "scraped",
    note:
      "Elenco letto via fetch diretto (pagina server-rendered, nessun browser necessario) unendo tutte e 5 le categorie del menu MAGAZZINO (Marmo, Granito, Travertino, Onice, Quarzite) — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marmi-di-carrara" };
