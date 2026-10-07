import { useSyncExternalStore } from "react";
import { borrar, guardar, leer } from "./storage";

// Todo el progreso vive en una sola clave de localStorage. Si el storage falla,
// la app sigue andando con el estado en memoria y se pierde al cerrar.

export type Caja = 1 | 2 | 3;
export type RegistroItem = { ok: number; mal: number; ultima: boolean; cuando: number };
export type RegistroCarta = { caja: Caja; cuando: number };
export type RegistroSimulacro = { cuando: number; aciertos: number; total: number };

export type EstadoProgreso = {
  version: 1;
  items: Record<string, RegistroItem>;
  cartas: Record<string, RegistroCarta>;
  dias: string[]; // días con actividad, "AAAA-MM-DD" en hora local
  recordVF: number;
  simulacros: RegistroSimulacro[];
};

const CLAVE = "progreso.v1";
const VACIO: EstadoProgreso = { version: 1, items: {}, cartas: {}, dias: [], recordVF: 0, simulacros: [] };

function cargar(): EstadoProgreso {
  const e = leer<Partial<EstadoProgreso> | null>(CLAVE, null);
  if (!e || typeof e !== "object" || e.version !== 1) return VACIO;
  return {
    version: 1,
    items: e.items && typeof e.items === "object" ? e.items : {},
    cartas: e.cartas && typeof e.cartas === "object" ? e.cartas : {},
    dias: Array.isArray(e.dias) ? e.dias : [],
    recordVF: typeof e.recordVF === "number" ? e.recordVF : 0,
    simulacros: Array.isArray(e.simulacros) ? e.simulacros : [],
  };
}

let estado = cargar();
const oyentes = new Set<() => void>();

function cambiar(f: (e: EstadoProgreso) => EstadoProgreso) {
  estado = f(estado);
  guardar(CLAVE, estado);
  oyentes.forEach((o) => o());
}

export function useProgreso(): EstadoProgreso {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => estado,
  );
}

export function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const hoy = () => fechaLocal(new Date());

const conDia = (dias: string[]) => (dias.includes(hoy()) ? dias : [...dias, hoy()]);

export function registrarRespuesta(id: string, ok: boolean) {
  cambiar((e) => {
    const r = e.items[id] ?? { ok: 0, mal: 0, ultima: false, cuando: 0 };
    return {
      ...e,
      dias: conDia(e.dias),
      items: { ...e.items, [id]: { ok: r.ok + (ok ? 1 : 0), mal: r.mal + (ok ? 0 : 1), ultima: ok, cuando: Date.now() } },
    };
  });
}

export type ResultadoCarta = "sabia" | "masomenos" | "nosabia";

// Leitner de 3 cajas: la sabía sube una caja, más o menos se queda, no la sabía vuelve a la 1.
export function moverCarta(id: string, resultado: ResultadoCarta) {
  cambiar((e) => {
    const actual = e.cartas[id]?.caja ?? 1;
    const caja: Caja = resultado === "sabia" ? (Math.min(actual + 1, 3) as Caja) : resultado === "nosabia" ? 1 : actual;
    return { ...e, dias: conDia(e.dias), cartas: { ...e.cartas, [id]: { caja, cuando: Date.now() } } };
  });
}

// Para los juegos que no tienen preguntas individuales (memotest, diagrama): cuenta para la racha de días.
export function marcarDia() {
  cambiar((e) => (e.dias.includes(hoy()) ? e : { ...e, dias: conDia(e.dias) }));
}

export function registrarPuntajeVF(puntaje: number) {
  cambiar((e) => (puntaje > e.recordVF ? { ...e, recordVF: puntaje } : e));
}

export const cajaDe = (e: EstadoProgreso, id: string): Caja => e.cartas[id]?.caja ?? 1;

export function registrarSimulacro(aciertos: number, total: number) {
  cambiar((e) => ({
    ...e,
    dias: conDia(e.dias),
    simulacros: [...e.simulacros, { cuando: Date.now(), aciertos, total }].slice(-20),
  }));
}

// Días seguidos con actividad. Si hoy todavía no estudiaste, la racha de ayer sigue viva.
export function racha(dias: string[], ahora = new Date()): number {
  const set = new Set(dias);
  const d = new Date(ahora);
  if (!set.has(fechaLocal(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(fechaLocal(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const CLAVE_SIMULACRO = "simulacro.v1";

export function resetearProgreso() {
  borrar(CLAVE_SIMULACRO);
  cambiar(() => VACIO);
}
