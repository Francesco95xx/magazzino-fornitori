const { scrapeMaterialFilter } = require("./_platforms/slabware");

const CONFIG = {
  id: "elite-stone",
  nome: "Elite Stone",
  url: "https://esgroup.slabware.com/",
};

module.exports = { scrape: () => scrapeMaterialFilter(CONFIG), id: CONFIG.id };
