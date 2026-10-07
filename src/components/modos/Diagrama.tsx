import { useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { diagramas } from "../../content";
import { useArrastre } from "../../lib/arrastre";
import { mezclar } from "../../lib/mezclar";
import { marcarDia } from "../../lib/progreso";
import { ir } from "../../lib/ruta";
import { guardar, leer } from "../../lib/storage";
import type { Diagrama as TDiagrama, Lugar } from "../../types";
import Selector from "../Selector";

const BANCO = "banco";

export default function Diagrama() {
  const [id, setId] = useState<string>(() => leer("diagrama.id", diagramas[0].id));
  const d = diagramas.find((x) => x.id === id) ?? diagramas[0];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Armá el diagrama</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Arrastrá cada pieza a su lugar, o tocá una pieza y después el lugar. Ojo: sobran piezas.
        </p>
      </div>
      <Selector
        etiqueta="Figura"
        opciones={diagramas.map((x) => ({ valor: x.id, texto: x.titulo }))}
        valor={d.id}
        onChange={(v) => {
          setId(v);
          guardar("diagrama.id", v);
        }}
      />
      <Armado key={d.id} d={d} />
      <button onClick={() => ir("inicio")} className="w-full text-sm text-stone-500 underline dark:text-stone-400">
        Volver al inicio
      </button>
    </div>
  );
}

type Colocadas = Record<string, string>; // lugar → pieza

