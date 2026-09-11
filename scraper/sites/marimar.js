// Marimar — inizialmente scrapato via browser (scroll reale sul widget
// Angular "magazzino-online"), ma quello screaping falliva in modo
// sistematico su GitHub Actions: il widget carica i dati chiamando
// un'API su un dominio terzo (marimar.interagisco.it) via XMLHttpRequest,
// e in ambiente headless CI quella richiesta va in errore CORS legato al
// Storage Access API di Chrome (cookie/permessi di terze parti negati) —
// non un blocco anti-bot, ma una policy del browser stesso.
//
// La stessa richiesta XHR ha rivelato l'endpoint reale dietro il widget:
// un Bearer token JWT statico, incorporato in chiaro nel bundle JS
// pubblico del sito (scade nel 2042, scope "magazzino":"all" — non è un
// segreto per-sessione, è la chiave pubblica del widget stesso).
// Chiamando quell'API direttamente via HTTP (nessun browser coinvolto)
// il problema CORS/Storage-Access non si pone nemmeno: CORS è una
// restrizione lato browser, non si applica a richieste server-to-server.
//
// Se in futuro questo dovesse smettere di funzionare (token ruotato),
// va ri-estratto aprendo https://marimar.net/it/magazzino con gli
// strumenti di sviluppo del browser aperti sulla scheda Network e
// cercando le chiamate verso marimar.interagisco.it/api/v3/*.

const URL = "https://marimar.net/it/magazzino";
const API_URL = "https://marimar.interagisco.it/api/v3/material?limit=-1&itemtype=slab";

async function scrape() {
  const BEARER_TOKEN = process.env.MARIMAR_API_TOKEN;
  if (!BEARER_TOKEN) {
    throw new Error(
      "Variabile d'ambiente MARIMAR_API_TOKEN mancante (vedi README per come ottenerla e dove impostarla)"
    );
  }

  const resp = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      Referer: "https://marimar.net/",
      Accept: "application/json",
    },
  });
  if (!resp.ok) throw new Error(`API interagisco.it: HTTP ${resp.status}`);

  const data = await resp.json();
  const names = (data.Data || []).map((m) => m.MaterialDesc).filter(Boolean);
  const unique = [...new Set(names)].sort();
  if (unique.length === 0) throw new Error("API interagisco.it ha risposto senza materiali");

  return {
    id: "marimar",
    nome: "Marimar",
    url: URL,
    stato: "scraped",
    note:
      "Magazzino lastre in tempo reale — dati letti direttamente dall'API del widget (marimar.interagisco.it/api/v3/material), non dalla pagina web.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "marimar" };
