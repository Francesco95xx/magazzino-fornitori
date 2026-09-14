// Piattaforma "iblocky.it" (app.iblocky.it/public-blocks/<slug>) — condivisa
// da più fornitori. L'endpoint filtri materiali è pubblico, basta impostare
// Referer/Origin/User-Agent come farebbe un vero browser (senza questi
// header risponde 403, non serve invece nessun token/login).

const API_BASE = "https://api.iblocky.it/api/v2/tenants";
const HEADERS = {
  Referer: "https://app.iblocky.it/",
  Origin: "https://app.iblocky.it",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function scrapeIblocky({ id, nome, slug, url, note }) {
  const apiUrl = `${API_BASE}/${slug}/filters/materials?commessaType=slab`;
  const resp = await fetch(apiUrl, { headers: HEADERS });
  if (!resp.ok) throw new Error(`iblocky.it (${slug}): HTTP ${resp.status}`);

  const data = await resp.json();
  const names = (data.values || []).map((v) => v.name).filter(Boolean);
  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error(`iblocky.it (${slug}): nessun materiale trovato`);

  return {
    id,
    nome,
    url,
    stato: "scraped",
    note: note || "Magazzino lastre in tempo reale — dati letti dall'API filtri materiali del gestionale iblocky.it.",
    materiali: unique.map((n) => ({ nome: n, alias: [] })),
  };
}

module.exports = { scrapeIblocky };
