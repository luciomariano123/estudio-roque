import { useEffect, useState } from "react";

// Router mínimo por hash: funciona en cualquier hosting estático sin configurar redirecciones.
const actual = () => window.location.hash.replace(/^#\/?/, "") || "inicio";

export function useRuta() {
  const [ruta, setRuta] = useState(actual);
  useEffect(() => {
    const alCambiar = () => {
      setRuta(actual());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return ruta;
}

export const ir = (ruta: string) => {
  window.location.hash = "/" + ruta;
};
