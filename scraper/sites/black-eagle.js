// Black Eagle — passato dallo shop WooCommerce (/stock-online/, catalogo
// statico) all'API iblocky.it (magazzino lastre in tempo reale, stesso
// gestionale già usato da B&B Atelier/Mondial Granit/etc): 171 materiali
// invece di 166, dati aggiornati in tempo reale invece che il catalogo
// prodotti dello shop.
const { scrapeIblocky } = require("./_platforms/iblocky");

const CONFIG = {
  id: "black-eagle",
  nome: "Black Eagle",
  slug: "black-eagle",
  url: "https://app.iblocky.it/public-blocks/black-eagle?type=slab",
};

module.exports = { scrape: () => scrapeIblocky(CONFIG), id: CONFIG.id };
