import { MODOS } from "../modos";

export default function Proximamente({ id }: { id: string }) {
  const modo = MODOS.find((m) => m.id === id);
  return (
    <div className="tarjeta p-6 text-center">
      <p className="text-lg font-semibold">{modo?.titulo ?? "Modo desconocido"}</p>
      {modo && <p className="mt-1 text-stone-500 dark:text-stone-400">{modo.descripcion}</p>}
      <p className="mt-4 text-sm">{modo ? `Se construye en la Fase ${modo.fase}.` : ""}</p>
      <a href="#/inicio" className="mt-6 inline-block rounded-full bg-sky-700 px-4 py-2 text-sm font-medium text-white">
        Volver al inicio
      </a>
    </div>
  );
}
