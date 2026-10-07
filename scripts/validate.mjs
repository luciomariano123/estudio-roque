// Revisa los JSON de src/content. Uso: npm run validate
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content");
const leer = (rel) => JSON.parse(readFileSync(join(raiz, rel), "utf8"));

const errores = [];
const error = (donde, msg) => errores.push(`${donde}: ${msg}`);

const clausulas = new Map(leer("clausulas.json").map((c) => [c.id, c]));
const grupos = new Map(leer("clasificador.json").map((g) => [g.id, g]));
const mazos = new Set(leer("mazos.json").map((m) => m.id));

const PREFIJOS = { mc: "mc", vf: "vf", cloze: "cloze", clasificar: "clas", caso: "caso", clausula: "clau" };
const TAGS = new Set(["trampa", "lista", "definicion", "proposito"]);
const CAPITULOS = new Set([0, 1, 2, 3, 4, 5, 6]);
const ids = new Map();

function idUnico(id, donde) {
  if (typeof id !== "string" || !id) return error(donde, "falta id");
  if (ids.has(id)) error(donde, `id repetido "${id}" (también en ${ids.get(id)})`);
  else ids.set(id, donde);
}

function clausulaValida(c, donde) {
  if (!clausulas.has(c)) error(donde, `cláusula inexistente "${c}"`);
}

for (const g of grupos.values()) clausulaValida(g.clausula, `clasificador.json#${g.id}`);

// --- Preguntas ---
const preguntas = [];
for (const archivo of readdirSync(join(raiz, "preguntas")).filter((f) => f.endsWith(".json")).sort()) {
  const lista = leer(join("preguntas", archivo));
  if (!Array.isArray(lista)) {
    error(archivo, "debe ser un array");
    continue;
  }
  for (const [i, it] of lista.entries()) {
    const donde = `preguntas/${archivo}#${it.id ?? i}`;
    preguntas.push(it);
    idUnico(it.id, donde);

    if (!PREFIJOS[it.tipo]) {
      error(donde, `tipo inválido "${it.tipo}"`);
      continue;
    }
    if (!it.id?.startsWith(PREFIJOS[it.tipo] + "-")) error(donde, `el id debería empezar con "${PREFIJOS[it.tipo]}-"`);
    if (!CAPITULOS.has(it.capitulo)) error(donde, `capítulo inválido ${it.capitulo}`);
    clausulaValida(it.clausula, donde);
    const cl = clausulas.get(it.clausula);
    if (cl && cl.capitulo !== it.capitulo)
      error(donde, `la cláusula ${it.clausula} es del capítulo ${cl.capitulo}, no del ${it.capitulo}`);
    if (![1, 2, 3].includes(it.dificultad)) error(donde, "dificultad debe ser 1, 2 o 3");
    if (typeof it.enunciado !== "string" || !it.enunciado.trim()) error(donde, "falta enunciado");

    if (typeof it.explicacion !== "string" || !it.explicacion.trim()) error(donde, "falta explicación");
    else if (!/\bVer\b/.test(it.explicacion)) error(donde, 'la explicación debería citar la cláusula ("Ver …")');

    for (const t of it.tags ?? []) if (!TAGS.has(t)) error(donde, `tag desconocido "${t}"`);

    if (it.tipo === "vf") {
      if (typeof it.correcta !== "boolean") error(donde, "en vf, correcta debe ser true o false");
      if (it.opciones) error(donde, "vf no lleva opciones");
      continue;
    }

    const ops = it.opciones;
    if (!Array.isArray(ops) || ops.some((o) => typeof o !== "string" || !o.trim())) {
      error(donde, "opciones debe ser un array de textos");
      continue;
    }
    if (new Set(ops).size !== ops.length) error(donde, "hay opciones repetidas");
    const esperadas = it.tipo === "cloze" ? [3, 4, 5, 6] : it.tipo === "clasificar" ? null : [4];
    if (esperadas && !esperadas.includes(ops.length)) error(donde, `cantidad de opciones inesperada (${ops.length})`);
    if (!Number.isInteger(it.correcta) || it.correcta < 0 || it.correcta >= ops.length)
      error(donde, `correcta (${JSON.stringify(it.correcta)}) no apunta a una opción existente`);
    if (it.tipo === "cloze" && !it.enunciado.includes("____")) error(donde, 'cloze debe tener un hueco "____"');
    if (it.tipo === "clausula") for (const o of ops) clausulaValida(o, `${donde} (opción)`);

    if (it.tipo === "clasificar") {
      const g = grupos.get(it.grupo);
      if (!g) error(donde, `grupo de clasificación inexistente "${it.grupo}"`);
      else if (JSON.stringify(g.categorias) !== JSON.stringify(ops))
        error(donde, `las opciones deben ser exactamente las categorías del grupo "${g.id}"`);
    } else if (it.grupo) error(donde, "solo los ítems de tipo clasificar llevan grupo");
  }
}

// --- Flashcards ---
const flashcards = leer("flashcards.json");
for (const [i, f] of flashcards.entries()) {
  const donde = `flashcards.json#${f.id ?? i}`;
  idUnico(f.id, donde);
  if (!mazos.has(f.mazo)) error(donde, `mazo inexistente "${f.mazo}"`);
  clausulaValida(f.clausula, donde);
  if (!f.frente?.trim() || !f.dorso?.trim()) error(donde, "falta frente o dorso");
}

// --- Estructura (fichas del mapa) ---
for (const b of leer("estructura.json")) {
  const donde = `estructura.json#${b.id}`;
  idUnico(b.id, donde);
  clausulaValida(b.clausula, donde);
  for (const p of b.partes ?? []) {
    idUnico(p.id, `${donde}/${p.id}`);
    clausulaValida(p.clausula, `${donde}/${p.id}`);
    if (!p.resumen?.trim() || !Array.isArray(p.puntos) || !p.puntos.length)
      error(`${donde}/${p.id}`, "falta resumen o puntos clave");
  }
}

// --- Resumen ---
const porCap = { "0-3": 0, 4: 0, 5: 0, 6: 0 };
const porTipo = {};
for (const p of preguntas) {
  porCap[p.capitulo <= 3 ? "0-3" : p.capitulo]++;
  porTipo[p.tipo] = (porTipo[p.tipo] ?? 0) + 1;
}
const pct = (n) => `${Math.round((n / preguntas.length) * 100)}%`;
console.log(`Preguntas: ${preguntas.length} · Flashcards: ${flashcards.length}`);
console.log("Por capítulo:", Object.entries(porCap).map(([k, v]) => `${k}: ${v} (${pct(v)})`).join(" · "));
console.log("Por tipo:", Object.entries(porTipo).map(([k, v]) => `${k}: ${v}`).join(" · "));

if (errores.length) {
  console.error(`\n✗ ${errores.length} error(es):`);
  for (const e of errores) console.error("  - " + e);
  process.exit(1);
}
console.log("\n✓ Contenido válido");
