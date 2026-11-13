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
// L'endpoint /api/v3/material da' solo nome+codice materiale. Il
// dettaglio lastra (numero blocco, lavorazione, spessore, quantita) è
// su /api/v3/item?itemtype=slab&limit=-1, che restituisce già tutto il
// magazzino in un'unica chiamata, un elemento per gruppo
// materiale/spessore/lavorazione con BlockNumbers/Thicknesses/
// FinishingDescs/Pieces.
//
// Se in futuro questo dovesse smettere di funzionare (token ruotato),
// va ri-estratto aprendo https://marimar.net/it/magazzino con gli
// strumenti di sviluppo del browser aperti sulla scheda Network e
// cercando le chiamate verso marimar.interagisco.it/api/v3/*.

const URL = "https://marimar.net/it/magazzino";
const API_URL = "https://marimar.interagisco.it/api/v3/item?itemtype=slab&limit=-1";

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
  const items = data.Data || [];

  const byName = new Map();
  for (const it of items) {
    const nome = (it.MaterialName || "").trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);

    const spessori = (it.Thicknesses || []).map((s) => Number(String(s).replace(",", "."))).filter((n) => !isNaN(n));
    spessori.forEach((s) => entry.spessori.add(s));

    const finCodes = it.FinishingCodes || [];
    const finDescs = it.FinishingDescs || {};
    const finishings = finCodes.map((c) => finDescs[c]?.it).filter(Boolean);
    finishings.forEach((f) => entry.lavorazioni.add(f));

    const blockNumbers = it.BlockNumbers && it.BlockNumbers.length ? it.BlockNumbers : [null];
    for (const numero of blockNumbers) {
      entry.blocchi.push({
        numero,
        spessore: spessori.length ? spessori.join("/") : "",
        lavorazione: finishings.join(", "),
        quantita: it.Pieces ?? null,
      });
    }
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("API interagisco.it ha risposto senza materiali");

  return {
    id: "marimar",
    nome: "Marimar",
    url: URL,
    stato: "scraped",
    note:
      "Magazzino lastre in tempo reale — dati letti direttamente dall'API del widget (marimar.interagisco.it/api/v3/item), spessore/lavorazione/numero blocco/quantita per blocco.",
    materiali,
  };
}

module.exports = { scrape, id: "marimar" };
