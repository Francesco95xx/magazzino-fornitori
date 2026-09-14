const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "italian-stone-source",
  nome: "Italian Stone Source",
  slug: "italian-stone-source",
  url: "https://app.iblocky.it/public-blocks/italian-stone-source",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
