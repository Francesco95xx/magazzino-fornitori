const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "gima-stone",
  nome: "Gi-Ma Stone",
  slug: "gima-stone-srl",
  url: "https://app.iblocky.it/public-blocks/gima-stone-srl?type=slab",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
