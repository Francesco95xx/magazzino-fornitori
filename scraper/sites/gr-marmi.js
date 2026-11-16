// GR Marmi — il vero Magazzino Online richiede un account cliente. Login
// via form WordPress (User Registration plugin): #username/#password,
// bottone submit button[name="login"]. Dopo il login, il filtro
// "MATERIALE" è un <select id="product_cat"> con l'elenco completo (215
// materiali, opzione "Seleziona una categoria" esclusa).
// Credenziali da GRMARMI_EMAIL / GRMARMI_PASSWORD (GitHub Secret + env
// locale), mai hardcoded — stesso schema di MARIMAR_API_TOKEN.
//
// Ogni materiale è una categoria WooCommerce; ogni blocco è un "prodotto"
// singolo (es. "GR 16441") con pagina dettaglio propria. La tabella
// attributi prodotto (table.woocommerce-product-attributes) espone
// "Spessore" (es. "2cm") e "Finitura" (es. "Grezzo") quando presenti.
// Nessuna quantità/disponibilità esposta sul sito (blocchi grezzi, non
// lastre a pezzi) — campo quantita lasciato null.
// Cambiare il filtro MATERIALE naviga davvero la pagina (non è un
// semplice refresh AJAX), va quindi avvolto in waitForNavigation.
const URL = "https://www.grmarmi.it/magazzino/";

async function scrape(context) {
  const email = process.env.GRMARMI_EMAIL;
  const password = process.env.GRMARMI_PASSWORD;
  if (!email || !password) {
    throw new Error("Variabili d'ambiente GRMARMI_EMAIL / GRMARMI_PASSWORD mancanti (vedi README)");
  }

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 45000 });

  await page.fill("#username", email);
  await page.fill("#password", password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 20000 }).catch(() => null),
    page.click('button[name="login"]'),
  ]);
  await page.waitForTimeout(1500);

  let categories = await page.evaluate(() => {
    const sel = document.querySelector("#product_cat");
    return [...sel.options]
      .filter((o) => o.value && !/seleziona/i.test(o.text))
      .map((o) => ({ value: o.value, text: o.text.trim() }));
  });
  if (categories.length === 0) throw new Error("Nessuna categoria trovata nel filtro product_cat (login fallito?)");

  const limit = Number(process.env.GRMARMI_LIMIT);
  if (limit > 0) categories = categories.slice(0, limit);

  const materiali = [];
  let i = 0;

  for (const cat of categories) {
    i++;
    console.log(`[${i}/${categories.length}] ${cat.text}`);
    try {
      await page.goto(URL, { waitUntil: "load", timeout: 30000 });
      await page.waitForSelector("#product_cat", { timeout: 10000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load", timeout: 20000 }).catch(() => null),
        page.evaluate((val) => {
          const sel = document.querySelector("#product_cat");
          sel.value = val;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }, cat.value),
      ]);
      await page.waitForTimeout(500);

      const hrefs = await page
        .locator("ul.products li.product a.product-category")
        .evaluateAll((as) => [...new Set(as.map((a) => a.href))])
        .catch(() => []);

      const spessori = new Set();
      const lavorazioni = new Set();
      const blocchi = [];

      for (const href of hrefs) {
        await page.goto(href, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(300);

        const numero =
          (await page.locator(".sku").first().textContent().catch(() => null))?.trim() ||
          (await page.locator("h1").first().textContent().catch(() => null))?.trim() ||
          null;

        const rows = await page
          .locator("table.woocommerce-product-attributes tr")
          .evaluateAll((trs) =>
            trs.map((tr) => ({
              label: tr.querySelector("th")?.textContent.trim() || "",
              value: tr.querySelector("td")?.textContent.trim() || "",
            }))
          )
          .catch(() => []);

        const spessoreRaw = rows.find((r) => /spessore/i.test(r.label))?.value || null;
        const finituraRaw = rows.find((r) => /finitura/i.test(r.label))?.value || null;

        const spessoreNum = spessoreRaw
          ? Number(spessoreRaw.replace(",", ".").match(/[\d.]+/)?.[0])
          : null;
        if (spessoreNum && !isNaN(spessoreNum)) spessori.add(spessoreNum);
        const lavorazione = finituraRaw ? finituraRaw.toLowerCase() : "";
        if (lavorazione) lavorazioni.add(lavorazione);

        blocchi.push({ numero, spessore: spessoreNum || "", lavorazione, quantita: null });
      }

      materiali.push({
        nome: cat.text,
        alias: [],
        spessori: [...spessori].sort((a, b) => a - b),
        lavorazioni: [...lavorazioni].sort(),
        blocchi,
      });
    } catch (e) {
      materiali.push({ nome: cat.text, alias: [], spessori: [], lavorazioni: [], blocchi: [] });
    }
  }

  await page.close();

  materiali.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  if (materiali.length === 0) throw new Error("Nessun materiale trovato su grmarmi.it/magazzino");

  return {
    id: "gr-marmi",
    nome: "GR Marmi",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dal filtro "MATERIALE" (select product_cat) del vero Magazzino Online, con login automatico, spessore/lavorazione/numero blocco per ogni prodotto/blocco — scraping automatico notturno.',
    materiali,
  };
}

module.exports = { scrape, id: "gr-marmi" };
