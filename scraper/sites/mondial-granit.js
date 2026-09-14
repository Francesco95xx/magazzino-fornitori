const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "mondial-granit",
  nome: "Mondial Granit",
  slug: "mondial-granit",
  url: "https://app.iblocky.it/public-blocks/mondial-granit",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
