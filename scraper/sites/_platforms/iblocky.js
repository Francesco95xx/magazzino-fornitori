// Piattaforma "iblocky.it" (app.iblocky.it/public-blocks/<slug>) — condivisa
// da più fornitori. Endpoint pubblici, basta impostare Referer/Origin/
// User-Agent come farebbe un vero browser (senza questi header rispondono
// 403, non serve invece nessun token/login).
//
// Non usiamo più solo /filters/materials (nomi distinti, senza dettagli):
// /commesse/all (POST, paginato) restituisce il vero elenco blocchi/lastre
// con spessore, lavorazione (finitura), quantità disponibile e codice
// blocco per ciascuno — lo stesso che la UI mostra come card. Aggreghiamo
// per nome materiale.
const API_BASE = "https://api.iblocky.it/api/v2/tenants";
const HEADERS = {
  Referer: "https://app.iblocky.it/",
  Origin: "https://app.iblocky.it",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Content-Type": "application/json",
};
const PAGE_LIMIT = 2000;

async function fetchAllCommesse(slug) {
  const all = [];
  let page = 1;
  for (let i = 0; i < 20; i++) {
    const resp = await fetch(`${API_BASE}/${slug}/commesse/all?page=${page}&limit=${PAGE_LIMIT}`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        companyIds: [],
        materialIds: [],
        finishIds: [],
        petrograficDescriptionIds: [],
        thicknesses: [],
        colorIds: [],
        commessaType: "slab",
        showAllPhotos: true,
        orderDirection: "newest",
      }),
    });
    if (!resp.ok) throw new Error(`iblocky.it (${slug}): HTTP ${resp.status}`);
    const data = await resp.json();
    all.push(...(data.commesse || []));
    if (!data.pagination || !data.pagination.hasNext) break;
    page += 1;
  }
  return all;
}

function aggregateByMaterial(commesse) {
  const byName = new Map();
  for (const c of commesse) {
    const nome = c.material && c.material.trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { spessori: new Set(), lavorazioni: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    const stats = c.stats || {};
    (stats.thickness || []).forEach((t) => entry.spessori.add(t));
    (stats.finishesTranslations || []).forEach((f) => entry.lavorazioni.add(f.it || f.en));
    entry.blocchi.push({
      numero: c.code || null,
      spessore: (stats.thickness || []).join("/"),
      lavorazione: (stats.finishesTranslations || []).map((f) => f.it || f.en).join(", "),
      quantita: typeof stats.availableSlabs === "number" ? stats.availableSlabs : null,
    });
  }
  return byName;
}

async function scrapeIblocky({ id, nome, slug, url, note }) {
  const commesse = await fetchAllCommesse(slug);
  if (commesse.length === 0) throw new Error(`iblocky.it (${slug}): nessun blocco trovato`);

  const byName = aggregateByMaterial(commesse);
  const materiali = [...byName.entries()]
    .map(([n, info]) => ({
      nome: n,
      alias: [],
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [...info.lavorazioni].sort(),
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error(`iblocky.it (${slug}): nessun materiale trovato`);

  return {
    id,
    nome,
    url,
    stato: "scraped",
    note:
      note ||
      "Magazzino lastre in tempo reale — dati letti dall'API blocchi (commesse/all) del gestionale iblocky.it, con spessore/lavorazione/numero blocco per pezzo.",
    materiali,
  };
}

module.exports = { scrapeIblocky };