function Armado({ d }: { d: TDiagrama }) {
  const lugares = useMemo(() => [...(d.centro ? [d.centro] : []), ...d.lugares], [d]);
  const [piezas, setPiezas] = useState(() => mezclar([...lugares.map((l) => l.correcta), ...d.distractores]));
  const [colocadas, setColocadas] = useState<Colocadas>({});
  const [elegida, setElegida] = useState<string | null>(null);
  const [revisado, setRevisado] = useState(false);
  const [pista, setPista] = useState(false);

  const enBanco = piezas.filter((p) => !Object.values(colocadas).includes(p));
  const bien = lugares.filter((l) => colocadas[l.id] === l.correcta).length;
  const completo = bien === lugares.length;

  function ubicar(pieza: string, destino: string) {
    setColocadas((c) => {
      const n: Colocadas = {};
      for (const [k, v] of Object.entries(c)) if (v !== pieza) n[k] = v; // sale de donde estaba
      if (destino !== BANCO) n[destino] = pieza; // si el lugar estaba ocupado, esa pieza vuelve al banco
      return n;
    });
    setElegida(null);
    setRevisado(false);
  }

  const { fantasma, iniciar, esFinDeArrastre } = useArrastre(ubicar);

  function tocarLugar(id: string) {
    if (esFinDeArrastre()) return;
    if (elegida) ubicar(elegida, id);
    else if (colocadas[id]) setElegida(colocadas[id]); // levantar la pieza para moverla
  }

  function tocarPieza(p: string) {
    if (esFinDeArrastre()) return;
    setElegida((e) => (e === p ? null : p));
  }

  function comprobar() {
    setRevisado(true);
    if (bien === lugares.length) marcarDia();
  }

  const lugar = (l: Lugar, extra = "", vertical = false) => (
    <LugarVisual
      key={l.id}
      lugar={l}
      pieza={colocadas[l.id]}
      estado={revisado ? (colocadas[l.id] === l.correcta ? "bien" : "mal") : null}
      elegida={elegida !== null && colocadas[l.id] === elegida}
      esperando={elegida !== null}
      pista={pista}
      vertical={vertical}
      className={extra}
      onClick={() => tocarLugar(l.id)}
      onPointerDown={colocadas[l.id] ? iniciar(colocadas[l.id]) : undefined}
    />
  );

  return (
    <div className="space-y-4">
      {d.forma === "rueda" ? <Rueda d={d} render={lugar} /> : <Proceso d={d} render={lugar} />}

      <div
        data-destino={BANCO}
        onClick={() => elegida && Object.values(colocadas).includes(elegida) && ubicar(elegida, BANCO)}
        // Fijo abajo (sobre la barra de navegación): las piezas quedan a mano mientras se scrollea el diagrama.
        className="sticky bottom-[4.75rem] z-10 max-h-[38vh] min-h-16 overflow-y-auto rounded-2xl border border-dashed border-stone-300 bg-stone-50/95 p-2 backdrop-blur dark:border-stone-700 dark:bg-stone-950/95"
        aria-label="Piezas sin ubicar"
      >
        {enBanco.length === 0 ? (
          <p className="py-3 text-center text-sm text-stone-500 dark:text-stone-400">Todas las piezas están ubicadas.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {enBanco.map((p) => (
              <li key={p}>
                <button
                  onPointerDown={iniciar(p)}
                  onClick={(e) => {
                    e.stopPropagation();
                    tocarPieza(p);
                  }}
                  aria-pressed={elegida === p}
                  className={`touch-none select-none rounded-lg border-2 px-2 py-1 text-[13px] font-medium ${
                    elegida === p
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800"
                  }`}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {elegida ? `Elegiste ${elegida}. Tocá un lugar para ubicarla.` : ""}
      </p>

      {revisado && (
        <p
          className={`rounded-xl p-3 text-center font-semibold ${
            completo
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          }`}
          aria-live="polite"
        >
          {completo ? "¡Perfecto! Está todo en su lugar." : `${bien} de ${lugares.length} en su lugar. Corregí las rojas.`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={comprobar} className="col-span-2 rounded-xl bg-sky-700 py-3 font-semibold text-white dark:bg-sky-600">
          Comprobar
        </button>
        <button
          onClick={() => setPista((p) => !p)}
          aria-pressed={pista}
          className="rounded-xl border border-stone-300 py-2.5 text-sm font-medium dark:border-stone-700"
        >
          {pista ? "Sacar pistas" : "Ver pistas"}
        </button>
        <button
          onClick={() => {
            setColocadas({});
            setPiezas(mezclar(piezas));
            setRevisado(false);
            setElegida(null);
          }}
          className="rounded-xl border border-stone-300 py-2.5 text-sm font-medium dark:border-stone-700"
        >
          Empezar de nuevo
        </button>
        {revisado && !completo && (
          <button
            onClick={() => setColocadas(Object.fromEntries(lugares.map((l) => [l.id, l.correcta])))}
            className="col-span-2 text-sm text-stone-500 underline dark:text-stone-400"
          >
            Mostrar la solución
          </button>
        )}
      </div>

      {fantasma && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-lg"
          style={{ left: fantasma.x, top: fantasma.y }}
        >
          {fantasma.pieza}
        </div>
      )}
    </div>
  );
}

type Render = (l: Lugar, extra?: string, vertical?: boolean) => ReactNode;

function LugarVisual(props: {
  lugar: Lugar;
  pieza?: string;
  estado: "bien" | "mal" | null;
  elegida: boolean;
  esperando: boolean;
  pista: boolean;
  vertical: boolean;
  className: string;
  onClick: () => void;
  onPointerDown?: (e: ReactPointerEvent) => void;
}) {
  const { pieza, estado } = props;
  let estilo = pieza
    ? "border-solid border-stone-400 bg-white text-stone-900 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-100"
    : "border-dashed border-white/70 bg-white/25 text-white dark:border-white/40 dark:bg-white/10";
  if (estado === "bien") estilo = "border-solid border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (estado === "mal") estilo = "border-solid border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-200";
  if (props.elegida) estilo += " ring-2 ring-sky-400";
  else if (props.esperando && !pieza) estilo += " border-sky-200";
  return (
    <button
      data-destino={props.lugar.id}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      aria-label={`${props.pista ? props.lugar.pista + ": " : "Lugar: "}${pieza ?? "vacío"}${
        estado === "bien" ? ", bien" : estado === "mal" ? ", mal" : ""
      }`}
      className={`flex items-center justify-center rounded-lg border-2 p-1 text-center text-[11px] font-medium leading-tight ${
        pieza ? "touch-none select-none" : ""
      } ${estilo} ${props.className}`}
    >
      <span className={props.vertical ? "[writing-mode:vertical-rl] rotate-180" : ""}>
        {pieza ?? (props.pista ? props.lugar.pista : "")}
      </span>
    </button>
  );
}

// Las ruedas se dibujan con un SVG de fondo y los lugares como botones encima, ubicados en el medio de cada sector.
function Rueda({ d, render }: { d: TDiagrama; render: Render }) {
  const n = d.lugares.length;
  const paso = 360 / n;
  // Principios: el primer sector arranca en las 12. Marco: el primer componente queda centrado arriba.
  const inicio = d.id === "principios" ? -90 : -90 - paso / 2;
  const INT = 20;
  const EXT = 49;
  const MEDIO = (INT + EXT) / 2;
  const color = d.id === "principios" ? "fill-principios" : "fill-marco";
  const rad = (g: number) => (g * Math.PI) / 180;
  const ancho = d.id === "principios" ? "w-[24%]" : "w-[30%]";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[24rem]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r={EXT} className={`${color} opacity-90`} />
        {Array.from({ length: n }, (_, i) => {
          const g = rad(inicio + i * paso);
          return (
            <line
              key={i}
              x1={50 + INT * Math.cos(g)}
              y1={50 + INT * Math.sin(g)}
              x2={50 + EXT * Math.cos(g)}
              y2={50 + EXT * Math.sin(g)}
              className="stroke-white dark:stroke-stone-950"
              strokeWidth="1.2"
            />
          );
        })}
        <circle cx="50" cy="50" r={INT} className="fill-white/30 stroke-white dark:stroke-stone-950" strokeWidth="1.2" />
      </svg>
      {d.lugares.map((l, i) => {
        const g = rad(inicio + paso / 2 + i * paso);
        return (
          <div
            key={l.id}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 ${ancho}`}
            style={{ left: `${50 + MEDIO * Math.cos(g)}%`, top: `${50 + MEDIO * Math.sin(g)}%` }}
          >
            {render(l, "w-full min-h-[3rem]")}
          </div>
        );
      })}
      {d.centro && (
        <div className="absolute left-1/2 top-1/2 flex w-[34%] -translate-x-1/2 -translate-y-1/2">
          {render(d.centro, "w-full min-h-[4.5rem] rounded-full")}
        </div>
      )}
    </div>
  );
}

// El proceso: barras laterales (comunicación y consulta / seguimiento y revisión), columna central y base.
function Proceso({ d, render }: { d: TDiagrama; render: Render }) {
  const l = Object.fromEntries(d.lugares.map((x) => [x.id, x]));
  return (
    <div className="space-y-2 rounded-[2rem] bg-proceso p-3 dark:bg-proceso/70">
      <div className="grid grid-cols-[3rem_1fr_3rem] gap-2">
        {render(l.comunicacion, "min-h-full", true)}
        <div className="space-y-2">
          {render(l.alcance, "w-full min-h-12")}
          <div className="space-y-1.5 rounded-xl bg-white/15 p-1.5">
            {render(l.evaluacion, "w-full min-h-10")}
            <div className="space-y-1.5 px-3">
              {render(l.identificacion, "w-full min-h-10")}
              {render(l.analisis, "w-full min-h-10")}
              {render(l.valoracion, "w-full min-h-10")}
            </div>
          </div>
          {render(l.tratamiento, "w-full min-h-12")}
        </div>
        {render(l.seguimiento, "min-h-full", true)}
      </div>
      {render(l.registro, "w-full min-h-11")}
    </div>
  );
}
