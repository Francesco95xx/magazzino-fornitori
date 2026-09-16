// Girasole Pietre — 4 pagine categoria (marmo/travertino/onice/quarzite),
// ognuna con scroll infinito che si stabilizza intorno a 200 lastre per
// pagina (limite lato sito, non risolvibile con altro scroll).
const CATEGORIES = [
  "https://girasolepietre.it/marmo",
  "https://girasolepietre.it/travertino",
  "https://girasolepietre.it/onice",
  "https://girasolepietre.it/quarzite",
];
const SELECTOR = "h3.slab-preview__upper__content__title";

async function scrapeCategory(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

  let prevCount = -1;
  for (let i = 0; i < 15; i++) {
    const count = await page.locator(SELECTOR).count();
    if (count === prevCount) break;
    prevCount = count;
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(700);
  }

  const names = await page.locator(SELECTOR).allTextContents();
  await page.close();
  return names.map((n) => n.trim()).filter(Boolean);
}

async function scrape(context) {
  let all = [];
  for (const url of CATEGORIES) {
    const names = await scrapeCategory(context, url);
    all = all.concat(names);
  }

  const unique = [...new Set(all)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su girasolepietre.it");

  return {
    id: "girasole-pietre",
    nome: "Girasole Pietre",
    url: "https://girasolepietre.it/magazzino-online",
    stato: "scraped",
    note:
      "Elenco letto dalle 4 pagine categoria (marmo/travertino/onice/quarzite) con scroll fino a stabilizzazione del DOM — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "girasole-pietre" };
