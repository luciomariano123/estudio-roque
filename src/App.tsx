import { useEffect, useRef } from "react";
import Banco from "./components/Banco";
import Inicio from "./components/Inicio";
import Proximamente from "./components/Proximamente";
import Diagrama from "./components/modos/Diagrama";
import Flashcards from "./components/modos/Flashcards";
import Memotest from "./components/modos/Memotest";
import ModoPreguntas, { CONFIGS } from "./components/modos/ModoPreguntas";
import Practicar from "./components/modos/Practicar";
import Progreso from "./components/modos/Progreso";
import Simulacro from "./components/modos/Simulacro";
import VerdaderoFalso from "./components/modos/VerdaderoFalso";
import { ir, useRuta } from "./lib/ruta";
import { useTema } from "./lib/tema";
import { MODOS } from "./modos";

const PESTANAS = [
  { ruta: "inicio", texto: "Inicio", icono: "◎" },
  { ruta: "banco", texto: "Banco", icono: "☰" },
  { ruta: "modo/progreso", texto: "Progreso", icono: "▲" },
];

function titulo(ruta: string): string {
  if (ruta === "banco") return "Banco de contenido";
  if (ruta.startsWith("practicar/")) return `Practicar ${decodeURIComponent(ruta.slice("practicar/".length))}`;
  if (ruta.startsWith("modo/")) return MODOS.find((m) => m.id === ruta.slice("modo/".length))?.titulo ?? "Inicio";
  return "Inicio";
}

export default function App() {
  const ruta = useRuta();
  const { tema, alternar } = useTema();
  const mainRef = useRef<HTMLElement>(null);
  const primera = useRef(true);

  // Título de la pestaña y foco al contenido nuevo al navegar (no en la primera carga).
  useEffect(() => {
    document.title = `${titulo(ruta)} · ISO 31000`;
    if (primera.current) primera.current = false;
    else mainRef.current?.focus({ preventScroll: true });
  }, [ruta]);

  let pantalla;
  if (ruta === "banco") pantalla = <Banco />;
  else if (ruta.startsWith("practicar/"))
    pantalla = <Practicar key={ruta} clausula={decodeURIComponent(ruta.slice("practicar/".length))} />;
  else if (ruta.startsWith("modo/")) {
    const id = ruta.slice("modo/".length);
    if (id === "flashcards") pantalla = <Flashcards />;
    else if (CONFIGS[id]) pantalla = <ModoPreguntas key={id} config={CONFIGS[id]} />;
    else if (id === "verdadero-falso") pantalla = <VerdaderoFalso />;
    else if (id === "memotest") pantalla = <Memotest />;
    else if (id === "diagrama") pantalla = <Diagrama />;
    else if (id === "simulacro") pantalla = <Simulacro />;
    else if (id === "progreso") pantalla = <Progreso />;
    else if (id === "explorar") pantalla = <Inicio />;
    else pantalla = <Proximamente id={id} />;
  } else pantalla = <Inicio />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <a
        href="#contenido"
        onClick={(e) => {
          e.preventDefault(); // el hash lo usa el router: movemos el foco a mano
          mainRef.current?.focus();
        }}
        className="sr-only z-20 rounded-lg bg-sky-700 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-stone-50/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <button onClick={() => ir("inicio")} className="text-left">
          <span className="block text-base font-semibold leading-tight">ISO 31000:2018</span>
          <span className="block text-xs text-stone-500 dark:text-stone-400">Gestión del riesgo · estudio</span>
        </button>
        <button
          onClick={alternar}
          className="rounded-full border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700"
          aria-label={tema === "oscuro" ? "Pasar a tema claro" : "Pasar a tema oscuro"}
        >
          {tema === "oscuro" ? "☀︎ Claro" : "☾ Oscuro"}
        </button>
      </header>

      <main id="contenido" ref={mainRef} tabIndex={-1} className="flex-1 px-4 pb-24 pt-4 outline-none">
        {pantalla}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-stone-50/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95"
        aria-label="Navegación principal"
      >
        <ul className="mx-auto flex max-w-2xl">
          {PESTANAS.map((p) => {
            const activa = ruta === p.ruta || (p.ruta === "inicio" && ruta === "");
            return (
              <li key={p.ruta} className="flex-1">
                <a
                  href={"#/" + p.ruta}
                  aria-current={activa ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                    activa ? "font-semibold text-sky-700 dark:text-sky-400" : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  <span aria-hidden className="text-lg leading-none">{p.icono}</span>
                  {p.texto}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
