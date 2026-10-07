import { useEffect, useState } from "react";
import { flashcards, mazos, tituloClausula } from "../../content";
import { mezclar } from "../../lib/mezclar";
import { cajaDe, moverCarta, useProgreso, type EstadoProgreso, type ResultadoCarta } from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import { guardar, leer } from "../../lib/storage";
import type { Flashcard } from "../../types";
import Selector from "../Selector";

const POR_SESION = 20;

// Leitner: primero la caja más baja y, dentro de cada caja, lo visto hace más tiempo.
function armarSesion(cartas: Flashcard[], progreso: EstadoProgreso): Flashcard[] {
  const elegidas = mezclar(cartas)
    .sort(
      (a, b) =>
        cajaDe(progreso, a.id) - cajaDe(progreso, b.id) ||
        (progreso.cartas[a.id]?.cuando ?? 0) - (progreso.cartas[b.id]?.cuando ?? 0),
    )
    .slice(0, POR_SESION);
  return mezclar(elegidas);
}

export default function Flashcards() {
  const progreso = useProgreso();
  const [mazo, setMazo] = useState<string>(() => leer("fc.mazo", "todos"));
  const [cola, setCola] = useState<Flashcard[] | null>(null);

  const delMazo = flashcards.filter((f) => mazo === "todos" || f.mazo === mazo);
  const cajas = [1, 2, 3].map((c) => delMazo.filter((f) => cajaDe(progreso, f.id) === c).length);

  if (cola) return <Repaso cola={cola} onTerminar={() => setCola(null)} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Flashcards</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Tres cajas. "La sabía" la sube de caja, "no la sabía" la vuelve a la 1. Las de la caja 1 salen más seguido.
        </p>
      </div>
      <Selector
        etiqueta="Mazo"
        opciones={[{ valor: "todos", texto: "Todos" }, ...mazos.map((m) => ({ valor: m.id, texto: m.titulo }))]}
        valor={mazo}
        onChange={(v) => {
          setMazo(v);
          guardar("fc.mazo", v);
        }}
      />
      <div className="grid grid-cols-3 gap-2 text-center">
        {cajas.map((n, i) => (
          <div key={i} className="tarjeta p-3">
            <p className="text-2xl font-bold tabular-nums">{n}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Caja {i + 1}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => setCola(armarSesion(delMazo, progreso))}
        className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-600"
      >
        Repasar {Math.min(POR_SESION, delMazo.length)} cartas
      </button>
      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}

function Repaso({ cola: inicial, onTerminar }: { cola: Flashcard[]; onTerminar: () => void }) {
  const progreso = useProgreso();
  const [cola, setCola] = useState(inicial);
  const [vista, setVista] = useState(0); // cuántas respuestas lleva la sesión
  const [volteada, setVolteada] = useState(false);
  const [conteo, setConteo] = useState({ sabia: 0, masomenos: 0, nosabia: 0 });
  const carta = cola[0];

  function responder(r: ResultadoCarta) {
    moverCarta(carta.id, r);
    setConteo((c) => ({ ...c, [r]: c[r] + 1 }));
    // La que no sabías vuelve al final de la cola de esta misma sesión.
    setCola((c) => (r === "nosabia" ? [...c.slice(1), c[0]] : c.slice(1)));
    setVolteada(false);
    setVista((v) => v + 1);
  }

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (!carta || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " && !volteada) {
        e.preventDefault();
        setVolteada(true);
      } else if (volteada && ["1", "2", "3"].includes(e.key)) {
        responder((["nosabia", "masomenos", "sabia"] as const)[Number(e.key) - 1]);
      }
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  if (!carta)
    return (
      <div className="space-y-4">
        <div className="tarjeta p-5 text-center">
          <p className="text-lg font-semibold">Listo el repaso</p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            La sabía: {conteo.sabia} · Más o menos: {conteo.masomenos} · No la sabía: {conteo.nosabia}
          </p>
        </div>
        <button onClick={onTerminar} className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-600">
          Volver a los mazos
        </button>
      </div>
    );

  const mazo = mazos.find((m) => m.id === carta.mazo);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
        <button onClick={onTerminar} className="underline-offset-2 hover:underline">
          Terminar
        </button>
        <span>
          Quedan {cola.length} · caja {cajaDe(progreso, carta.id)}
        </span>
      </div>

      <button
        key={vista}
        onClick={() => setVolteada((v) => !v)}
        aria-label={volteada ? "Ocultar respuesta" : "Mostrar respuesta"}
        className="tarjeta flex min-h-64 w-full flex-col justify-between p-5 text-left"
      >
        <span className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>{mazo?.titulo}</span>
          <span>
            {carta.clausula}
            {tituloClausula(carta.clausula) && carta.clausula !== tituloClausula(carta.clausula)
              ? ` · ${tituloClausula(carta.clausula)}`
              : ""}
          </span>
        </span>
        <span className="my-4 block text-xl font-semibold">{carta.frente}</span>
        <span aria-live="polite" className="block">
          {volteada ? (
            <span className="block border-t border-stone-200 pt-3 text-base dark:border-stone-700">{carta.dorso}</span>
          ) : (
            <span className="block text-sm text-stone-500 dark:text-stone-400">Tocá para ver la respuesta</span>
          )}
        </span>
      </button>

      {volteada && (
        <div className="grid grid-cols-3 gap-2">
          <BotonResultado onClick={() => responder("nosabia")} estilo="border-rose-600 text-rose-700 dark:text-rose-400">
            No la sabía
          </BotonResultado>
          <BotonResultado onClick={() => responder("masomenos")} estilo="border-amber-600 text-amber-700 dark:text-amber-400">
            Más o menos
          </BotonResultado>
          <BotonResultado onClick={() => responder("sabia")} estilo="border-emerald-600 text-emerald-700 dark:text-emerald-400">
            La sabía
          </BotonResultado>
        </div>
      )}
    </div>
  );
}

function BotonResultado(props: { onClick: () => void; estilo: string; children: string }) {
  return (
    <button onClick={props.onClick} className={`min-h-14 rounded-xl border-2 px-1 text-sm font-semibold ${props.estilo}`}>
      {props.children}
    </button>
  );
}
