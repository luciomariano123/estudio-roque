import { useState } from "react";
import { gruposClasificacion, preguntas } from "../../content";
import { priorizar } from "../../lib/practica";
import { useProgreso } from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import { guardar, leer } from "../../lib/storage";
import type { Item } from "../../types";
import Selector from "../Selector";
import Sesion from "../Sesion";

type Filtro = { valor: string; texto: string; incluye: (p: Item) => boolean };

export type ConfigModo = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: Item["tipo"];
  etiquetaFiltro: string;
  filtros: Filtro[];
};

const todo: Filtro = { valor: "todo", texto: "Mezclado", incluye: () => true };
const porCapitulo: Filtro[] = [
  todo,
  { valor: "0-3", texto: "Caps. 1–3", incluye: (p) => p.capitulo <= 3 },
  { valor: "4", texto: "Principios", incluye: (p) => p.capitulo === 4 },
  { valor: "5", texto: "Marco", incluye: (p) => p.capitulo === 5 },
  { valor: "6", texto: "Proceso", incluye: (p) => p.capitulo === 6 },
];

// Todos los modos que son "una pregunta tras otra" comparten pantalla: solo cambian el tipo y los filtros.
export const CONFIGS: Record<string, ConfigModo> = {
  "multiple-choice": {
    id: "multiple-choice",
    titulo: "Multiple choice",
    descripcion: "4 opciones, explicación al toque.",
    tipo: "mc",
    etiquetaFiltro: "¿Qué practicás?",
    filtros: porCapitulo,
  },
  clasificador: {
    id: "clasificador",
    titulo: "¿Dónde va?",
    descripcion: "Aparece un ítem: mandalo a la categoría que corresponde.",
    tipo: "clasificar",
    etiquetaFiltro: "Set",
    filtros: [
      ...gruposClasificacion.map((g) => ({ valor: g.id, texto: g.titulo, incluye: (p: Item) => p.grupo === g.id })),
      { ...todo, texto: "Todos mezclados" },
    ],
  },
  completar: {
    id: "completar",
    titulo: "Completar la frase",
    descripcion: "Elegí la palabra que falta. Sirve para fijar las formulaciones exactas.",
    tipo: "cloze",
    etiquetaFiltro: "¿Qué practicás?",
    filtros: porCapitulo,
  },
  casos: {
    id: "casos",
    titulo: "Casos prácticos",
    descripcion: "Organizaciones inventadas: ¿qué está pasando según la norma?",
    tipo: "caso",
    etiquetaFiltro: "Tipo de caso",
    filtros: [
      todo,
      { valor: "tratamiento", texto: "Opción de tratamiento", incluye: (p) => p.clausula === "6.5.2" },
      { valor: "principio", texto: "¿Qué principio?", incluye: (p) => p.clausula === "4" },
      { valor: "valoracion", texto: "Decisión de valoración", incluye: (p) => p.clausula === "6.4.4" },
      {
        valor: "etapa",
        texto: "Etapa del proceso o del marco",
        incluye: (p) => !["6.5.2", "4", "6.4.4"].includes(p.clausula),
      },
    ],
  },
  "que-clausula": {
    id: "que-clausula",
    titulo: "¿Qué cláusula es?",
    descripcion: "Te muestro una idea y elegís en qué cláusula está.",
    tipo: "clausula",
    etiquetaFiltro: "¿Qué practicás?",
    filtros: porCapitulo,
  },
};

const CANTIDADES = [
  { valor: 10, texto: "10" },
  { valor: 20, texto: "20" },
  { valor: 0, texto: "Todas" },
];

export default function ModoPreguntas({ config }: { config: ConfigModo }) {
  const progreso = useProgreso();
  const [filtro, setFiltro] = useState<string>(() => {
    const guardado = leer(`${config.id}.filtro`, config.filtros[0].valor);
    return config.filtros.some((f) => f.valor === guardado) ? guardado : config.filtros[0].valor;
  });
  const [cantidad, setCantidad] = useState<number>(() => leer(`${config.id}.cantidad`, 10));
  const [sesion, setSesion] = useState<{ items: Item[]; n: number } | null>(null);

  const actual = config.filtros.find((f) => f.valor === filtro) ?? config.filtros[0];
  const disponibles = preguntas.filter((p) => p.tipo === config.tipo && actual.incluye(p));
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
        <h1 className="text-xl font-semibold">{config.titulo}</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {config.descripcion} Primero salen las que nunca respondiste o fallaste.
        </p>
      </div>
      <Selector
        etiqueta={config.etiquetaFiltro}
        opciones={config.filtros.map((f) => ({ valor: f.valor, texto: f.texto }))}
        valor={actual.valor}
        onChange={(v) => {
          setFiltro(v);
          guardar(`${config.id}.filtro`, v);
        }}
      />
      <Selector
        etiqueta="¿Cuántas?"
        opciones={CANTIDADES}
        valor={cantidad}
        onChange={(v) => {
          setCantidad(v);
          guardar(`${config.id}.cantidad`, v);
        }}
      />
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {disponibles.length} preguntas · respondiste {respondidas.length}
        {respondidas.length > 0 && `, la última vez acertaste ${bien}`}
      </p>
      <button
        onClick={empezar}
        disabled={disponibles.length === 0}
        className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white disabled:opacity-50 dark:bg-sky-600"
      >
        Empezar
      </button>
      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}
