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

**Cartelle Dropbox (3)**: Bonotti Stock 2cm, Bonotti Stock 3cm, Professional
— modulo condiviso `scraper/sites/_platforms/dropbox.js`. La griglia file
di Dropbox è virtualizzata (`[data-testid="sl-grid-body"] > li`, nome file
nell'`alt` dell'immagine anteprima) e carica altri elementi solo scrollando
i contenitori interni, non la pagina — serve forzare `scrollTop` su ogni
div scrollabile trovato nel DOM, `page.mouse.wheel`/`window.scrollBy` da
soli non bastano. Il nome materiale va estratto dal nome file con regex
euristiche diverse per fornitore (convenzioni di naming diverse anche se
la piattaforma è la stessa): Bonotti usa `nome_b <codice> slabs...`
(minuscolo, sottocarelle `_marble Ncm`/`_offer Ncm` da visitare oltre alla
radice), Professional usa `Nome Materiale CODICE n. <lastre> ...`
(maiuscolo/minuscolo misto, cartella unica). Qualità non perfetta al 100%
(qualche sigla residua attaccata al nome quando il file non segue la
convenzione), accettabile per l'uso previsto.

**Marmi Rossi**: l'utente ha segnalato l'URL giusto del magazzino online
reale (`marmirossi.com/it/magazzino-online/#/list`), diverso da quello
trovato durante il triage originale che portava solo al catalogo PDF — non
era affatto un "caso PDF", semplicemente avevamo l'URL sbagliato. Piattaforma
Angular con scroll infinito grande (~600+ lastre, 235 materiali distinti);
lo scroll va fatto sulla pagina intera (`window.scrollTo` fino in fondo,
ripetuto finché il conteggio si stabilizza), non su un contenitore interno
come per le altre griglie Angular di questo progetto.

**Max Marmi Carrara — sistemato dopo il redesign del sito (2026-09-18)**: la
nuova mappa 2D del magazzino carica i dati da un'API pubblica
(`/api/marmi/magazzino?locale=it`, nessuna auth) che restituisce tutti i
marmi raggruppati per zona (`{ ok, marmi: { A1: [...], A2: [...], ... } }`).
Niente browser necessario, un semplice `fetch()` basta — stesso approccio
di `marimar.js`. Risultato più preciso di prima: 52 materiali specifici
invece delle 16 categorie generiche lette dal vecchio sito.

**Elite Stone / Elite Stone Group (slabware.com)**: risolto l'anti-bot
Cloudflare senza tecniche stealth — Cloudflare blocca specificamente
Chromium **headless**, ma un browser **headed** (finestra reale, non
headless) passa la verifica senza intervento. Modulo condiviso
`scraper/sites/_platforms/slabware.js`: a differenza di tutti gli altri
scraper NON usa il `context` condiviso passato da `run-all.js` (che è
headless), apre un proprio `chromium.launch({ headless: false })` isolato
solo per questa piattaforma. Effetto collaterale: sul runner self-hosted
apre per ~5 secondi una finestra Chromium visibile sullo schermo del PC
durante la corsa. Elite Stone ed Elite Stone Group condividono lo stesso
URL/tenant (`esgroup.slabware.com`) quindi stessi 238 materiali per
entrambi — non è un errore, i due nomi commerciali condividono un unico
magazzino fisico.

**GR Marmi — automatizzato con login reale**: primo (e finora unico)
fornitore di questo progetto con vere credenziali cliente. Ca'D'Oro ha un
account sul Magazzino Online (`/magazzino/`); lo scraper fa login
automatico (form WordPress "User Registration": `#username`, `#password`,
`button[name="login"]`) usando `GRMARMI_EMAIL`/`GRMARMI_PASSWORD` da
variabili d'ambiente (mai hardcoded, vedi sezione secret sotto), poi legge
il filtro "MATERIALE" (`select#product_cat`, 215 materiali — molto meglio
dei 51 della pagina pubblica "I Materiali" usata come tentativo
precedente, ora sostituita).

