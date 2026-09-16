// La Ponte — il nome materiale è nell'alt delle immagini lastra, nel
// formato "<CATEGORIA> <MATERIALE> <codice blocco> <finitura> <numero>"
// (es. "MARMO ARABESCATO CORCHIA A2780 LU 02"); ripuliamo prefisso e suffisso.
const URL = "https://www.laponte.it/magazzino";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const alts = await page.evaluate(() =>
    [...document.querySelectorAll("img[alt]")].map((i) => i.alt).filter((a) => a && a.trim())
  );
  await page.close();

  const cleaned = alts
    .map((t) =>
      t
        .replace(/^(marmo|granito|quarzite|travertino|onice|agglomerato|pietra)\s+/i, "")
        .replace(/\s+\S*\d\S*\s+[a-z]{2}\s+\d{1,3}$/i, "")
        .trim()
    )
    .filter(Boolean);

  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, "it"));
  if (unique.length === 0) throw new Error("Nessun materiale trovato su laponte.it/magazzino");

  return {
    id: "la-ponte",
    nome: "La Ponte",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dall\'attributo alt delle immagini lastra, ripulendo prefisso categoria e suffisso codice/finitura — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "la-ponte" };
