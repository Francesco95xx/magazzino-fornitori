// GMI — pagina Materiali con accordion per categoria (Marmo/Granito/
// Onice/Travertino/Slate/Quarzite/Pietra); ogni materiale è un link
// javascript:show_line_view(id, 'NOME') già presente nel DOM per tutte le
// categorie, non serve espandere l'accordion cliccando.
const URL = "https://www.gmimarbles.com/magazzino-online/materiali/it";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const names = await page.locator('a[href^="javascript:show_line_view"]').allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su gmimarbles.com/magazzino-online/materiali");

  return {
    id: "gmi",
    nome: "GMI",
    url: URL,
    stato: "scraped",
    note: "Elenco letto dai link materiale dell'accordion Marmo/Granito/Onice/Travertino/Slate/Quarzite/Pietra — scraping automatico notturno.",
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "gmi" };
