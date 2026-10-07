import { useEffect, useState } from "react";

export type Tema = "claro" | "oscuro";

function temaInicial(): Tema {
  try {
    const t = localStorage.getItem("tema");
    if (t === "claro" || t === "oscuro") return t;
  } catch {
    /* sin storage */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
    try {
      localStorage.setItem("tema", tema);
    } catch {
      /* sin storage */
    }
  }, [tema]);
  return { tema, alternar: () => setTema((t) => (t === "oscuro" ? "claro" : "oscuro")) };
}
