import { useState } from "react";
import { tituloClausula } from "../../content";
import { ir } from "../../lib/ruta";
import { priorizar, preguntasDe } from "../../lib/practica";
import { useProgreso } from "../../lib/progreso";
import Sesion from "../Sesion";

// Llega desde el botón "Practicar esto" de una ficha del mapa: todas las preguntas de esa cláusula.
export default function Practicar({ clausula }: { clausula: string }) {
  const progreso = useProgreso();
  const armar = () => priorizar(preguntasDe(clausula), progreso);
  const [sesion, setSesion] = useState(() => ({ items: armar(), n: 0 }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-stone-500 dark:text-stone-400">Practicar</p>
        <h1 className="text-xl font-semibold">
          {clausula}
          {tituloClausula(clausula) && <span className="font-normal"> · {tituloClausula(clausula)}</span>}
        </h1>
      </div>
      <Sesion
        key={sesion.n}
        items={sesion.items}
        onOtra={() => setSesion((s) => ({ items: armar(), n: s.n + 1 }))}
        onSalir={() => ir("inicio")}
      />
    </div>
  );
}
