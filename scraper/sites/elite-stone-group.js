// Nota: stesso URL/tenant di elite-stone.js (Elite Stone ed Elite Stone
// Group condividono lo stesso magazzino su slabware.com) — dati identici
// per design, non un errore di configurazione.
const { scrapeMaterialFilter } = require("./_platforms/slabware");

const CONFIG = {
  id: "elite-stone-group",
  nome: "Elite Stone Group",
  url: "https://esgroup.slabware.com/",
};

module.exports = { scrape: () => scrapeMaterialFilter(CONFIG), id: CONFIG.id };
