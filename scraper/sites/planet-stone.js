const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "planet-stone",
  nome: "Planet Stone",
  slug: "planetstone",
  url: "https://app.iblocky.it/public-blocks/planetstone?type=slab",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
