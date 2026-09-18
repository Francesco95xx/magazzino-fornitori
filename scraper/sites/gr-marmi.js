// GR Marmi — il vero Magazzino Online richiede un account cliente. Login
// via form WordPress (User Registration plugin): #username/#password,
// bottone submit button[name="login"]. Dopo il login, il filtro
// "MATERIALE" è un <select id="product_cat"> con l'elenco completo (215
// materiali, opzione "Seleziona una categoria" esclusa).
// Credenziali da GRMARMI_EMAIL / GRMARMI_PASSWORD (GitHub Secret + env
// locale), mai hardcoded — stesso schema di MARIMAR_API_TOKEN.
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

  const names = await page.locator("#product_cat option").allTextContents();
  await page.close();

  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n && !/^seleziona/i.test(n)))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
  if (unique.length === 0) throw new Error("Nessun materiale trovato nel filtro product_cat (login fallito?)");

  return {
    id: "gr-marmi",
    nome: "GR Marmi",
    url: URL,
    stato: "scraped",
    note:
      'Elenco letto dal filtro "MATERIALE" (select product_cat) del vero Magazzino Online, con login automatico — scraping automatico notturno.',
    materiali: unique.map((nome) => ({ nome, alias: [] })),
  };
}

module.exports = { scrape, id: "gr-marmi" };
