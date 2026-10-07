import { useState, type ReactNode } from "react";
import { registrarRespuesta } from "../lib/progreso";
import type { Item } from "../types";
import Pregunta from "./Pregunta";

type Resultado = { item: Item; ok: boolean };

type Props = {
  titulo?: string; // si la pantalla que la contiene no tiene su propio h1
  items: Item[];
  onOtra?: () => void; // arma una sesión nueva con la misma configuración
  onSalir: () => void;
};

export default function Sesion({ titulo, items: iniciales, onOtra, onSalir }: Props) {
  const [items, setItems] = useState(iniciales);
  const [ronda, setRonda] = useState(0); // fuerza remontar al repetir errores
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  if (items.length === 0)
    return (
      <div className="tarjeta p-6 text-center">
        <p>No hay preguntas para esta selección.</p>
        <BotonSecundario onClick={onSalir}>Volver</BotonSecundario>
      </div>
    );

  const terminada = indice >= items.length;

  if (terminada) {
    const errores = resultados.filter((r) => !r.ok);
    const aciertos = resultados.length - errores.length;
    const pct = Math.round((aciertos / resultados.length) * 100);
    return (
      <div className="space-y-4">
        {titulo && <h1 className="text-sm font-semibold text-stone-600 dark:text-stone-400">{titulo}</h1>}
        <div className="tarjeta p-5 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400">Resultado</p>
          <p className="text-4xl font-bold tabular-nums">
            {aciertos}/{resultados.length}
          </p>
          <p className="text-stone-600 dark:text-stone-300">{pct}% de aciertos</p>
        </div>

        <div className="grid gap-2">
          {errores.length > 0 && (
            <button
              onClick={() => {
                setItems(errores.map((e) => e.item));
                setResultados([]);
                setIndice(0);
                setRonda((r) => r + 1);
              }}
              className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700"
            >
              Repetir las {errores.length} que fallé
            </button>
          )}
          {onOtra && <BotonSecundario onClick={onOtra}>Otra sesión</BotonSecundario>}
          <BotonSecundario onClick={onSalir}>Volver</BotonSecundario>
        </div>

        {errores.length > 0 && (
          <section aria-labelledby="revision">
            <h2 id="revision" className="mb-2 font-semibold">Para repasar</h2>
            <ul className="space-y-2">
              {errores.map(({ item }) => (
                <li key={item.id} className="tarjeta space-y-1 p-3 text-sm">
                  <p className="font-medium">{item.enunciado}</p>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    ✓ {item.tipo === "vf" ? (item.correcta ? "Verdadero" : "Falso") : item.opciones?.[item.correcta as number]}
                  </p>
                  <p className="text-stone-600 dark:text-stone-300">{item.explicacion}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const item = items[indice];
  return (
    <div className="space-y-4">
      {titulo && <h1 className="text-sm font-semibold text-stone-600 dark:text-stone-400">{titulo}</h1>}
      <div className="flex items-center gap-3">
        <button onClick={onSalir} className="text-sm text-stone-500 underline-offset-2 hover:underline dark:text-stone-400">
          Salir
        </button>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={indice}
          aria-label="Avance de la sesión"
        >
          <div className="h-full bg-sky-600 transition-all" style={{ width: `${(indice / items.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-stone-500 dark:text-stone-400">
          {indice + 1}/{items.length}
        </span>
      </div>
      <Pregunta
        key={`${ronda}-${indice}-${item.id}`}
        item={item}
        onRespondida={(ok) => {
          registrarRespuesta(item.id, ok);
          setResultados((r) => [...r, { item, ok }]);
        }}
        onSiguiente={() => setIndice((i) => i + 1)}
        textoSiguiente={indice + 1 === items.length ? "Ver resultado" : "Siguiente"}
      />
    </div>
  );
}

export function BotonSecundario({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 w-full rounded-xl border border-stone-300 py-3 font-medium first:mt-0 dark:border-stone-700"
    >
      {children}
    </button>
  );
}
