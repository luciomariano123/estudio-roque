import { useState } from "react";
import { flashcards, preguntas, tituloClausula } from "../../content";
import { mezclar } from "../../lib/mezclar";
import { cajaDe, racha, resetearProgreso, useProgreso } from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import type { Item } from "../../types";
import Sesion from "../Sesion";

const GRUPOS = [
  { texto: "Caps. 1–3 · Objeto y términos", incluye: (p: Item) => p.capitulo <= 3 },
  { texto: "Cap. 4 · Principios", incluye: (p: Item) => p.capitulo === 4 },
  { texto: "Cap. 5 · Marco", incluye: (p: Item) => p.capitulo === 5 },
  { texto: "Cap. 6 · Proceso", incluye: (p: Item) => p.capitulo === 6 },
];

export default function Progreso() {
  const progreso = useProgreso();
  const [repaso, setRepaso] = useState<{ items: Item[]; n: number } | null>(null);
  const [confirmarReset, setConfirmarReset] = useState(false);

  // Dominio = preguntas cuya última respuesta fue correcta, sobre el total del capítulo.
  const dominada = (p: Item) => progreso.items[p.id]?.ultima === true;
  const errores = preguntas.filter((p) => progreso.items[p.id]?.ultima === false);
  const respondidas = preguntas.filter((p) => progreso.items[p.id]).length;
  const dominioTotal = preguntas.filter(dominada).length / preguntas.length;
  const diasRacha = racha(progreso.dias);
  const cajas = [1, 2, 3].map((c) => flashcards.filter((f) => cajaDe(progreso, f.id) === c).length);

  const flojas = Object.entries(
    errores.reduce<Record<string, number>>((acc, p) => ((acc[p.clausula] = (acc[p.clausula] ?? 0) + 1), acc), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const armarRepaso = () => setRepaso((r) => ({ items: mezclar(errores), n: (r?.n ?? 0) + 1 }));

  if (repaso)
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Repasar mis errores</h1>
        <Sesion key={repaso.n} items={repaso.items} onSalir={() => setRepaso(null)} />
      </div>
    );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Tu progreso</h1>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Dato valor={`${Math.round(dominioTotal * 100)}%`} texto="dominio total" />
        <Dato valor={String(diasRacha)} texto={diasRacha === 1 ? "día de racha" : "días de racha"} />
        <Dato valor={String(respondidas)} texto={`de ${preguntas.length} vistas`} />
      </div>

      <button
        onClick={armarRepaso}
        disabled={errores.length === 0}
        className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white disabled:bg-stone-300 disabled:text-stone-600 dark:bg-sky-700 dark:disabled:bg-stone-800 dark:disabled:text-stone-400"
      >
        {errores.length ? `Repasar mis errores (${errores.length})` : "No tenés errores pendientes"}
      </button>

      <section aria-labelledby="dominio">
        <h2 id="dominio" className="mb-2 font-semibold">Dominio por capítulo</h2>
        <ul className="tarjeta divide-y divide-stone-200 dark:divide-stone-800">
          {GRUPOS.map((g) => {
            const del = preguntas.filter(g.incluye);
            const ok = del.filter(dominada).length;
            const vistas = del.filter((p) => progreso.items[p.id]).length;
            const pct = Math.round((ok / del.length) * 100);
            return (
              <li key={g.texto} className="space-y-1.5 px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{g.texto}</span>
                  <span className="text-sm font-semibold tabular-nums">{pct}%</span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Dominio ${g.texto}`}
                >
                  <div className="h-full rounded-full bg-sky-600" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {ok} dominadas · {vistas} vistas · {del.length} en total
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
          Una pregunta cuenta como dominada si la última vez que la respondiste acertaste.
        </p>
      </section>

      {flojas.length > 0 && (
        <section aria-labelledby="flojas">
          <h2 id="flojas" className="mb-2 font-semibold">Dónde más fallás</h2>
          <ul className="tarjeta divide-y divide-stone-200 dark:divide-stone-800">
            {flojas.map(([cl, n]) => (
              <li key={cl}>
                <a href={`#/practicar/${encodeURIComponent(cl)}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm">
                    <strong>{cl}</strong>
                    {tituloClausula(cl) && tituloClausula(cl) !== cl && ` · ${tituloClausula(cl)}`}
                  </span>
                  <span className="shrink-0 text-sm text-rose-700 dark:text-rose-400">
                    {n} {n === 1 ? "error" : "errores"} →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="otros">
        <h2 id="otros" className="mb-2 font-semibold">Flashcards y juegos</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          {cajas.map((n, i) => (
            <Dato key={i} valor={String(n)} texto={`en caja ${i + 1}`} />
          ))}
        </div>
        <ul className="tarjeta mt-2 divide-y divide-stone-200 text-sm dark:divide-stone-800">
          <li className="flex justify-between px-4 py-2.5">
            <span>Récord en verdadero o falso</span>
            <span className="font-semibold tabular-nums">{progreso.recordVF}</span>
          </li>
          <li className="flex justify-between px-4 py-2.5">
            <span>Simulacros hechos</span>
            <span className="font-semibold tabular-nums">{progreso.simulacros.length}</span>
          </li>
          {progreso.simulacros.length > 0 && (
            <li className="flex justify-between px-4 py-2.5">
              <span>Mejor simulacro</span>
              <span className="font-semibold tabular-nums">
                {Math.max(...progreso.simulacros.map((s) => Math.round((s.aciertos / s.total) * 100)))}%
              </span>
            </li>
          )}
          <li className="flex justify-between px-4 py-2.5">
            <span>Días con actividad</span>
            <span className="font-semibold tabular-nums">{progreso.dias.length}</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="borrar" className="space-y-2 pt-2">
        <h2 id="borrar" className="sr-only">Borrar progreso</h2>
        {confirmarReset ? (
          <div className="space-y-2 rounded-xl bg-rose-50 p-3 dark:bg-rose-950/40" role="alert">
            <p className="text-sm font-medium">
              Se borran tus respuestas, las cajas de las flashcards, la racha, los récords y un simulacro sin terminar. No
              se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  resetearProgreso();
                  setConfirmarReset(false);
                }}
                className="rounded-xl bg-rose-700 py-2.5 font-semibold text-white"
              >
                Sí, borrar todo
              </button>
              <button
                onClick={() => setConfirmarReset(false)}
                className="rounded-xl border border-stone-300 py-2.5 font-medium dark:border-stone-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmarReset(true)}
            className="w-full rounded-xl border border-rose-300 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-800 dark:text-rose-400"
          >
            Borrar mi progreso
          </button>
        )}
      </section>

      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}

function Dato({ valor, texto }: { valor: string; texto: string }) {
  return (
    <div className="tarjeta px-1 py-3">
      <p className="text-2xl font-bold tabular-nums">{valor}</p>
      <p className="text-xs text-stone-600 dark:text-stone-400">{texto}</p>
    </div>
  );
}
