import { flashcards, preguntas } from "../content";
import { FASE_ACTUAL, MODOS } from "../modos";
import Mapa from "./Mapa";

export default function Inicio() {
  return (
    <div className="space-y-6">
      <Mapa />

      <section aria-labelledby="modos">
        <h2 id="modos" className="mb-3 text-lg font-semibold">Modos de estudio</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MODOS.map((m) => {
            const listo = m.fase <= FASE_ACTUAL;
            return (
              <li key={m.id}>
                <a
                  href={`#/modo/${m.id}`}
                  className={`tarjeta flex h-full items-start justify-between gap-3 p-3 ${listo ? "" : "opacity-60"}`}
                >
                  <span>
                    <span className="block font-medium">{m.titulo}</span>
                    <span className="block text-sm text-stone-500 dark:text-stone-400">{m.descripcion}</span>
                  </span>
                  {!listo && (
                    <span className="chip shrink-0 bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                      Fase {m.fase}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <a href="#/banco" className="tarjeta block p-4">
        <span className="block font-medium">Revisar el banco de contenido →</span>
        <span className="block text-sm text-stone-500 dark:text-stone-400">
          {preguntas.length} preguntas · {flashcards.length} flashcards · fichas del mapa
        </span>
      </a>
    </div>
  );
}
