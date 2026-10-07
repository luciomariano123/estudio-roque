import { estructura, flashcards, preguntas } from "../content";
import { MODOS } from "../modos";

const COLOR: Record<string, string> = {
  principios: "border-principios bg-principios-soft text-principios dark:bg-principios/15 dark:text-teal-300",
  marco: "border-marco bg-marco-soft text-marco dark:bg-marco/20 dark:text-indigo-300",
  proceso: "border-proceso bg-proceso-soft text-proceso dark:bg-proceso/20 dark:text-amber-300",
};

export default function Inicio() {
  return (
    <div className="space-y-6">
      <section aria-labelledby="estructura">
        <h1 id="estructura" className="mb-3 text-xl font-semibold">La norma en tres bloques</h1>
        <div className="grid gap-3 sm:grid-cols-3">
          {estructura.map((b) => (
            <div key={b.id} className={`rounded-2xl border-l-4 p-4 ${COLOR[b.id]}`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">Cap. {b.capitulo}</p>
              <p className="text-lg font-semibold">{b.titulo}</p>
              <p className="mt-1 text-sm opacity-90">{b.centro ? `Centro: ${b.centro}` : "Sin centro: etapas, dos barras laterales y una base"}</p>
              <p className="mt-1 text-xs opacity-75">{b.partes.length} partes</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          El mapa interactivo con las fichas llega en la Fase 2.
        </p>
      </section>

      <section aria-labelledby="modos">
        <h2 id="modos" className="mb-3 text-lg font-semibold">Modos de estudio</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MODOS.map((m) => (
            <li key={m.id}>
              <a href={`#/modo/${m.id}`} className="tarjeta flex h-full items-start justify-between gap-3 p-3">
                <span>
                  <span className="block font-medium">{m.titulo}</span>
                  <span className="block text-sm text-stone-500 dark:text-stone-400">{m.descripcion}</span>
                </span>
                <span className="chip shrink-0 bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  Fase {m.fase}
                </span>
              </a>
            </li>
          ))}
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
