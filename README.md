# Magazzino Fornitori — Ca' D'Oro

Versione auto-aggiornante di "Ricerca Materiali": cerca un materiale e vedi
quali fornitori lo hanno nel loro magazzino online, senza scaricare o
rispedire file — tutti aprono lo stesso link, sempre aggiornato.

## Come funziona

- `index.html` è la pagina che si apre nel browser. Carica i dati da
  `data/fornitori.json` con un `fetch()` all'avvio (invece di averli
  incollati nel codice, come nella versione precedente).
- `data/fornitori.json` viene rigenerato ogni notte da
  `.github/workflows/scrape.yml`, che fa girare gli script in
  `scraper/sites/` e li unisce ai fornitori "statici" non ancora
  automatizzati (`scraper/seed-static.json`).
- Se uno scraper fallisce in una corsa, il fornitore **non sparisce**:
  `scraper/run-all.js` tiene l'ultima versione buona di quel fornitore
  invece di azzerarlo.
- Le personalizzazioni fatte da un singolo utente (bottone "+ Aggiungi
  fornitore", modifica materiali di un fornitore) restano salvate nel
  `localStorage` del suo browser, esattamente come nella versione originale
  — non vengono toccate da questo meccanismo.

## Fornitori automatizzati oggi

`orobici` (Marmi Orobici), `marimar`, `moristone` (Mori Stone),
`stocchero-attilio` — 4 su 74. Gli altri 70 restano fissi in
`scraper/seed-static.json` finché non gli si scrive uno scraper dedicato.

## Aggiungere un nuovo fornitore automatizzato

1. Crea `scraper/sites/<id-fornitore>.js` che esporta:
   ```js
   module.exports = {
     id: "id-fornitore", // deve combaciare con l'id in seed-static.json
     scrape: async (context) => {
       const page = await context.newPage();
       // ... naviga, estrai i nomi materiale ...
       return {
         id: "id-fornitore",
         nome: "Nome Fornitore",
         url: "https://...",
         stato: "scraped",
         note: "...",
         materiali: [{ nome: "...", alias: [] }, ...],
       };
     },
   };
   ```
2. Rimuovi quel fornitore da `scraper/seed-static.json` (altrimenti resta
   duplicato/ignorato: `run-all.js` dà priorità ai dati scrapati).
3. Testa in locale: `cd scraper && npm ci && npx playwright install
   chromium && node run-all.js`, controlla `data/fornitori.json`.
4. Push su `main`: la prossima corsa notturna (o un run manuale da
   Actions → "Aggiorna magazzino fornitori" → Run workflow) lo includerà.

Ogni sito ha una struttura diversa (paginazione classica, scroll infinito,
autocomplete che carica tutto...) — non esiste un pattern unico, va
ispezionato caso per caso (DevTools / `page.evaluate` per trovare il
selettore giusto). A volte il modo più affidabile **non è** guidare un
browser: se il widget del sito chiama in AJAX un'API propria (tab Network
degli strumenti sviluppatore), spesso conviene chiamare quell'API
direttamente via `fetch()` in Node — niente browser, niente timing/scroll
da gestire, molto più veloce e stabile in CI. È il caso di `marimar.js`:
vedi sotto per come gestisce il token di quell'API.

## Variabili d'ambiente / secret richiesti

- `MARIMAR_API_TOKEN` — Bearer token usato da `scraper/sites/marimar.js`
  per chiamare `marimar.interagisco.it/api/v3/material` direttamente
  (bypassa lo scraping via browser, che falliva su GitHub Actions per un
  problema di CORS/Storage-Access in ambiente headless — vedi commento in
  cima al file). **Non è un segreto per-utente**: è lo stesso token che il
  sito di Marimar spedisce in chiaro nel proprio bundle JS pubblico a
  chiunque visiti `marimar.net/it/magazzino` — va tenuto come secret solo
  per non lasciare stringhe che sembrano credenziali nel codice sorgente
  pubblico. Va impostato in due posti:
  - **GitHub Actions**: Settings del repo → Secrets and variables →
    Actions → New repository secret → nome `MARIMAR_API_TOKEN`.
  - **Locale**: `$env:MARIMAR_API_TOKEN = "..."` prima di lanciare
    `node run-all.js` (PowerShell), altrimenti quello scraper fallisce con
    un errore esplicito (non silenzioso).

  Se smette di funzionare (token ruotato dal sito), va ri-estratto aprendo
  `https://marimar.net/it/magazzino` con gli strumenti sviluppatore sulla
  scheda Network, cercando l'header `Authorization: Bearer ...` in una
  qualunque richiesta verso `marimar.interagisco.it`.

## Setup iniziale (una tantum, già fatto se stai leggendo questo su GitHub)

1. Repo privato su GitHub, push di questo progetto sul branch `main`.
2. Settings → Pages → Source → "Deploy from a branch" → `main` → `/ (root)`.
3. (Facoltativo) Actions → "Aggiorna magazzino fornitori" → Run workflow,
   per popolare subito `data/fornitori.json` invece di aspettare la notte.

## Sviluppo locale

```powershell
cd scraper
npm ci
npx playwright install chromium
node run-all.js          # rigenera ../data/fornitori.json
cd ..
python -m http.server 8731   # o qualunque server statico
# apri http://localhost:8731/index.html
```
