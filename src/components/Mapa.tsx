import { useEffect, useRef, useState } from "react";
import { estructura, tituloClausula } from "../content";
import { preguntasDe } from "../lib/practica";
import type { Bloque, Parte } from "../types";

const COLOR: Record<Bloque["id"], { bloque: string; parte: string }> = {
  principios: {
    bloque: "border-principios bg-principios-soft text-principios dark:bg-principios/15 dark:text-teal-300",
    parte: "border-principios/40 hover:bg-principios-soft dark:hover:bg-principios/20",
  },
  marco: {
    bloque: "border-marco bg-marco-soft text-marco dark:bg-marco/20 dark:text-indigo-300",
    parte: "border-marco/40 hover:bg-marco-soft dark:hover:bg-marco/25",
  },
  proceso: {
    bloque: "border-proceso bg-proceso-soft text-proceso dark:bg-proceso/20 dark:text-amber-300",
    parte: "border-proceso/40 hover:bg-proceso-soft dark:hover:bg-proceso/25",
  },
};

export default function Mapa() {
  const [abierto, setAbierto] = useState<Bloque["id"] | null>(null);
  const [ficha, setFicha] = useState<{ parte: Parte; bloque: Bloque } | null>(null);

  return (
    <section aria-labelledby="explorar" className="space-y-3">
      <div>
        <h1 id="explorar" className="text-xl font-semibold">Explorar la norma</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Tocá un bloque para ver sus partes y una parte para abrir su ficha.</p>
      </div>
      {estructura.map((b) => {
        const expandido = abierto === b.id;
        return (
          <div key={b.id}>
            <button
              onClick={() => setAbierto(expandido ? null : b.id)}
              aria-expanded={expandido}
              aria-controls={`partes-${b.id}`}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border-l-4 p-4 text-left ${COLOR[b.id].bloque}`}
            >
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide">Cap. {b.capitulo}</span>
                <span className="block text-lg font-semibold">{b.titulo}</span>
                <span className="block text-sm">
                  {b.centro ? `Centro: ${b.centro}` : "Etapas, dos barras laterales y una base"}
                </span>
              </span>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className={`h-5 w-5 shrink-0 transition-transform ${expandido ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {expandido && (
              <div id={`partes-${b.id}`} className="mt-2 space-y-2 px-1">
                <p className="text-sm text-stone-600 dark:text-stone-300">{b.resumen}</p>
                <ul className="grid grid-cols-2 gap-2">
                  {b.partes.map((p, i) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setFicha({ parte: p, bloque: b })}
                        className={`flex h-full min-h-14 w-full flex-col justify-center rounded-xl border bg-white px-3 py-2 text-left dark:bg-stone-900 ${COLOR[b.id].parte}`}
                      >
                        <span className="text-sm font-medium leading-tight">{p.titulo}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {/* Los ocho principios comparten la cláusula 4: se distinguen por su letra. */}
                          {b.id === "principios" ? `Principio ${"abcdefgh"[i]})` : p.clausula}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      {ficha && <Ficha {...ficha} onCerrar={() => setFicha(null)} />}
    </section>
  );
}

function Ficha({ parte, bloque, onCerrar }: { parte: Parte; bloque: Bloque; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const n = preguntasDe(parte.clausula).length;
  // Si la parte comparte la cláusula de todo el bloque (los principios), se practica el bloque entero.
  const textoPracticar = parte.clausula === bloque.clausula ? `Practicar todo el cap. ${bloque.capitulo}` : "Practicar esto";

  // <dialog> con showModal maneja el foco y la tecla Escape.
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="ficha-titulo"
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-white p-0 text-stone-900 backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:rounded-3xl dark:bg-stone-900 dark:text-stone-100"
    >
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {parte.clausula}
              {tituloClausula(parte.clausula) && tituloClausula(parte.clausula) !== parte.titulo
                ? ` · ${tituloClausula(parte.clausula)}`
                : ""}
            </p>
            <h2 id="ficha-titulo" className="text-xl font-semibold">
              {parte.titulo}
            </h2>
          </div>
          <button onClick={() => ref.current?.close()} aria-label="Cerrar ficha" className="rounded-full px-2 text-2xl leading-none">
            ×
          </button>
        </div>
        <p>{parte.resumen}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-300">
          {parte.puntos.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>
        <a
          href={`#/practicar/${encodeURIComponent(parte.clausula)}`}
          onClick={() => ref.current?.close()}
          className="block rounded-xl bg-sky-700 py-3 text-center font-semibold text-white dark:bg-sky-700"
        >
          {textoPracticar} · {n} preguntas
        </a>
      </div>
    </dialog>
  );
}
