import Banco from "./components/Banco";
import Inicio from "./components/Inicio";
import Proximamente from "./components/Proximamente";
import Flashcards from "./components/modos/Flashcards";
import MultipleChoice from "./components/modos/MultipleChoice";
import Practicar from "./components/modos/Practicar";
import VerdaderoFalso from "./components/modos/VerdaderoFalso";
import { ir, useRuta } from "./lib/ruta";
import { useTema } from "./lib/tema";

const PESTANAS = [
  { ruta: "inicio", texto: "Inicio", icono: "◎" },
  { ruta: "banco", texto: "Banco", icono: "☰" },
  { ruta: "modo/progreso", texto: "Progreso", icono: "▲" },
];

export default function App() {
  const ruta = useRuta();
  const { tema, alternar } = useTema();

  let pantalla;
  if (ruta === "banco") pantalla = <Banco />;
  else if (ruta.startsWith("practicar/"))
    pantalla = <Practicar key={ruta} clausula={decodeURIComponent(ruta.slice("practicar/".length))} />;
  else if (ruta.startsWith("modo/")) {
    const id = ruta.slice("modo/".length);
    if (id === "flashcards") pantalla = <Flashcards />;
    else if (id === "multiple-choice") pantalla = <MultipleChoice />;
    else if (id === "verdadero-falso") pantalla = <VerdaderoFalso />;
    else if (id === "explorar") pantalla = <Inicio />;
    else pantalla = <Proximamente id={id} />;
  } else pantalla = <Inicio />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
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

      <main className="flex-1 px-4 pb-24 pt-4">{pantalla}</main>

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