**Margraf — automatizzato con login reale**: secondo fornitore con vere
credenziali cliente. Login `#email`/`#password`, bottone "Invia" (nessun
id/name, si clicca per testo); un banner cookie Cybot va rimosso prima o
blocca i click. Dopo il login, "Tutti i prodotti" mostra le card materiale
(`h2.font-bold`, stesso selettore usato anche dal carosello "Margraf
Selection" in cima — dedup unifica i doppi), scroll fino a stabilizzazione:
51 materiali.

**Orlandini Gallery**: il vero magazzino (`lager.orlandini.de`, piattaforma
DDL) resta dietro login, ma il sito principale ha un Katalog pubblico
(`orlandini.de/store`, Webflow CMS) — non tutti i materiali disponibili per
loro stessa ammissione, ma 254 nomi comunque utili. Paginazione ad
accumulo particolare: ogni click su "Next Page" (`a[aria-label="Next
Page"]`) **aggiunge** altri 24 elementi alla lista già nel DOM invece di
sostituirla (l'URL nella pagina non cambia, è tutto via JS) — diverso da
qualunque altro scroll/paginazione visto finora in questo progetto.

**Margraf — nota sul debug del login (2026-09)**: dopo l'aggiunta dei
secret, la corsa CI continuava a fallire con "Nessun materiale trovato
dopo il login". Diagnosticato passo passo con l'utente: non era un bug
dello scraper né delle credenziali (confermate corrette, spazio finale
incluso, verificate con login manuale su un altro dispositivo) — il sito
Margraf aveva un disservizio lato loro (login funzionante ma nessuna
immagine/materiale caricato per nessuno). Nel frattempo lo scraper è stato
comunque reso più robusto: passato a un browser headed indipendente (stesso
motivo di Elite Stone) perché la modalità headless dava lo stesso sintomo
("login riuscito" ma pagina vuota) anche a sito funzionante. Non c'è altro
da fare lato codice: va solo verificato che la corsa vada a buon fine ora
che il sito Margraf è tornato operativo.

**NaturalStone**: trovato un URL pubblico diverso da quello originale
(`naturalstones.isodata.it`, che richiede login) — `naturalstones.marbler3.it`
è la stessa piattaforma MarbleR3 ma **accessibile senza credenziali** su
questo dominio. Il catalogo mostra 24 lastre per pagina di default; lo
scraper clicca sul selettore dimensione pagina "48" per averne di più in un
colpo solo (27 materiali distinti).

**71 su 74 totali automatizzati** (GR Marmi era già conteggiato prima
tramite la pagina pubblica: passare al login reale migliora la qualità dei
dati ma non cambia il totale; lo stesso vale per Margraf una volta che il
sito torna a funzionare). Gli altri 3 restano fissi in
`scraper/seed-static.json`, classificati così dal triage (2026-09):
- **Login reale richiesto, credenziali non disponibili** (2): GeoMarmi,
  Red Graniti (`redgraniti.isodata.it`, piattaforma MarbleR2 — a differenza
  di NaturalStone/MarbleR3 non è stato trovato un dominio pubblico
  equivalente; da riprovare se si trova un URL alternativo come per
  NaturalStone).
- **Login reale richiesto, ma non ha senso automatizzarlo** (1): Lasa Marmo
  — non è un rivenditore con un ampio catalogo come Orlandini/NaturalStone,
  è l'azienda della cava stessa: vende sostanzialmente un solo marmo in 3
  varianti (LASA Bianco, LASA Venato, LASA !ndividual). Non esiste un
  catalogo pubblico più ampio da recuperare, il dato utile (disponibilità
  blocchi/lastre) resta dietro login vero senza alternativa ragionevole.
- **Errore persistente lato sito** (2): Marmoelite (HTTP 500 ripetuto anche
  a distanza di giorni), Marmi di Carrara (connessione rifiutata/reset
  ripetuto) — non un blocco per IP, probabile problema del sito stesso.

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

- `GRMARMI_EMAIL` / `GRMARMI_PASSWORD` — credenziali reali dell'account
  cliente Ca'D'Oro sul Magazzino Online di GR Marmi, usate da
  `scraper/sites/gr-marmi.js` per fare login automatico (form WordPress,
  `#username`/`#password`) prima di leggere il filtro materiali
  (`select#product_cat`). **Queste sì sono credenziali vere** — a differenza
  del token Marimar, non condividerle/incollarle mai in chat o nel codice.
  Vanno impostate solo in:
  - **GitHub Actions**: Settings del repo → Secrets and variables →
    Actions → New repository secret → nomi `GRMARMI_EMAIL` e
    `GRMARMI_PASSWORD`.
  - **Locale**: `$env:GRMARMI_EMAIL = "..."` e `$env:GRMARMI_PASSWORD = "..."`
    prima di lanciare `node run-all.js` (PowerShell), altrimenti quello
    scraper fallisce con un errore esplicito e usa l'ultima versione buona.

  Se la password viene cambiata, va aggiornato solo il secret
  `GRMARMI_PASSWORD` su GitHub (e l'env locale se serve ritestare) — non è
  scritta da nessuna parte nel codice sorgente.

- `MARGRAF_EMAIL` / `MARGRAF_PASSWORD` — stesso schema di
  `GRMARMI_EMAIL`/`GRMARMI_PASSWORD`, credenziali reali dell'account
  cliente Ca'D'Oro sul Magazzino Online di Margraf, usate da
  `scraper/sites/margraf.js` (login `#email`/`#password`, bottone "Invia").
  Stessi due posti dove impostarle: **GitHub Actions** (Secrets and
  variables → Actions → New repository secret) e **locale**
  (`$env:MARGRAF_EMAIL = "..."` / `$env:MARGRAF_PASSWORD = "..."` prima di
  `node run-all.js`).

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
