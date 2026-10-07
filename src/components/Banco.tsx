import { useMemo, useState } from "react";
import {
  NOMBRE_CAPITULO,
  NOMBRE_TIPO,
  estructura,
  flashcards,
  gruposClasificacion,
  mazos,
  preguntas,
  tituloClausula,
} from "../content";
import { leer, guardar } from "../lib/storage";
import type { Item, TipoItem } from "../types";

type Pestana = "preguntas" | "flashcards" | "fichas";

const CAPS = [0, 1, 2, 3, 4, 5, 6];
const TIPOS = Object.keys(NOMBRE_TIPO) as TipoItem[];
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Banco() {
  const [pestana, setPestanaEstado] = useState<Pestana>(() => leer("banco.pestana", "preguntas"));
  const setPestana = (p: Pestana) => {
    setPestanaEstado(p);
    guardar("banco.pestana", p);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Banco de contenido</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Para revisar y corregir. Cada ítem muestra su id: buscalo en <code>src/content/</code> para editarlo.
        </p>
      </div>

      <div role="tablist" className="flex gap-1 rounded-full bg-stone-200 p-1 dark:bg-stone-800">
        {(["preguntas", "flashcards", "fichas"] as Pestana[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`flex-1 rounded-full py-1.5 text-sm capitalize ${
              pestana === p ? "bg-white font-semibold shadow-sm dark:bg-stone-950" : "text-stone-600 dark:text-stone-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {pestana === "preguntas" && <ListaPreguntas />}
      {pestana === "flashcards" && <ListaFlashcards />}
      {pestana === "fichas" && <ListaFichas />}
    </div>
  );
}

function ListaPreguntas() {
  const [cap, setCap] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoItem | null>(null);
  const [soloTrampas, setSoloTrampas] = useState(false);
  const [texto, setTexto] = useState("");

  const visibles = useMemo(() => {
    const q = normalizar(texto.trim());
    return preguntas.filter(
      (p) =>
        (cap === null || p.capitulo === cap) &&
        (tipo === null || p.tipo === tipo) &&
        (!soloTrampas || p.tags?.includes("trampa")) &&
        (!q || normalizar([p.id, p.clausula, p.enunciado, ...(p.opciones ?? []), p.explicacion].join(" ")).includes(q)),
    );
  }, [cap, tipo, soloTrampas, texto]);

  return (
    <div className="space-y-3">
      <Resumen />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por texto, id o cláusula…"
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
      />
      <Filtro
        etiqueta="Capítulo"
        opciones={CAPS.map((c) => ({ valor: c, texto: NOMBRE_CAPITULO[c] }))}
        valor={cap}
        onChange={setCap}
      />
      <Filtro
        etiqueta="Tipo"
        opciones={TIPOS.map((t) => ({ valor: t, texto: NOMBRE_TIPO[t] }))}
        valor={tipo}
        onChange={setTipo}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={soloTrampas} onChange={(e) => setSoloTrampas(e.target.checked)} className="h-4 w-4" />
        Solo preguntas trampa
      </label>
      <p className="text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
        {visibles.length} de {preguntas.length}
      </p>
      <ul className="space-y-3">
        {visibles.map((p) => (
          <li key={p.id}>
            <TarjetaPregunta item={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Resumen() {
  const grupos = [
    { texto: "Caps. 0–3", n: preguntas.filter((p) => p.capitulo <= 3).length, meta: 10 },
    { texto: "Cap. 4", n: preguntas.filter((p) => p.capitulo === 4).length, meta: 15 },
    { texto: "Cap. 5", n: preguntas.filter((p) => p.capitulo === 5).length, meta: 30 },
    { texto: "Cap. 6", n: preguntas.filter((p) => p.capitulo === 6).length, meta: 45 },
  ];
  return (
    <div className="tarjeta grid grid-cols-4 divide-x divide-stone-200 text-center dark:divide-stone-800">
      {grupos.map((g) => (
        <div key={g.texto} className="px-1 py-2">
          <p className="text-lg font-semibold tabular-nums">{g.n}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{g.texto}</p>
          <p className="text-[11px] tabular-nums text-stone-500 dark:text-stone-400">
            {Math.round((g.n / preguntas.length) * 100)}% · meta {g.meta}%
          </p>
        </div>
      ))}
    </div>
  );
}

function Filtro<T extends string | number>(props: {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  valor: T | null;
  onChange: (v: T | null) => void;
}) {
  const boton = (activo: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-sm ${
      activo
        ? "border-sky-700 bg-sky-700 text-white dark:border-sky-500 dark:bg-sky-700"
        : "border-stone-300 dark:border-stone-700"
    }`;
  return (
    <div role="group" aria-label={props.etiqueta} className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <span className="w-16 shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400">{props.etiqueta}</span>
      <button className={boton(props.valor === null)} onClick={() => props.onChange(null)} aria-pressed={props.valor === null}>
        Todos
      </button>
      {props.opciones.map((o) => (
        <button
          key={o.valor}
          className={boton(props.valor === o.valor)}
          onClick={() => props.onChange(o.valor)}
          aria-pressed={props.valor === o.valor}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

function TarjetaPregunta({ item }: { item: Item }) {
  const grupo = item.grupo ? gruposClasificacion.find((g) => g.id === item.grupo) : undefined;
  return (
    <article className="tarjeta space-y-2 p-3">
      <header className="flex flex-wrap items-center gap-1.5">
        <code className="text-xs text-stone-500 dark:text-stone-400">{item.id}</code>
        <span className="chip bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">{NOMBRE_TIPO[item.tipo]}</span>
        <span className="chip bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300" title={tituloClausula(item.clausula)}>
          {item.clausula}
        </span>
        <span className="chip text-stone-500 dark:text-stone-400" aria-label={`Dificultad ${item.dificultad} de 3`}>
          {"●".repeat(item.dificultad)}
          <span className="opacity-30">{"●".repeat(3 - item.dificultad)}</span>
        </span>
        {item.tags?.map((t) => (
          <span
            key={t}
            className={`chip ${
              t === "trampa"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
            }`}
          >
            {t}
          </span>
        ))}
      </header>

      {grupo && <p className="text-xs text-stone-500 dark:text-stone-400">{grupo.titulo}</p>}
      <p className="font-medium">{item.enunciado}</p>

      {item.tipo === "vf" ? (
        <p className="text-sm">
          Respuesta:{" "}
          <strong className="text-emerald-700 dark:text-emerald-400">{item.correcta ? "Verdadero" : "Falso"}</strong>
        </p>
      ) : (
        <ul className="space-y-1 text-sm">
          {item.opciones?.map((o, i) => {
            const ok = i === item.correcta;
            return (
              <li
                key={i}
                className={`flex gap-2 rounded-lg px-2 py-1 ${
                  ok ? "bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : ""
                }`}
              >
                <span aria-hidden className="w-4 shrink-0">{ok ? "✓" : "·"}</span>
                <span>
                  {o}
                  {ok && <span className="sr-only"> (correcta)</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="rounded-lg bg-stone-100 px-2 py-1.5 text-sm text-stone-700 dark:bg-stone-800/70 dark:text-stone-300">
        {item.explicacion}
      </p>
    </article>
  );
}

function ListaFlashcards() {
  return (
    <div className="space-y-5">
      {mazos.map((m) => {
        const cartas = flashcards.filter((f) => f.mazo === m.id);
        return (
          <section key={m.id} aria-labelledby={`mazo-${m.id}`}>
            <h2 id={`mazo-${m.id}`} className="font-semibold">
              {m.titulo} <span className="font-normal text-stone-500 dark:text-stone-400">· {cartas.length}</span>
            </h2>
            <p className="mb-2 text-sm text-stone-500 dark:text-stone-400">{m.descripcion}</p>
            <ul className="space-y-2">
              {cartas.map((f) => (
                <li key={f.id} className="tarjeta p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <code className="text-xs text-stone-500 dark:text-stone-400">{f.id}</code>
                    <span className="chip bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">{f.clausula}</span>
                  </div>
                  <p className="font-medium">{f.frente}</p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{f.dorso}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ListaFichas() {
  return (
    <div className="space-y-5">
      {estructura.map((b) => (
        <section key={b.id} aria-labelledby={`bloque-${b.id}`}>
          <h2 id={`bloque-${b.id}`} className="font-semibold">
            {b.titulo} <span className="font-normal text-stone-500 dark:text-stone-400">· cap. {b.capitulo}</span>
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">{b.resumen}</p>
          {b.centro && <p className="text-sm text-stone-500 dark:text-stone-400">Centro de la figura: {b.centro}</p>}
          <ul className="mt-2 space-y-2">
            {b.partes.map((p) => (
              <li key={p.id} className="tarjeta p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="font-medium">{p.titulo}</span>
                  <span className="chip bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">{p.clausula}</span>
                </div>
                <p className="text-sm">{p.resumen}</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-stone-600 dark:text-stone-300">
                  {p.puntos.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
