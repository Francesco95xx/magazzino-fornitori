const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "stone-export",
  nome: "Stone Export",
  slug: "stone-export",
  url: "https://app.iblocky.it/public-blocks/stone-export?type=slab",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
