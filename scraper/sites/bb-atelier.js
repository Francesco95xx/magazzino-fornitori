const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "bb-atelier",
  nome: "B&B Atelier",
  slug: "bassi-bellotti-spa",
  url: "https://app.iblocky.it/public-blocks/bassi-bellotti-spa?type=slab",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
