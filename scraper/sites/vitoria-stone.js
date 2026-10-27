// Vitoria Stone — la home mostra solo un riepilogo per materiale ("Pz.
// Disponibili"), senza spessore/lavorazione/blocco. I dati veri per blocco
// si ottengono filtrando un materiale alla volta via
// index.php?filtro_materali_link=<id>|<NOME>&lang=ITA (stessa piattaforma
// Isodata di NaturalStone/Savoia — "Sviluppato da Isodata Software
// Solutions" in fondo alla pagina), poi leggendo il testo renderizzato:
// "Lastre <lavorazione>\nN.BLOCCO <numero>\n<spessore> cm | <pezzi>
// PEZZO/I | <mq> MQ" ripetuto per ogni blocco. L'elenco materiali/id viene
// dal filtro #framework della home. Una pagina per materiale (~55), non
// troppo pesante per lo scraping notturno.
const URL = "https://www.vitoriastone.it/";
const BLOCK_RE = /Lastre\s+([^\n]+)\nN\.BLOCCO\s+(\S+)\n([\d.]+)\s*cm\s*\|\s*(\d+)\s*PEZZ[IO]\s*\|\s*([\d.,]+)\s*MQ/g;

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });

  // il filtro materiali a volte impiega piu' tempo a popolarsi (o la prima
  // risposta e' incompleta): ritenta con un reload prima di arrendersi.
  let options = [];
  for (let attempt = 0; attempt < 3 && options.length === 0; attempt++) {
    await page.waitForTimeout(1500);
    options = await page.locator("#framework option").evaluateAll((els) => els.map((e) => e.value).filter(Boolean));
    if (options.length === 0) await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  }

  const materiali = [];
  for (const opt of options) {
    const sep = opt.indexOf("|");
    if (sep === -1) continue;
    const id = opt.slice(0, sep);
    const nome = opt.slice(sep + 1).trim();
    if (!nome) continue;

    const filterUrl = `${URL}index.php?filtro_materali_link=${encodeURIComponent(id)}|${encodeURIComponent(nome)}&lang=ITA`;
    try {
      await page.goto(filterUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(600);
    } catch {
      continue;
    }

    const blocks = await page.evaluate((reSource) => {
      const txt = document.body.innerText;
      const re = new RegExp(reSource, "g");
      const out = [];
      let m;
      while ((m = re.exec(txt))) out.push(m.slice(1));
      return out;
    }, BLOCK_RE.source);

    const spessori = new Set();
    const lavorazioni = new Set();
    const blocchi = blocks.map(([lavorazione, numero, spessore, pezzi]) => {
      spessori.add(Number(spessore));
      lavorazioni.add(lavorazione.trim());
      return { numero, spessore, lavorazione: lavorazione.trim(), quantita: Number(pezzi) || null };
    });

    materiali.push({
      nome,
      alias: [],
      spessori: [...spessori].sort((a, b) => a - b),
      lavorazioni: [...lavorazioni].sort(),
      blocchi,
    });
  }
  await page.close();

  materiali.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato nel filtro framework");

  return {
    id: "vitoria-stone",
    nome: "Vitoria Stone",
    url: URL,
    stato: "scraped",
    note:
      "Elenco materiali dal filtro home, dettaglio spessore/lavorazione/quantità per blocco letto filtrando un materiale alla volta (filtro_materali_link) — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "vitoria-stone" };
