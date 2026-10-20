// La Ponte — il nome materiale è nell'alt delle immagini lastra, nel
// formato "<CATEGORIA> <MATERIALE> <codice blocco> <finitura> <numero>"
// (es. "MARMO ARABESCATO CORCHIA A2780 LU 02"); ripuliamo prefisso e suffisso.
const { dedupeWithUrl } = require("./_platforms/dedupe");

const URL = "https://www.laponte.it/magazzino";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.evaluate(() =>
    [...document.querySelectorAll("img[alt]")]
      .filter((img) => img.alt && img.alt.trim())
      .map((img) => {
        const a = img.closest("a");
        return { alt: img.alt, href: a ? a.href : null };
      })
  );
  await page.close();

  const entries = raw
    .map(({ alt, href }) => ({
      nome: alt
        .replace(/^(marmo|granito|quarzite|travertino|onice|agglomerato|pietra)\s+/i, "")
        .replace(/\s+\S*\d\S*\s+[a-z]{2}\s+\d{1,3}$/i, "")
        .trim(),
      href,
    }))
    .filter((e) => e.nome);

  const materiali = dedupeWithUrl(entries);
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su laponte.it/magazzino");

  return {
    id: "la-ponte",
    nome: "La Ponte",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dall\'attributo alt delle immagini lastra, ripulendo prefisso categoria e suffisso codice/finitura, con link diretto alla scheda materiale — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "la-ponte" };
