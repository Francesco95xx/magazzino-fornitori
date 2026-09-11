// Marimar — widget Angular (magazzino-online / app-griglia-lastre) con
// caricamento a scroll reale: bisogna scrollare per davvero (mouse wheel),
// uno scrollTo() programmatico non basta a far scattare il caricamento.
// Il widget a volte impiega diversi secondi a montarsi: ritentiamo prima di
// arrenderci (osservato durante lo sviluppo, sito a volte lento/instabile).

const URL = "https://marimar.net/it/magazzino";
const MOUNT_TIMEOUT_MS = 40000;
const SCROLL_ROUNDS = 60;
const STABLE_ROUNDS_TO_STOP = 8;

async function waitForWidgetMount(page) {
  const deadline = Date.now() + MOUNT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const len = await page.evaluate(() => {
      const el = document.querySelector("magazzino-online");
      return el ? el.innerHTML.length : -1;
    });
    if (len > 5) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

const BLOCK_SIGNATURES = [
  "checking your browser",
  "cloudflare",
  "access denied",
  "attention required",
  "captcha",
  "just a moment",
  "403 forbidden",
  "unusual traffic",
];

async function diagnose(page, mainResponse, failedResponses, consoleErrors) {
  const title = await page.title().catch(() => "(n/d)");
  const bodySnippet = await page
    .evaluate(() => document.body.innerText.slice(0, 300))
    .catch(() => "(n/d)");
  const bodyLower = bodySnippet.toLowerCase();
  const matchedSignatures = BLOCK_SIGNATURES.filter((s) => bodyLower.includes(s));

  console.log("  [diagnostica marimar]");
  console.log(`    status navigazione: ${mainResponse ? mainResponse.status() : "n/d"}`);
  console.log(`    titolo pagina: ${title}`);
  console.log(`    possibili segnali di blocco: ${matchedSignatures.length ? matchedSignatures.join(", ") : "nessuno"}`);
  console.log(`    inizio testo pagina: ${JSON.stringify(bodySnippet.replace(/\s+/g, " ").trim())}`);
  if (failedResponses.length) {
    console.log(`    richieste con status >=400: ${failedResponses.slice(0, 10).join(" | ")}`);
  }
  if (consoleErrors && consoleErrors.length) {
    console.log(`    errori console/pagina: ${consoleErrors.slice(0, 10).join(" | ")}`);
  }
}

async function scrapeOnce(context) {
  const page = await context.newPage();
  const failedResponses = [];
  const consoleErrors = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url()}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message.slice(0, 200)));

  const mainResponse = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  const mounted = await waitForWidgetMount(page);
  if (!mounted) {
    await diagnose(page, mainResponse, failedResponses, consoleErrors);
    await page.close();
    throw new Error("Il widget magazzino-online non si è montato entro il timeout");
  }

  let lastCount = -1;
  let stableRounds = 0;
  for (let i = 0; i < SCROLL_ROUNDS && stableRounds < STABLE_ROUNDS_TO_STOP; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1200);
    const count = await page.$$eval(".mag-grid-title", (els) => els.length);
    stableRounds = count === lastCount ? stableRounds + 1 : 0;
    lastCount = count;
  }

  const names = await page.$$eval(".mag-grid-title", (els) =>
    els.map((t) => t.children[0]?.textContent.trim()).filter(Boolean)
  );

  const unique = [...new Set(names)].sort();
  if (unique.length === 0) {
    await diagnose(page, mainResponse, failedResponses, consoleErrors);
    const widgetHtml = await page
      .evaluate(() => document.querySelector("magazzino-online")?.innerHTML.slice(0, 500))
      .catch(() => "(n/d)");
    console.log(`    contenuto widget magazzino-online: ${JSON.stringify((widgetHtml || "").replace(/\s+/g, " ").trim())}`);
    await page.close();
    throw new Error("Nessun materiale trovato dopo lo scroll (widget montato ma vuoto)");
  }

  await page.close();
  return unique;
}

async function scrape(context) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const unique = await scrapeOnce(context);
      return {
        id: "marimar",
        nome: "Marimar",
        url: URL,
        stato: "scraped",
        note: "Magazzino lastre in tempo reale (pagina /it/magazzino) — scraping automatico notturno.",
        materiali: unique.map((nome) => ({ nome, alias: [] })),
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

module.exports = { scrape, id: "marimar" };
