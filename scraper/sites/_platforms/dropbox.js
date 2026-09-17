// Piattaforma condivisa per le cartelle Dropbox condivise (link pubblici,
// nessun login). L'elenco file è una griglia virtualizzata
// ([data-testid="sl-grid-body"] > li): il nome file (con materiale +
// codice blocco) è nell'attributo alt dell'immagine anteprima. Le
// sottocartelle appaiono come <li> senza img/alt, solo un link.
// La griglia carica altri elementi solo scrollando i contenitori interni
// (non la pagina): serve scrollare esplicitamente ogni div scrollabile.
async function listFolder(page, url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  const SEL = '[data-testid="sl-grid-body"] > li';
  let prevCount = -1;
  for (let i = 0; i < 60; i++) {
    const count = await page.locator(SEL).count();
    if (count === prevCount && i > 3) break;
    prevCount = count;
    await page.evaluate(() => {
      const scrollables = [...document.querySelectorAll("*")].filter(
        (e) => e.scrollHeight > e.clientHeight + 50 && e.clientHeight > 200
      );
      scrollables.forEach((e) => (e.scrollTop += 1500));
      window.scrollBy(0, 1500);
    });
    await page.waitForTimeout(500);
  }

  return page.locator(SEL).evaluateAll((lis) =>
    lis.map((li) => {
      const img = li.querySelector("img[alt]");
      const link = li.querySelector("a");
      return { alt: img ? img.getAttribute("alt") : null, href: link ? link.href : null };
    })
  );
}

module.exports = { listFolder };
