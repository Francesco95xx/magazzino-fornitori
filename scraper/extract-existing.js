// Estrae l'array FORNITORI_BASE dal vecchio Ricerca Materiali.html (fonte di
// verità storica) senza doverlo ritrascrivere a mano. Eseguito una tantum
// per generare seed-static.json (i fornitori non ancora automatizzati).
//
// Uso: node extract-existing.js <path-a-Ricerca-Materiali.html> <path-output.json>

const fs = require("fs");
const vm = require("vm");

const [, , htmlPathArg, outPathArg] = process.argv;
if (!htmlPathArg || !outPathArg) {
  console.error("Uso: node extract-existing.js <input.html> <output.json>");
  process.exit(1);
}

const html = fs.readFileSync(htmlPathArg, "utf8");

const startMarker = "const FORNITORI_BASE = [";
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) throw new Error("FORNITORI_BASE non trovato nell'HTML");

// L'array chiude con "\n];" seguito da riga vuota e "const LS_OVERRIDES"
const endMarker = "\n];";
const endIdx = html.indexOf(endMarker, startIdx);
if (endIdx === -1) throw new Error("Fine di FORNITORI_BASE non trovata");

const arrayLiteral = html.slice(startIdx + "const FORNITORI_BASE = ".length, endIdx + 2);

const sandbox = {
  mat: (names) => names.map((n) => ({ nome: n, alias: [] })),
  result: null,
};
vm.createContext(sandbox);
vm.runInContext(`result = ${arrayLiteral}`, sandbox);

const fornitori = sandbox.result;
if (!Array.isArray(fornitori) || fornitori.length === 0) {
  throw new Error("Estrazione fallita: array vuoto o non valido");
}

fs.writeFileSync(outPathArg, JSON.stringify(fornitori, null, 2), "utf8");
console.log(`Estratti ${fornitori.length} fornitori -> ${outPathArg}`);
