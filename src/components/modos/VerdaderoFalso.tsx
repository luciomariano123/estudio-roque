import { useEffect, useRef, useState } from "react";
import { preguntas } from "../../content";
import { mezclar } from "../../lib/mezclar";
import { registrarPuntajeVF, registrarRespuesta, useProgreso } from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import type { Item } from "../../types";

const DURACION = 60_000;
const banco = () => preguntas.filter((p) => p.tipo === "vf");

type Partida = {
  cola: Item[];
  indice: number;
  puntaje: number;
  racha: number;
  mejorRacha: number;
  aciertos: number;
  falladas: Item[];
};

const nueva = (): Partida => ({ cola: mezclar(banco()), indice: 0, puntaje: 0, racha: 0, mejorRacha: 0, aciertos: 0, falladas: [] });

export default function VerdaderoFalso() {
  const { recordVF } = useProgreso();
  const [fase, setFase] = useState<"inicio" | "jugando" | "fin">("inicio");
  const [partida, setPartida] = useState(nueva);
  const [restante, setRestante] = useState(DURACION);
  const [destello, setDestello] = useState<{ ok: boolean; n: number } | null>(null);
  const inicio = useRef(0);
  const recordPrevio = useRef(recordVF);

  // Reloj: se calcula contra la hora de inicio para no acumular desfasajes.
  useEffect(() => {
    if (fase !== "jugando") return;
    const t = setInterval(() => {
      const r = Math.max(0, DURACION - (Date.now() - inicio.current));
      setRestante(r);
      if (r === 0) setFase("fin");
    }, 100);
    return () => clearInterval(t);
  }, [fase]);

  useEffect(() => {
    if (fase === "fin") registrarPuntajeVF(partida.puntaje);
  }, [fase, partida.puntaje]);

  function empezar() {
    recordPrevio.current = recordVF;
    setPartida(nueva());
    setRestante(DURACION);
    inicio.current = Date.now();
    setFase("jugando");
  }

  function responder(valor: boolean) {
    if (fase !== "jugando") return;
    const item = partida.cola[partida.indice];
    const ok = item.correcta === valor;
    registrarRespuesta(item.id, ok);
    const racha = ok ? partida.racha + 1 : 0;
    const siguiente: Partida = {
      ...partida,
      indice: partida.indice + 1,
      racha,
      puntaje: partida.puntaje + (ok ? racha : 0), // cada acierto suma lo que vale la racha
      mejorRacha: Math.max(partida.mejorRacha, racha),
      aciertos: partida.aciertos + (ok ? 1 : 0),
      falladas: ok ? partida.falladas : [...partida.falladas, item],
    };
    setPartida(siguiente);
    setDestello({ ok, n: Date.now() });
    if (siguiente.indice >= siguiente.cola.length) setFase("fin");
  }

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "v" || k === "arrowleft") responder(true);
      if (k === "f" || k === "arrowright") responder(false);
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  if (fase === "inicio")
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Verdadero o falso</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Tenés 60 segundos. Cada acierto suma lo que vale tu racha: el primero 1, el segundo 2, el tercero 3… Un error
            la corta.
          </p>
        </div>
        <div className="tarjeta p-4 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400">Tu récord</p>
          <p className="text-3xl font-bold tabular-nums">{recordVF}</p>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">Con teclado: V o ← para verdadero, F o → para falso.</p>
        <button onClick={empezar} className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700">
          Empezar
        </button>
        <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
          Volver al inicio
        </button>
      </div>
    );

  if (fase === "fin") {
    const respondidas = partida.indice;
    const esRecord = partida.puntaje > recordPrevio.current;
    return (
      <div className="space-y-4">
        <div className="tarjeta p-5 text-center">
          {esRecord && <p className="font-semibold text-amber-600 dark:text-amber-400">¡Nuevo récord!</p>}
          <p className="text-sm text-stone-500 dark:text-stone-400">Puntaje</p>
          <p className="text-5xl font-bold tabular-nums">{partida.puntaje}</p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            {partida.aciertos}/{respondidas} bien · mejor racha {partida.mejorRacha}
          </p>
        </div>
        <button onClick={empezar} className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700">
          Jugar otra vez
        </button>
        <button onClick={() => setFase("inicio")} className="w-full rounded-xl border border-stone-300 py-3 font-medium dark:border-stone-700">
          Volver
        </button>
        {partida.falladas.length > 0 && (
          <section aria-labelledby="falladas">
            <h2 id="falladas" className="mb-2 font-semibold">Las que fallaste</h2>
            <ul className="space-y-2">
              {partida.falladas.map((it) => (
                <li key={it.id} className="tarjeta space-y-1 p-3 text-sm">
                  <p className="font-medium">{it.enunciado}</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Es {it.correcta ? "verdadero" : "falso"}.
                  </p>
                  <p className="text-stone-600 dark:text-stone-300">{it.explicacion}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const item = partida.cola[partida.indice];
  const segundos = Math.ceil(restante / 1000);
  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col gap-4">
      <h1 className="sr-only">Verdadero o falso</h1>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400">Puntaje</p>
          <p className="text-2xl font-bold tabular-nums">{partida.puntaje}</p>
        </div>
        <p
          className={`text-3xl font-bold tabular-nums ${segundos <= 10 ? "text-rose-600 dark:text-rose-400" : ""}`}
          aria-label={`Quedan ${segundos} segundos`}
        >
          {segundos}s
        </p>
        <div className="text-right">
          <p className="text-xs text-stone-500 dark:text-stone-400">Racha</p>
          <p className="text-2xl font-bold tabular-nums">{partida.racha}</p>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" aria-hidden>
        <div className="h-full bg-sky-600" style={{ width: `${(restante / DURACION) * 100}%` }} />
      </div>

      <div
        key={destello?.n}
        className={`tarjeta flex flex-1 items-center p-5 transition-colors ${
          destello ? (destello.ok ? "animate-[ok_.35s]" : "animate-[mal_.35s]") : ""
        }`}
      >
        <p className="text-xl font-semibold leading-snug">{item.enunciado}</p>
      </div>
      <p className="sr-only" aria-live="assertive">
        {destello ? (destello.ok ? "Bien" : "Mal") : ""}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => responder(true)}
          className="min-h-20 rounded-2xl bg-emerald-700 text-lg font-bold text-white active:scale-[0.98]"
        >
          Verdadero
        </button>
        <button
          onClick={() => responder(false)}
          className="min-h-20 rounded-2xl bg-rose-700 text-lg font-bold text-white active:scale-[0.98]"
        >
          Falso
        </button>
      </div>
    </div>
  );
}
