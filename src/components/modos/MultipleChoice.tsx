import { useState } from "react";
import { preguntas } from "../../content";
import { ir } from "../../lib/ruta";
import { priorizar } from "../../lib/practica";
import { useProgreso } from "../../lib/progreso";
import { guardar, leer } from "../../lib/storage";
import type { Item } from "../../types";
import Selector from "../Selector";
import Sesion from "../Sesion";

type Alcance = "todo" | "0-3" | "4" | "5" | "6";
const ALCANCES: { valor: Alcance; texto: string }[] = [
  { valor: "todo", texto: "Mezclado" },
  { valor: "0-3", texto: "Caps. 1–3" },
  { valor: "4", texto: "Principios" },
  { valor: "5", texto: "Marco" },
  { valor: "6", texto: "Proceso" },
];
const CANTIDADES = [
  { valor: 10, texto: "10" },
  { valor: 20, texto: "20" },
  { valor: 0, texto: "Todas" },
];

const delAlcance = (a: Alcance) => (p: Item) =>
  p.tipo === "mc" && (a === "todo" || (a === "0-3" ? p.capitulo <= 3 : p.capitulo === Number(a)));

export default function MultipleChoice() {
  const progreso = useProgreso();
  const [alcance, setAlcance] = useState<Alcance>(() => leer("mc.alcance", "todo"));
  const [cantidad, setCantidad] = useState<number>(() => leer("mc.cantidad", 10));
  const [sesion, setSesion] = useState<{ items: Item[]; n: number } | null>(null);

  const disponibles = preguntas.filter(delAlcance(alcance));
  const respondidas = disponibles.filter((p) => progreso.items[p.id]);
  const bien = respondidas.filter((p) => progreso.items[p.id].ultima).length;

  function empezar() {
    const items = priorizar(disponibles, progreso);
    setSesion((s) => ({ items: cantidad ? items.slice(0, cantidad) : items, n: (s?.n ?? 0) + 1 }));
  }

  if (sesion) return <Sesion key={sesion.n} items={sesion.items} onOtra={empezar} onSalir={() => setSesion(null)} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Multiple choice</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          4 opciones, explicación al toque. Primero salen las que nunca respondiste o fallaste.
        </p>
      </div>
      <Selector
        etiqueta="¿Qué practicás?"
        opciones={ALCANCES}
        valor={alcance}
        onChange={(v) => {
          setAlcance(v);
          guardar("mc.alcance", v);
        }}
      />
      <Selector
        etiqueta="¿Cuántas?"
        opciones={CANTIDADES}
        valor={cantidad}
        onChange={(v) => {
          setCantidad(v);
          guardar("mc.cantidad", v);
        }}
      />
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {disponibles.length} preguntas · respondiste {respondidas.length}
        {respondidas.length > 0 && `, la última vez acertaste ${bien}`}
      </p>
      <button onClick={empezar} className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-600">
        Empezar
      </button>
      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}
