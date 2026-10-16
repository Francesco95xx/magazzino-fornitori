// Sincronizza i dati scraping di questo progetto nel vecchio tool standalone
// "Ricerca Materiali.html" (Desktop\MagazzinoMateriali), che gira ancora in
// parallelo a questo con una grafica propria ma nessuna pipeline di scraping
// sua. Aggiorna dentro FORNITORI_BASE solo i fornitori il cui id esiste anche
// qui; aggiunge in fondo quelli nuovi; lascia intatti quelli presenti solo in
// Ricerca Materiali (es. "nicola-fontanili", non ancora automatizzato qui).
//
// Pensato per girare come step extra dopo run-all.js nello stesso workflow
// notturno: entrambi i progetti vivono sullo stesso PC, quindi il percorso
// del file è un path locale assoluto (non fa parte di questo repo, non va
// commitato/pushato).

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "fornitori.json");
const RM_PATH =
  "C:\\Users\\francesco.moro.CADORO\\Desktop\\MagazzinoMateriali\\Ricerca Materiali.html";

function jsStringArray(values) {
  return "[" + values.map((v) => JSON.stringify(v)).join(",") + "]";
}

function renderMateriali(materiali) {
  const plain = materiali.filter((m) => !m.alias || m.alias.length === 0);
  const withAlias = materiali.filter((m) => m.alias && m.alias.length > 0);
  let expr = `mat(${jsStringArray(plain.map((m) => m.nome))})`;
  if (withAlias.length > 0) {
    const items = withAlias
      .map((m) => `{nome:${JSON.stringify(m.nome)}, alias:${JSON.stringify(m.alias)}}`)
      .join(",");
    expr += `.concat([${items}])`;
  }
  return expr;
}

function renderEntry(f) {
  const parts = [
    `id:${JSON.stringify(f.id)}`,
    `nome:${JSON.stringify(f.nome)}`,
    `url:${JSON.stringify(f.url)}`,
    `stato:${JSON.stringify(f.stato)}`,
  ];
  if (f.note) parts.push(`note:${JSON.stringify(f.note)}`);
  parts.push(`materiali:${renderMateriali(f.materiali)}`);
  return `  {${parts.join(", ")}},`;
}

function main() {
  if (!fs.existsSync(RM_PATH)) {
    console.log(`Ricerca Materiali.html non trovato (${RM_PATH}), sync saltato.`);
    return;
  }

  const fornitori = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const byId = new Map(fornitori.map((f) => [f.id, f]));

  const html = fs.readFileSync(RM_PATH, "utf8");
  const blockMatch = html.match(/const FORNITORI_BASE = \[\n([\s\S]*?)\n\];/);
  if (!blockMatch) {
    throw new Error("Blocco FORNITORI_BASE non trovato in Ricerca Materiali.html");
  }

  const lines = blockMatch[1].split("\n");
  const existingIds = new Set();
  let changed = 0;

  const newLines = lines.map((line) => {
    const idMatch = line.match(/\{id:"([^"]+)"/);
    if (!idMatch) return line;
    const id = idMatch[1];
    existingIds.add(id);
    const fresh = byId.get(id);
    if (!fresh) return line; // non automatizzato qui, lasciato intatto
    const rendered = renderEntry(fresh);
    if (rendered !== line) changed++;
    return rendered;
  });

  const added = [];
  for (const f of fornitori) {
    if (!existingIds.has(f.id)) {
      newLines.push(renderEntry(f));
      added.push(f.id);
    }
  }

  const newBlock = newLines.join("\n");
  const newHtml = html.replace(blockMatch[0], `const FORNITORI_BASE = [\n${newBlock}\n];`);

  if (newHtml === html) {
    console.log("Ricerca Materiali.html: nessuna modifica.");
    return;
  }

  fs.writeFileSync(RM_PATH, newHtml, "utf8");
  console.log(
    `Ricerca Materiali.html aggiornato: ${changed} fornitori modificati, ${added.length} nuovi aggiunti` +
      (added.length ? ` (${added.join(", ")})` : "") +
      "."
  );
}

main();
