import { useEffect, useMemo, useRef, useState } from "react";
import { NOMBRE_TIPO, preguntas } from "../../content";
import { mezclar } from "../../lib/mezclar";
import {
  CLAVE_SIMULACRO,
  registrarRespuesta,
  registrarSimulacro,
  useProgreso,
} from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import { borrar, guardar, leer } from "../../lib/storage";
import type { Item } from "../../types";
import { armarOpciones } from "../Pregunta";
import Sesion from "../Sesion";

const DURACION = 30 * 60_000;
const TIPOS: Item["tipo"][] = ["mc", "vf", "caso", "clausula", "cloze"];

// Mismo reparto que el banco: ~10 % caps. 1–3, 15 % principios, 30 % marco, 45 % proceso.
const GRUPOS = [
  { texto: "Caps. 1–3", cupo: 3, incluye: (p: Item) => p.capitulo <= 3 },
  { texto: "Principios", cupo: 5, incluye: (p: Item) => p.capitulo === 4 },
  { texto: "Marco", cupo: 9, incluye: (p: Item) => p.capitulo === 5 },
  { texto: "Proceso", cupo: 13, incluye: (p: Item) => p.capitulo === 6 },
];

type Valor = number | boolean;
type EnCurso = {
  ids: string[];
  ordenes: Record<string, Valor[]>; // orden de las opciones, fijo durante todo el examen
  respuestas: Record<string, Valor>;
  inicio: number;
};

const porId = new Map(preguntas.map((p) => [p.id, p]));

function armar(): EnCurso {
  const candidatas = preguntas.filter((p) => TIPOS.includes(p.tipo));
  const elegidas = mezclar(GRUPOS.flatMap((g) => mezclar(candidatas.filter(g.incluye)).slice(0, g.cupo)));
  return {
    ids: elegidas.map((p) => p.id),
    ordenes: Object.fromEntries(elegidas.map((p) => [p.id, armarOpciones(p).map((o) => o.valor)])),
    respuestas: {},
    inicio: Date.now(),
  };
}

function cargarEnCurso(): EnCurso | null {
  const e = leer<EnCurso | null>(CLAVE_SIMULACRO, null);
  if (!e || !Array.isArray(e.ids) || typeof e.inicio !== "number" || !e.ordenes || !e.respuestas) return null;
  const ids = e.ids.filter((id) => porId.has(id)); // por si cambió el banco
  return ids.length ? { ...e, ids } : null;
}

const textoDe = (p: Item, v: Valor | undefined) =>
  v === undefined ? "Sin responder" : p.tipo === "vf" ? (v ? "Verdadero" : "Falso") : (p.opciones?.[v as number] ?? "");

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

type Resultado = { examen: EnCurso; fin: number };

export default function Simulacro() {
  const [pendiente, setPendiente] = useState<EnCurso | null>(cargarEnCurso);
  const [examen, setExamen] = useState<EnCurso | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function empezar() {
    const nuevo = armar();
    guardar(CLAVE_SIMULACRO, nuevo);
    setPendiente(null);
    setResultado(null);
    setExamen(nuevo);
  }

  function entregar(e: EnCurso) {
    const items = e.ids.map((id) => porId.get(id)!);
    let aciertos = 0;
    for (const p of items) {
      const r = e.respuestas[p.id];
      if (r === undefined) continue; // lo no respondido cuenta como error en la nota, pero no ensucia el progreso
      registrarRespuesta(p.id, r === p.correcta);
      if (r === p.correcta) aciertos++;
    }
    registrarSimulacro(aciertos, items.length);
    borrar(CLAVE_SIMULACRO);
    setExamen(null);
    setResultado({ examen: e, fin: Math.min(Date.now(), e.inicio + DURACION) });
  }

  if (resultado) return <Resultados {...resultado} onOtro={empezar} />;
  if (examen) return <Examen inicial={examen} onEntregar={entregar} />;
  return (
    <Portada
      pendiente={pendiente}
      onEmpezar={empezar}
      onContinuar={() => {
        setExamen(pendiente);
        setPendiente(null);
      }}
      onDescartar={() => {
        borrar(CLAVE_SIMULACRO);
        setPendiente(null);
      }}
    />
  );
}

