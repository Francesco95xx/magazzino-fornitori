// La Ponte — il nome materiale è nell'alt delle immagini lastra, nel
// formato "<CATEGORIA> <MATERIALE> <codice blocco> <finitura> <numero>"
// (es. "MARMO ARABESCATO CORCHIA A2780 LU 02"); ripuliamo prefisso e
// suffisso. Ogni card (a.product-preview) ha anche un attributo
// data-thickness (JSON array, cm) e testo "N. Lastre: <q>"; il codice
// blocco è anche nel testo dell'h3 ("NOME - CODICE").
const URL = "https://www.laponte.it/magazzino";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  const raw = await page.evaluate(() =>
    [...document.querySelectorAll("a.product-preview")].map((a) => {
      const img = a.querySelector("img[alt]");
      const alt = img ? img.alt : "";
      let spessori = [];
      try {
        spessori = JSON.parse(a.getAttribute("data-thickness") || "[]");
      } catch {
        spessori = [];
      }
      const h3 = a.querySelector("h3")?.textContent.trim() || "";
      const numero = h3.includes(" - ") ? h3.split(" - ").slice(1).join(" - ").trim() : null;
      const qtaText = a.querySelector(".product-preview__availability span")?.textContent.trim();
      return { alt, href: a.href, spessori, numero, quantita: qtaText ? Number(qtaText) : null };
    })
  );
  await page.close();

  const byName = new Map();
  for (const { alt, href, spessori, numero, quantita } of raw) {
    if (!alt || !alt.trim()) continue;
    const nome = alt
      .replace(/^(marmo|granito|quarzite|travertino|onice|agglomerato|pietra)\s+/i, "")
      .replace(/\s+\S*\d\S*\s+[a-z]{2}\s+\d{1,3}$/i, "")
      .trim();
    if (!nome) continue;
    if (!byName.has(nome)) byName.set(nome, { href, spessori: new Set(), blocchi: [] });
    const entry = byName.get(nome);
    spessori.forEach((s) => entry.spessori.add(Number(s)));
    entry.blocchi.push({ numero, spessore: spessori.join("/") || null, lavorazione: "", quantita });
  }

  const materiali = [...byName.entries()]
    .map(([nome, info]) => ({
      nome,
      alias: [],
      url: info.href,
      spessori: [...info.spessori].sort((a, b) => a - b),
      lavorazioni: [],
      blocchi: info.blocchi,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  if (materiali.length === 0) throw new Error("Nessun materiale trovato su laponte.it/magazzino");

  return {
    id: "la-ponte",
    nome: "La Ponte",
    url: URL,
    stato: "scraped",
    note:
      "Elenco letto dall'attributo alt delle immagini lastra, ripulendo prefisso categoria e suffisso codice/finitura, con link diretto, spessore (data-thickness) e lastre disponibili per blocco — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "la-ponte" };
