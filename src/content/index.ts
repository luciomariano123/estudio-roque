import type { Bloque, Clausula, Flashcard, GrupoClasificacion, Item, Mazo } from "../types";
import clausulasJson from "./clausulas.json";
import clasificadorJson from "./clasificador.json";
import estructuraJson from "./estructura.json";
import flashcardsJson from "./flashcards.json";
import mazosJson from "./mazos.json";

// Cualquier .json nuevo en preguntas/ se carga solo: agregar preguntas no requiere tocar código.
const archivos = import.meta.glob<Item[]>("./preguntas/*.json", { eager: true, import: "default" });

export const preguntas: Item[] = Object.keys(archivos)
  .sort()
  .flatMap((k) => archivos[k]);

export const flashcards = flashcardsJson as Flashcard[];
export const mazos = mazosJson as Mazo[];
export const clausulas = clausulasJson as Clausula[];
export const gruposClasificacion = clasificadorJson as GrupoClasificacion[];
export const estructura = estructuraJson as Bloque[];

const porId = new Map(clausulas.map((c) => [c.id, c]));
export const tituloClausula = (id: string) => porId.get(id)?.titulo ?? "";

export const NOMBRE_TIPO: Record<Item["tipo"], string> = {
  mc: "Multiple choice",
  vf: "Verdadero / falso",
  cloze: "Completar la frase",
  clasificar: "Clasificar",
  caso: "Caso práctico",
  clausula: "¿Qué cláusula es?",
};

export const NOMBRE_CAPITULO: Record<number, string> = {
  0: "Prólogo e intro",
  1: "1 · Objeto",
  2: "2 · Referencias",
  3: "3 · Términos",
  4: "4 · Principios",
  5: "5 · Marco",
  6: "6 · Proceso",
};
