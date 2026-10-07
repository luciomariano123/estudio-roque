import { preguntas } from "../content";
import type { EstadoProgreso } from "./progreso";
import { mezclar } from "./mezclar";
import type { Item } from "../types";

// "6.4" incluye 6.4, 6.4.1, 6.4.2… pero no 6.40.
export const dentroDe = (clausula: string, raiz: string) => clausula === raiz || clausula.startsWith(raiz + ".");

export const preguntasDe = (raiz: string) => preguntas.filter((p) => dentroDe(p.clausula, raiz));

// Mezcla y pone primero lo nunca respondido o fallado la última vez.
export function priorizar(items: Item[], progreso: EstadoProgreso): Item[] {
  const peso = (it: Item) => (progreso.items[it.id]?.ultima ? 1 : 0);
  return mezclar(items).sort((a, b) => peso(a) - peso(b));
}
