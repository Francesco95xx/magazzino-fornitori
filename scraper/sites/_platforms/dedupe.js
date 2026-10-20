// Helper condiviso: da una lista di {nome, href} (href opzionale) produce
// l'array ordinato e deduplicato nel formato atteso da data/fornitori.json
// (materiali: [{nome, alias, url?}]), tenendo il primo href incontrato per
// ciascun nome. Usato dagli scraper di categoria A/B (link diretto al
// materiale gia' disponibile nel DOM o nei metadati letti).
function dedupeWithUrl(entries) {
  const byName = new Map();
  for (const { nome, href } of entries) {
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, href || null);
  }
  return [...byName.keys()]
    .sort((a, b) => a.localeCompare(b, "it"))
    .map((nome) => {
      const href = byName.get(nome);
      return href ? { nome, alias: [], url: href } : { nome, alias: [] };
    });
}

module.exports = { dedupeWithUrl };
