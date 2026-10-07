import { useEffect, useMemo, useRef, useState } from "react";
import { NOMBRE_TIPO, gruposClasificacion, tituloClausula } from "../content";
import { mezclar } from "../lib/mezclar";
import type { Item } from "../types";

type Props = {
  item: Item;
  onRespondida: (ok: boolean) => void;
  onSiguiente: () => void;
  textoSiguiente?: string;
};

// Valor de cada opción tal como se compara con item.correcta.
export type Opcion = { valor: number | boolean; texto: string };

export function armarOpciones(item: Item): Opcion[] {
  if (item.tipo === "vf")
    return [
      { valor: true, texto: "Verdadero" },
      { valor: false, texto: "Falso" },
    ];
  const ops = (item.opciones ?? []).map((texto, valor) => ({ valor, texto }));
  // Las categorías del clasificador mantienen su orden; el resto se mezcla en cada intento.
  return item.tipo === "clasificar" ? ops : mezclar(ops);
}

const CONSIGNA: Partial<Record<Item["tipo"], string>> = {
  clausula: "¿En qué cláusula está?",
  cloze: "Completá el hueco",
};

export default function Pregunta({ item, onRespondida, onSiguiente, textoSiguiente = "Siguiente" }: Props) {
  const opciones = useMemo(() => armarOpciones(item), [item]);
  const [elegida, setElegida] = useState<number | boolean | null>(null);
  const siguienteRef = useRef<HTMLButtonElement>(null);
  const respondida = elegida !== null;
  const acerto = respondida && elegida === item.correcta;
  const grupo = item.grupo ? gruposClasificacion.find((g) => g.id === item.grupo) : undefined;
  const textoCorrecto = opciones.find((o) => o.valor === item.correcta)?.texto ?? "";

  function responder(valor: number | boolean) {
    if (respondida) return;
    setElegida(valor);
    onRespondida(valor === item.correcta);
  }

  useEffect(() => {
    if (respondida) siguienteRef.current?.focus();
  }, [respondida]);

  // Teclado: 1–4 para elegir, Enter para seguir.
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!respondida && n >= 1 && n <= opciones.length) responder(opciones[n - 1].valor);
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  const enunciado =
    item.tipo === "cloze" ? (
      <Hueco texto={item.enunciado} relleno={respondida ? textoCorrecto : null} />
    ) : (
      item.enunciado
    );

  return (
    <article className="space-y-4">
      <div className="space-y-1.5">
        <p className="flex flex-wrap gap-1.5 text-xs">
          <span className="chip bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">{NOMBRE_TIPO[item.tipo]}</span>
          {item.tags?.includes("trampa") && respondida && (
            <span className="chip bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">trampa</span>
          )}
        </p>
        {grupo && <p className="text-sm text-stone-500 dark:text-stone-400">{grupo.titulo}</p>}
        {CONSIGNA[item.tipo] && <p className="text-sm text-stone-500 dark:text-stone-400">{CONSIGNA[item.tipo]}</p>}
        <h2 className={`font-semibold leading-snug ${item.tipo === "clasificar" ? "text-xl" : "text-lg"}`}>{enunciado}</h2>
      </div>

      <ul className={item.tipo === "vf" ? "grid grid-cols-2 gap-2" : item.tipo === "cloze" ? "flex flex-wrap gap-2" : "space-y-2"}>
        {opciones.map((o, i) => {
          const esCorrecta = o.valor === item.correcta;
          const esElegida = o.valor === elegida;
          let estilo = "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900";
          if (respondida && esCorrecta)
            estilo = "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
          else if (respondida && esElegida)
            estilo = "border-rose-600 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200";
          else if (respondida) estilo += " opacity-60";
          return (
            <li key={String(o.valor)}>
              <button
                onClick={() => responder(o.valor)}
                disabled={respondida}
                className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                  item.tipo === "cloze" ? "" : "w-full"
                } ${estilo} ${
                  respondida ? "cursor-default" : "active:scale-[0.99]"
                }`}
              >
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs opacity-70"
                >
                  {respondida && esCorrecta ? "✓" : respondida && esElegida ? "✗" : i + 1}
                </span>
                <span>
                  {o.texto}
                  {/* En "¿qué cláusula es?", al responder se ve de qué trata cada opción */}
                  {item.tipo === "clausula" && respondida && tituloClausula(o.texto) && (
                    <span className="text-sm font-normal opacity-80"> · {tituloClausula(o.texto)}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {respondida && (
          <div
            className={`space-y-2 rounded-xl border-l-4 p-3 ${
              acerto
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-rose-600 bg-rose-50 dark:bg-rose-950/40"
            }`}
          >
            <p className="font-semibold">{acerto ? "¡Bien!" : `No. Era: ${textoCorrecto}`}</p>
            <p className="text-sm">{item.explicacion}</p>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {item.clausula}
              {tituloClausula(item.clausula) && item.clausula !== tituloClausula(item.clausula)
                ? ` · ${tituloClausula(item.clausula)}`
                : ""}
            </p>
          </div>
        )}
      </div>

      {respondida && (
        <button
          ref={siguienteRef}
          onClick={onSiguiente}
          className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700"
        >
          {textoSiguiente}
        </button>
      )}
    </article>
  );
}

function Hueco({ texto, relleno }: { texto: string; relleno: string | null }) {
  const [antes, despues] = texto.split("____");
  return (
    <>
      {antes}
      <span
        className={`mx-0.5 inline-block min-w-16 border-b-2 px-1 text-center ${
          relleno ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-stone-400"
        }`}
      >
        {relleno ?? <span className="sr-only">hueco</span>}
      </span>
      {despues}
    </>
  );
}
