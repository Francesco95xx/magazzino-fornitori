const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "marmi-rosa",
  nome: "Marmi Rosa",
  slug: "marmi-rosa-srl",
  url: "https://app.iblocky.it/public-blocks/marmi-rosa-srl",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
