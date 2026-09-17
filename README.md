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

**Scraper individuali (4)**: `orobici` (Marmi Orobici), `marimar`, `moristone`
(Mori Stone), `stocchero-attilio`.

**Piattaforma condivisa iblocky.it (7)**: `bb-atelier`, `mondial-granit`,
`marmi-rosa`, `italian-stone-source`, `stone-export`, `planet-stone`, `cmc`
— un solo modulo (`scraper/sites/_platforms/iblocky.js`) chiama l'API
pubblica `api.iblocky.it/api/v2/tenants/<slug>/filters/materials` (basta
Referer/Origin/User-Agent da browser, nessun token/login), i file in
`scraper/sites/` sono solo un wrapper con lo slug del tenant.

**Fase 2 — triage completo dei 63 fornitori statici rimanenti (40)**:
Girasole Pietre, Granitifavorita, Bagnara, Vanti Franco, Dalle Nogare,
L.M.G. di Botton, Marmolesman, Marmi Bocchese, Marble Point, Marcolini,
Savoia Marble Store, Black Eagle, Solfagroup, A&G 23, Stonest, R.A. Marmi,
Bacci, Mondial Marmi, La Ponte, V. Fontanili Carrara (unificato con il
duplicato `nicola-fontanili`), Max Marmi, Bruno Lucchetti, Bufalini,
Granitex, Vitoria Stone, Errebi Marmi, Giza Stone, Alberti & Alberti,
Zagross, Franchi Umberto Marmi, Marmi Corradini, MGS, Sa.Ge.Van, Marmi
Colombare, Marmi 3Esse, Onymar, Royal Marmi Carrara, Dansk Marble, Ferrari
Marmi. Pattern usati (ogni sito è diverso, vedi i singoli file per i
dettagli): filtro `<select>`/checkbox con l'elenco materiali (il più
affidabile: prende tutto il catalogo in un colpo, non solo la pagina
corrente), scroll infinito fino a stabilizzazione, paginazione via URL
(`?page=N`, `/page/N/`), estrazione via regex dal testo quando il DOM non
ha un selettore stabile.

**Fase 2b — investigati col browser vero invece del semplice fetch (5)**:
AATC e Veneta Marmi condividono la stessa piattaforma (filtro
`select#ew_materiale name="desc_materiale"`, naming identico su entrambi i
siti pur essendo fornitori diversi); Marmi Meya usa lo stesso pattern
Angular autocomplete di Marimar/Stocchero Attilio (`#searchSingleEl` +
`mat-option`); Galvani Trading ha paginazione a bottoni JS (stato, non
href) da cliccare; Stocchero Marcello è una griglia Angular a scroll
infinito raggruppata per materiale (`.mat-header-row .p-name`) — qui il
catalogo visibile è piccolo (8 materiali), non è un problema dello scraper.

**Il Fiorino Marmi**: store statico senza paginazione, nome lastra in
`div.box-lastra h2`. Nota tecnica: `page.goto` con `waitUntil: "networkidle"`
va in timeout su questo sito (richieste in background persistenti) — usa
`"load"` invece, come per Franchi Umberto Marmi.

**Venturini Marmi**: pagina Wix statica e piccola (8 materiali, sezione
"Marmi di Cava"); filtrati titolo/paragrafo finanziamento/contatti dal testo
della pagina invece di puntare a un id di componente Wix (fragile, cambia
se il sito viene ripubblicato).

**GMI**: alla seconda investigazione (con un `networkidle` più lungo) la
pagina "materiali" mostra 110 link `javascript:show_line_view(id, 'NOME')`
già tutti presenti nel DOM per ogni categoria (Marmo/Granito/Onice/
Travertino/Slate/Quarzite/Pietra), senza bisogno di espandere l'accordion
né di fare login — la prima indagine era stata troppo frettolosa.

**59 su 74 totali automatizzati.** Gli altri 15 restano fissi in
`scraper/seed-static.json`, classificati così dal triage (2026-09):
- **Login reale richiesto** (6): GR Marmi, GeoMarmi, Margraf (form
  email/password vero, non un semplice popup), `isodata.it` (Red Graniti,
  NaturalStone — due prodotti diversi, MarbleR2/MarbleR3, 401 anche dal
  browser), piattaforma "DDL" con parametro `g_1_limit` (Lasa Marmo,
  Orlandini — pagina "ACCESSO", zero dati senza credenziali).
- **Anti-bot Cloudflare** (2): `slabware.com` (Elite Stone, Elite Stone
  Group) — filtro materiali pubblico ma pagina "Just a moment..." blocca
  Playwright headless. Bypassabile in teoria con tecniche stealth
  aggiuntive, non tentato per ora.
- **Cartelle Dropbox** (3): Bonotti (Stock 2cm), Bonotti (Stock 3cm),
  Professional — l'elenco viene dai nomi file nelle sottocartelle, servirebbe
  un approccio dedicato (API Dropbox o parsing della pagina di condivisione),
  bassa priorità.
- **Errore persistente lato sito** (2): Marmoelite (HTTP 500 ripetuto anche
  a distanza di giorni), Marmi di Carrara (connessione rifiutata/reset
  ripetuto) — non un blocco per IP, probabile problema del sito stesso.
- **Caso speciale** (1): Marmi Rossi — catalogo in PDF, non HTML.

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
