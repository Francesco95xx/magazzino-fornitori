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
selettore giusto).

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
