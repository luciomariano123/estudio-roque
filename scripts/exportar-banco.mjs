// Genera docs/BANCO.md a partir de src/content, para revisar el banco desde GitHub.
// Uso: npm run banco
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = join(dirname(fileURLToPath(import.meta.url)), "..");
const raiz = join(base, "src", "content");
const leer = (rel) => JSON.parse(readFileSync(join(raiz, rel), "utf8"));

const TIPO = { mc: "Multiple choice", vf: "V/F", cloze: "Completar", clasificar: "Clasificar", caso: "Caso", clausula: "¿Qué cláusula?" };
const CAP = { 0: "Prólogo, introducción y bibliografía", 1: "1 · Objeto y campo de aplicación", 2: "2 · Referencias normativas", 3: "3 · Términos y definiciones", 4: "4 · Principios", 5: "5 · Marco de referencia", 6: "6 · Proceso" };
const grupos = new Map(leer("clasificador.json").map((g) => [g.id, g]));

// Orden natural de cláusulas: "Prólogo" < "1" < "3.1" < "5.4.1" < "6.4.4"
const PRELIMINARES = ["Prólogo", "Introducción", "Bibliografía"];
const clave = (c) => (/^\d/.test(c) ? c.split(".").map((n) => n.padStart(3, "0")).join(".") : "000." + PRELIMINARES.indexOf(c));
// Mismo criterio que GitHub para las anclas de los títulos.
const ancla = (t) => t.toLowerCase().replace(/[^a-z0-9áéíóúñü -]/g, "").replace(/ /g, "-");

const preguntas = readdirSync(join(raiz, "preguntas"))
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => leer(join("preguntas", f)))
  .sort((a, b) => a.capitulo - b.capitulo || clave(a.clausula).localeCompare(clave(b.clausula)) || a.id.localeCompare(b.id));

const L = [];
L.push("# Banco de contenido — ISO 31000:2018", "");
L.push("> Archivo generado con `npm run banco` a partir de `src/content/`. Para corregir algo, editá el JSON (buscá el id) y volvé a generar.", "");
L.push(`**${preguntas.length} preguntas** · **${leer("flashcards.json").length} flashcards** · fichas del mapa al final.`, "");
L.push("En el JSON la opción correcta va primera por convención; la app mezcla el orden en cada intento. Acá se marca con ✅.", "");

L.push("## Índice", "");
for (const c of Object.keys(CAP)) {
  const n = preguntas.filter((p) => p.capitulo === Number(c)).length;
  if (n) L.push(`- [${CAP[c]}](#${ancla(CAP[c])}) — ${n}`);
}
L.push("- [Flashcards](#flashcards)", "- [Fichas del mapa](#fichas-del-mapa)", "- [Memotest](#memotest)", "- [Armá el diagrama](#armá-el-diagrama)", "");

let capActual = null;
for (const p of preguntas) {
  if (p.capitulo !== capActual) {
    capActual = p.capitulo;
    L.push(`## ${CAP[capActual]}`, "");
  }
  const tags = (p.tags ?? []).map((t) => (t === "trampa" ? "⚠️ trampa" : t)).join(" · ");
  const extra = [TIPO[p.tipo], `cláusula ${p.clausula}`, `dificultad ${p.dificultad}`, tags].filter(Boolean).join(" · ");
  L.push(`#### \`${p.id}\``, `<sub>${extra}</sub>`, "");
  if (p.grupo) L.push(`*${grupos.get(p.grupo)?.titulo ?? p.grupo}*`, "");
  L.push(p.enunciado, "");
  if (p.tipo === "vf") L.push(`- ✅ **${p.correcta ? "Verdadero" : "Falso"}**`);
  else for (const [i, o] of p.opciones.entries()) L.push(i === p.correcta ? `- ✅ **${o}**` : `- ${o}`);
  L.push("", `> ${p.explicacion}`, "");
}

L.push("## Flashcards", "");
const flashcards = leer("flashcards.json");
for (const m of leer("mazos.json")) {
  L.push(`### ${m.titulo}`, "", `| id | cláusula | frente | dorso |`, `|---|---|---|---|`);
  for (const f of flashcards.filter((f) => f.mazo === m.id))
    L.push(`| \`${f.id}\` | ${f.clausula} | ${f.frente} | ${f.dorso.replace(/\|/g, "\\|")} |`);
  L.push("");
}

L.push("## Fichas del mapa", "");
for (const b of leer("estructura.json")) {
  L.push(`### ${b.titulo} (cap. ${b.capitulo})`, "", b.resumen, "");
  if (b.centro) L.push(`**Centro de la figura:** ${b.centro}`, "");
  for (const p of b.partes) {
    L.push(`**${p.titulo}** · ${p.clausula} — ${p.resumen}`, "");
    for (const pt of p.puntos) L.push(`- ${pt}`);
    L.push("");
  }
}

L.push("## Memotest", "");
for (const set of leer("memotest.json")) {
  L.push(`### ${set.titulo}`, "", "| cláusula | carta A | carta B |", "|---|---|---|");
  for (const p of set.pares) L.push(`| ${p.clausula} | ${p.a} | ${p.b} |`);
  L.push("");
}

L.push("## Armá el diagrama", "");
for (const d of leer("diagramas.json")) {
  L.push(`### ${d.titulo} (${d.clausula})`, "");
  if (d.centro) L.push(`- **Centro:** ${d.centro.correcta}`);
  for (const l of d.lugares) L.push(`- ${l.pista} → ${l.correcta}`);
  L.push(`- *Piezas que sobran:* ${d.distractores.join(", ")}`, "");
}

mkdirSync(join(base, "docs"), { recursive: true });
writeFileSync(join(base, "docs", "BANCO.md"), L.join("\n"));
console.log(`docs/BANCO.md generado (${preguntas.length} preguntas).`);
