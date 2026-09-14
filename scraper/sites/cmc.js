const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "cmc",
  nome: "CMC Commercio Marmi Carrara",
  slug: "cmc-commercio-marmi-carrara",
  url: "https://app.iblocky.it/public-blocks/cmc-commercio-marmi-carrara?type=slab",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
