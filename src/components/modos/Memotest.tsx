import { useEffect, useRef, useState } from "react";
import { memotest } from "../../content";
import { mezclar } from "../../lib/mezclar";
import { marcarDia } from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import { guardar, leer } from "../../lib/storage";
import type { ParMemotest, SetMemotest } from "../../types";
import Selector from "../Selector";

const PARES_POR_RONDA = 6;

type Carta = { clave: string; par: string; texto: string; lado: "a" | "b" };

function armarRonda(set: SetMemotest) {
  const pares = mezclar(set.pares).slice(0, PARES_POR_RONDA);
  const cartas: Carta[] = mezclar(
    pares.flatMap((p) => [
      { clave: p.id + "a", par: p.id, texto: p.a, lado: "a" as const },
      { clave: p.id + "b", par: p.id, texto: p.b, lado: "b" as const },
    ]),
  );
  return { pares, cartas };
}

export default function Memotest() {
  const [setId, setSetId] = useState<string>(() => leer("memo.set", memotest[0].id));
  const [ronda, setRonda] = useState<{ pares: ParMemotest[]; cartas: Carta[]; n: number } | null>(null);
  const set = memotest.find((s) => s.id === setId) ?? memotest[0];

  if (ronda)
    return (
      <Tablero
        key={ronda.n}
        pares={ronda.pares}
        cartas={ronda.cartas}
        onOtra={() => setRonda((r) => ({ ...armarRonda(set), n: (r?.n ?? 0) + 1 }))}
        onSalir={() => setRonda(null)}
      />
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Memotest</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {PARES_POR_RONDA} parejas boca abajo. Das vuelta dos cartas por turno: si son pareja, quedan a la vista.
        </p>
      </div>
      <Selector
        etiqueta="Parejas"
        opciones={memotest.map((s) => ({ valor: s.id, texto: s.titulo }))}
        valor={set.id}
        onChange={(v) => {
          setSetId(v);
          guardar("memo.set", v);
        }}
      />
      <button
        onClick={() => setRonda({ ...armarRonda(set), n: 0 })}
        className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700"
      >
        Jugar
      </button>
      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}

function Tablero(props: { pares: ParMemotest[]; cartas: Carta[]; onOtra: () => void; onSalir: () => void }) {
  const [abiertas, setAbiertas] = useState<number[]>([]);
  const [encontrados, setEncontrados] = useState<string[]>([]);
  const [turnos, setTurnos] = useState(0);
  const [aviso, setAviso] = useState("");
  const espera = useRef<number>();
  const terminado = encontrados.length === props.pares.length;

  useEffect(() => () => clearTimeout(espera.current), []);
  useEffect(() => {
    if (terminado) marcarDia();
  }, [terminado]);

  function tocar(i: number) {
    const c = props.cartas[i];
    if (abiertas.length === 2 || abiertas.includes(i) || encontrados.includes(c.par)) return;
    const nuevas = [...abiertas, i];
    setAbiertas(nuevas);
    if (nuevas.length < 2) {
      setAviso(c.texto);
      return;
    }
    setTurnos((t) => t + 1);
    const otra = props.cartas[nuevas[0]];
    if (otra.par === c.par) {
      setEncontrados((e) => [...e, c.par]);
      setAbiertas([]);
      setAviso(`${c.texto}. ¡Pareja!`);
    } else {
      setAviso(`${c.texto}. No son pareja.`);
      espera.current = window.setTimeout(() => setAbiertas([]), 1100);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Memotest</h1>
      <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
        <button onClick={props.onSalir} className="underline-offset-2 hover:underline">
          Salir
        </button>
        <span className="tabular-nums">
          {encontrados.length}/{props.pares.length} parejas · {turnos} turnos
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {aviso}
      </p>

      <ul className="grid grid-cols-3 gap-2">
        {props.cartas.map((c, i) => {
          const visible = abiertas.includes(i) || encontrados.includes(c.par);
          const lista = encontrados.includes(c.par);
          return (
            <li key={c.clave}>
              <button
                onClick={() => tocar(i)}
                aria-label={visible ? c.texto : `Carta ${i + 1}, boca abajo`}
                aria-pressed={visible}
                className={`flex h-28 w-full items-center justify-center rounded-xl border-2 p-1.5 text-center transition-colors ${
                  lista
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                    : visible
                      ? "border-sky-600 bg-white dark:bg-stone-900"
                      : "border-transparent bg-sky-700 text-white dark:bg-sky-800"
                }`}
              >
                {visible ? (
                  <span className={c.lado === "a" ? "text-sm font-semibold" : "text-xs leading-snug"}>{c.texto}</span>
                ) : (
                  <span aria-hidden className="text-2xl opacity-70">
                    ?
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {terminado && (
        <div className="space-y-3">
          <div className="tarjeta p-4 text-center">
            <p className="text-lg font-semibold">¡Completo!</p>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {turnos} turnos (lo mínimo posible son {props.pares.length})
            </p>
          </div>
          <button onClick={props.onOtra} className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700">
            Otra ronda
          </button>
          <ul className="space-y-1 text-sm">
            {props.pares.map((p) => (
              <li key={p.id} className="tarjeta p-2">
                <strong>{p.a}</strong> — {p.b} <span className="text-stone-500 dark:text-stone-400">({p.clausula})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
