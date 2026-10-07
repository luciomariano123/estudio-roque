import { useEffect, useState } from "react";

export type Tema = "claro" | "oscuro";

// Claro por defecto, sin importar la preferencia del sistema. Solo se guarda lo que la
// persona elige con el botón (la clave "tema" vieja se guardaba sola y se ignora).
const CLAVE = "tema.elegido";

function temaInicial(): Tema {
  try {
    if (localStorage.getItem(CLAVE) === "oscuro") return "oscuro";
  } catch {
    /* sin storage */
  }
  return "claro";
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
  }, [tema]);

  function alternar() {
    const nuevo: Tema = tema === "oscuro" ? "claro" : "oscuro";
    setTema(nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      /* sin storage: el cambio vale hasta cerrar */
    }
  }

  return { tema, alternar };
}
