// Mori Stone — pagina statica singola, nessuna paginazione/scroll infinito.
// Ogni <a> dentro <article> è una scheda materiale; alcuni testi contengono
// due nomi commerciali separati da "/" (es. "African Fusion / Belvedere"):
// li splittiamo in nome + alias, come già fatto a mano in questa sessione.

const URL = "https://moristone.com/materiali/";

async function scrape(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("article a", { timeout: 15000 });

  const rawEntries = await page.$$eval("article a", (els) =>
    els.map((e) => ({ text: e.textContent.trim(), href: e.href })).filter((e) => e.text)
  );
  await page.close();

  const seen = new Set();
  const materiali = [];
  for (const { text: raw, href } of rawEntries) {
    if (seen.has(raw)) continue;
    seen.add(raw);

    if (/^[a-z0-9-]+$/i.test(raw) && raw.includes("-") && !raw.includes(" ")) {
      // slug tecnico leaked come testo (es. "nero-zimbawe-nero-assoluto")
      const parts = raw.split("-").map((w) => w[0].toUpperCase() + w.slice(1));
      const mid = Math.ceil(parts.length / 2);
      materiali.push({ nome: parts.slice(0, mid).join(" "), alias: [parts.slice(mid).join(" ")], url: href });
      continue;
    }

    const slashIdx = raw.indexOf("/");
    if (slashIdx !== -1) {
      const nome = raw.slice(0, slashIdx).trim();
      const alias = raw.slice(slashIdx + 1).trim();
      materiali.push({ nome, alias: alias ? [alias] : [], url: href });
    } else {
      materiali.push({ nome: raw, alias: [], url: href });
    }
  }

  return {
    id: "moristone",
    nome: "Mori Stone",
    url: URL,
    stato: "scraped",
    note:
      "Magazzino online (pagina /materiali/, tutte le categorie: Marmi, Graniti, Quarziti), con link diretto alla scheda materiale — scraping automatico notturno.",
    materiali,
  };
}

module.exports = { scrape, id: "moristone" };