function Portada(props: {
  pendiente: EnCurso | null;
  onEmpezar: () => void;
  onContinuar: () => void;
  onDescartar: () => void;
}) {
  const { simulacros } = useProgreso();
  const ultimos = simulacros.slice(-5).reverse();
  const p = props.pendiente;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Simulacro de examen</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          30 preguntas mezcladas en 30 minutos, sin ver si acertás hasta el final. Podés ir y volver entre preguntas y
          cambiar respuestas. Si cerrás la app, el examen te espera (pero el reloj sigue corriendo).
        </p>
      </div>

      {p && (
        <div className="tarjeta space-y-3 border-amber-400 p-4 dark:border-amber-600">
          <p className="font-medium">Tenés un simulacro sin terminar</p>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {Object.keys(p.respuestas).length} de {p.ids.length} respondidas ·{" "}
            {Date.now() - p.inicio >= DURACION ? "se terminó el tiempo" : `quedan ${mmss(DURACION - (Date.now() - p.inicio))}`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={props.onContinuar} className="rounded-xl bg-sky-700 py-2.5 font-semibold text-white dark:bg-sky-700">
              {Date.now() - p.inicio >= DURACION ? "Ver resultado" : "Continuar"}
            </button>
            <button onClick={props.onDescartar} className="rounded-xl border border-stone-300 py-2.5 font-medium dark:border-stone-700">
              Descartar
            </button>
          </div>
        </div>
      )}

      <ul className="tarjeta divide-y divide-stone-200 text-sm dark:divide-stone-800">
        {GRUPOS.map((g) => (
          <li key={g.texto} className="flex justify-between px-4 py-2">
            <span>{g.texto}</span>
            <span className="tabular-nums text-stone-500 dark:text-stone-400">{g.cupo} preguntas</span>
          </li>
        ))}
      </ul>

      <button onClick={props.onEmpezar} className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700">
        {p ? "Empezar uno nuevo" : "Empezar"}
      </button>

      {ultimos.length > 0 && (
        <section aria-labelledby="anteriores">
          <h2 id="anteriores" className="mb-2 font-semibold">Tus últimos simulacros</h2>
          <ul className="tarjeta divide-y divide-stone-200 text-sm dark:divide-stone-800">
            {ultimos.map((s) => (
              <li key={s.cuando} className="flex justify-between px-4 py-2">
                <span>{new Date(s.cuando).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span>
                <span className="tabular-nums">
                  {s.aciertos}/{s.total} · {Math.round((s.aciertos / s.total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}

function Examen({ inicial, onEntregar }: { inicial: EnCurso; onEntregar: (e: EnCurso) => void }) {
  const [examen, setExamen] = useState(inicial);
  const [indice, setIndice] = useState(() => {
    const primeraSinResponder = inicial.ids.findIndex((id) => inicial.respuestas[id] === undefined);
    return primeraSinResponder === -1 ? 0 : primeraSinResponder;
  });
  const [vista, setVista] = useState<"pregunta" | "todas">("pregunta");
  const [restante, setRestante] = useState(() => DURACION - (Date.now() - inicial.inicio));
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const entregado = useRef(false);

  const entregarUnaVez = (e: EnCurso) => {
    if (entregado.current) return;
    entregado.current = true;
    onEntregar(e);
  };

  useEffect(() => {
    const t = setInterval(() => {
      const r = DURACION - (Date.now() - examen.inicio);
      setRestante(r);
      if (r <= 0) entregarUnaVez(examen);
    }, 500);
    return () => clearInterval(t);
  });

  useEffect(() => {
    tituloRef.current?.focus();
  }, [indice, vista]);

  const item = porId.get(examen.ids[indice])!;
  const respondidas = examen.ids.filter((id) => examen.respuestas[id] !== undefined).length;
  const sinResponder = examen.ids.length - respondidas;
  const elegida = examen.respuestas[item.id];
  const opciones = useMemo(
    () =>
      examen.ordenes[item.id].map((valor) => ({
        valor,
        texto: item.tipo === "vf" ? (valor ? "Verdadero" : "Falso") : (item.opciones?.[valor as number] ?? ""),
      })),
    [examen.ordenes, item],
  );

  function responder(valor: Valor) {
    setExamen((e) => {
      const n = { ...e, respuestas: { ...e.respuestas, [item.id]: valor } };
      guardar(CLAVE_SIMULACRO, n);
      return n;
    });
  }

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || vista !== "pregunta") return;
      const n = Number(e.key);
      if (n >= 1 && n <= opciones.length) responder(opciones[n - 1].valor);
      if (e.key === "ArrowRight" && indice < examen.ids.length - 1) setIndice(indice + 1);
      if (e.key === "ArrowLeft" && indice > 0) setIndice(indice - 1);
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  const poco = restante < 5 * 60_000;
  const cabecera = (
    <div className="flex items-center justify-between text-sm">
      <span className="tabular-nums text-stone-500 dark:text-stone-400">
        {respondidas}/{examen.ids.length} respondidas
      </span>
      <span
        role="timer"
        aria-label={`Quedan ${mmss(restante)}`}
        className={`rounded-full px-3 py-1 font-semibold tabular-nums ${
          poco ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-stone-200 dark:bg-stone-800"
        }`}
      >
        ⏱ {mmss(restante)}
      </span>
    </div>
  );

  if (vista === "todas")
    return (
      <div className="space-y-4">
        {cabecera}
        <h1 ref={tituloRef} tabIndex={-1} className="text-lg font-semibold outline-none">
          Todas las preguntas
        </h1>
        <ul className="grid grid-cols-6 gap-2">
          {examen.ids.map((id, i) => {
            const hecha = examen.respuestas[id] !== undefined;
            return (
              <li key={id}>
                <button
                  onClick={() => {
                    setIndice(i);
                    setVista("pregunta");
                  }}
                  aria-label={`Pregunta ${i + 1}, ${hecha ? "respondida" : "sin responder"}`}
                  className={`aspect-square w-full rounded-lg border-2 text-sm font-semibold tabular-nums ${
                    hecha
                      ? "border-sky-700 bg-sky-700 text-white dark:border-sky-600 dark:bg-sky-700"
                      : "border-stone-300 dark:border-stone-700"
                  } ${i === indice ? "ring-2 ring-amber-400" : ""}`}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ul>
        <Entrega sinResponder={sinResponder} onEntregar={() => entregarUnaVez(examen)} />
        <button onClick={() => setVista("pregunta")} className="w-full rounded-xl border border-stone-300 py-3 font-medium dark:border-stone-700">
          Volver a la pregunta {indice + 1}
        </button>
      </div>
    );

  return (
    <div className="space-y-4">
      {cabecera}
      <div className="flex items-center justify-between">
        <h1 ref={tituloRef} tabIndex={-1} className="font-semibold outline-none">
          Pregunta {indice + 1} de {examen.ids.length}
        </h1>
        <span className="chip bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">{NOMBRE_TIPO[item.tipo]}</span>
      </div>

      <p className="text-lg font-semibold leading-snug">
        {item.tipo === "clausula" && <span className="block text-sm font-normal text-stone-500 dark:text-stone-400">¿En qué cláusula está?</span>}
        {item.enunciado}
      </p>

      <div className={item.tipo === "vf" ? "grid grid-cols-2 gap-2" : "space-y-2"} role="radiogroup" aria-label="Opciones">
        {opciones.map((o, i) => {
          const marcada = elegida === o.valor;
          return (
            <button
                key={String(o.valor)}
                role="radio"
                aria-checked={marcada}
                onClick={() => responder(o.valor)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left ${
                  marcada
                    ? "border-sky-700 bg-sky-50 font-medium text-sky-900 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-100"
                    : "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    marcada ? "border-sky-700 bg-sky-700 text-white dark:border-sky-500 dark:bg-sky-500" : "border-current opacity-70"
                  }`}
                >
                  {marcada ? "●" : i + 1}
                </span>
                <span>{o.texto}</span>
              </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIndice(indice - 1)}
          disabled={indice === 0}
          className="rounded-xl border border-stone-300 py-3 font-medium disabled:opacity-40 dark:border-stone-700"
        >
          ← Anterior
        </button>
        {indice < examen.ids.length - 1 ? (
          <button onClick={() => setIndice(indice + 1)} className="rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700">
            Siguiente →
          </button>
        ) : (
          <button onClick={() => setVista("todas")} className="rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700">
            Revisar y entregar
          </button>
        )}
      </div>
      <button onClick={() => setVista("todas")} className="w-full text-sm text-stone-600 underline dark:text-stone-400">
        Ver todas las preguntas
      </button>
    </div>
  );
}

function Entrega({ sinResponder, onEntregar }: { sinResponder: number; onEntregar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  if (confirmando && sinResponder > 0)
    return (
      <div className="space-y-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40" role="alert">
        <p className="font-medium">
          Te {sinResponder === 1 ? "queda 1 pregunta" : `quedan ${sinResponder} preguntas`} sin responder. Cuentan como
          error.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onEntregar} className="rounded-xl bg-sky-700 py-2.5 font-semibold text-white dark:bg-sky-700">
            Entregar igual
          </button>
          <button onClick={() => setConfirmando(false)} className="rounded-xl border border-stone-300 py-2.5 font-medium dark:border-stone-700">
            Seguir
          </button>
        </div>
      </div>
    );
  return (
    <button
      onClick={() => (sinResponder > 0 ? setConfirmando(true) : onEntregar())}
      className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700"
    >
      Entregar
    </button>
  );
}

function Resultados({ examen, fin, onOtro }: Resultado & { onOtro: () => void }) {
  const [soloErrores, setSoloErrores] = useState(false);
  const [repaso, setRepaso] = useState<Item[] | null>(null);
  const items = examen.ids.map((id) => porId.get(id)!);
  const bien = (p: Item) => examen.respuestas[p.id] === p.correcta;
  const aciertos = items.filter(bien).length;
  const fallidas = items.filter((p) => !bien(p));
  const pct = Math.round((aciertos / items.length) * 100);
  const minutos = Math.max(1, Math.round((fin - examen.inicio) / 60_000));

  if (repaso) return <Sesion titulo="Las que fallé en el simulacro" items={repaso} onSalir={() => setRepaso(null)} />;

  return (
    <div className="space-y-5">
      <div className="tarjeta p-5 text-center">
        <h1 className="text-sm text-stone-500 dark:text-stone-400">Resultado del simulacro</h1>
        <p className="text-5xl font-bold tabular-nums">
          {aciertos}/{items.length}
        </p>
        <p className="text-lg">{pct}% de aciertos</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {minutos} min · {items.length - Object.keys(examen.respuestas).length} sin responder
        </p>
      </div>

      <section aria-labelledby="desglose">
        <h2 id="desglose" className="mb-2 font-semibold">Por capítulo</h2>
        <ul className="tarjeta divide-y divide-stone-200 dark:divide-stone-800">
          {GRUPOS.map((g) => {
            const delGrupo = items.filter(g.incluye);
            const ok = delGrupo.filter(bien).length;
            const p = delGrupo.length ? ok / delGrupo.length : 0;
            return (
              <li key={g.texto} className="space-y-1 px-4 py-2.5">
                <div className="flex justify-between text-sm">
                  <span>{g.texto}</span>
                  <span className="tabular-nums">
                    {ok}/{delGrupo.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" aria-hidden>
                  <div
                    className={`h-full ${p >= 0.7 ? "bg-emerald-600" : p >= 0.5 ? "bg-amber-500" : "bg-rose-600"}`}
                    style={{ width: `${p * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-2">
        {fallidas.length > 0 && (
          <button
            onClick={() => setRepaso(mezclar(fallidas))}
            className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-700"
          >
            Practicar las {fallidas.length} que fallé
          </button>
        )}
        <button onClick={onOtro} className="w-full rounded-xl border border-stone-300 py-3 font-medium dark:border-stone-700">
          Otro simulacro
        </button>
      </div>

      <section aria-labelledby="revision">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="revision" className="font-semibold">Pregunta por pregunta</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soloErrores} onChange={(e) => setSoloErrores(e.target.checked)} className="h-4 w-4" />
            Solo errores
          </label>
        </div>
        <ol className="space-y-2">
          {items.map((p, i) => {
            const ok = bien(p);
            if (soloErrores && ok) return null;
            return (
              <li key={p.id} className="tarjeta space-y-1 p-3 text-sm">
                <p className="font-medium">
                  <span className={ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
                    {ok ? "✓" : "✗"} {i + 1}.
                  </span>{" "}
                  {p.enunciado}
                </p>
                {!ok && (
                  <p className="text-rose-700 dark:text-rose-400">Tu respuesta: {textoDe(p, examen.respuestas[p.id])}</p>
                )}
                <p className="text-emerald-700 dark:text-emerald-400">Correcta: {textoDe(p, p.correcta as Valor)}</p>
                <p className="text-stone-600 dark:text-stone-300">{p.explicacion}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <button onClick={() => ir("modo/progreso")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Ver mi progreso
      </button>
    </div>
  );
}
