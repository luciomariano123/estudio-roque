// Fila de opciones exclusivas (tipo "pastillas"), accesible como grupo de botones.
export default function Selector<T extends string | number>(props: {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{props.etiqueta}</legend>
      <div className="flex flex-wrap gap-1.5">
        {props.opciones.map((o) => {
          const activo = o.valor === props.valor;
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => props.onChange(o.valor)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                activo
                  ? "border-sky-700 bg-sky-700 text-white dark:border-sky-500 dark:bg-sky-600"
                  : "border-stone-300 dark:border-stone-700"
              }`}
            >
              {o.texto}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
