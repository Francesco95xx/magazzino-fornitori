// Script una-tantum: genera ../index.html a partire dall'originale
// Ricerca Materiali.html, sostituendo i dati incorporati con un fetch a
// data/fornitori.json.

const fs = require("fs");
const path = require("path");

const src = path.join(
  "C:", "Users", "francesco.moro.CADORO", "Desktop", "MagazzinoMateriali", "Ricerca Materiali.html"
);
const out = path.join(__dirname, "..", "index.html");

let html = fs.readFileSync(src, "utf8");

// 1) FORNITORI_BASE: da const con dati incorporati a let vuoto (caricato via fetch)
const startMarker = "const FORNITORI_BASE = [";
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) throw new Error("FORNITORI_BASE non trovato");
const endMarker = "\n];";
const endIdx = html.indexOf(endMarker, startIdx);
if (endIdx === -1) throw new Error("fine FORNITORI_BASE non trovata");
const before = html.slice(0, startIdx);
const after = html.slice(endIdx + endMarker.length);
html = before + "let FORNITORI_BASE = [];" + after;

// 2) id sul paragrafo di empty-state per potervi scrivere un messaggio di caricamento/errore
const emptyStateNeedle = "<p>Inizia a digitare per cercare un materiale.</p>";
if (!html.includes(emptyStateNeedle)) throw new Error("paragrafo empty-state non trovato");
html = html.replace(
  emptyStateNeedle,
  '<p id="emptyStateText">Inizia a digitare per cercare un materiale.</p>'
);

// 3) bootstrap: sostituisce l'ultima riga "render();" con fetch + render
const bootstrap = [
  "",
  "async function loadFornitoriBase(){",
  "  const resp = await fetch('data/fornitori.json', {cache:'no-store'});",
  "  if(!resp.ok) throw new Error('HTTP '+resp.status);",
  "  FORNITORI_BASE = await resp.json();",
  "}",
  "const emptyStateText = document.getElementById('emptyStateText');",
  "loadFornitoriBase().catch(err=>{",
  "  console.error('Errore caricamento dati fornitori:', err);",
  "  if(emptyStateText) emptyStateText.textContent = 'Errore nel caricamento dei dati (' + err.message + '). Ricarica la pagina.';",
  "}).finally(()=>{ render(); renderManageList(); });",
  "",
].join("\n");

const finalRenderNeedle = "\nrender();\n</script>";
if (!html.includes(finalRenderNeedle)) throw new Error("render() finale non trovato prima di </script>");
html = html.replace(finalRenderNeedle, bootstrap + "\n</script>");

fs.writeFileSync(out, html, "utf8");
console.log(`Scritto ${out} (${html.length} caratteri)`);
