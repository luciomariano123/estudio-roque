import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

// Arrastrar y soltar con Pointer Events: anda igual con mouse, dedo o lápiz.
// Los destinos se marcan con data-destino="…". Si el puntero casi no se movió, no es
// un arrastre y el click normal sigue funcionando (así conviven "tocar y tocar" y arrastrar).

type Fantasma = { pieza: string; x: number; y: number };

export function useArrastre(onSoltar: (pieza: string, destino: string) => void) {
  const [fantasma, setFantasma] = useState<Fantasma | null>(null);
  const actual = useRef<{ pieza: string; x0: number; y0: number; activo: boolean } | null>(null);
  const descartarClick = useRef(false);
  const soltarRef = useRef(onSoltar);
  soltarRef.current = onSoltar;

  useEffect(() => {
    function mover(e: PointerEvent) {
      const a = actual.current;
      if (!a) return;
      if (!a.activo && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 6) a.activo = true;
      if (a.activo) setFantasma({ pieza: a.pieza, x: e.clientX, y: e.clientY });
    }
    function soltar(e: PointerEvent) {
      const a = actual.current;
      actual.current = null;
      if (!a?.activo) return;
      setFantasma(null);
      // El click que el navegador dispara después del arrastre no tiene que contar como "tocar".
      descartarClick.current = true;
      setTimeout(() => (descartarClick.current = false), 0);
      const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-destino]");
      if (destino?.dataset.destino) soltarRef.current(a.pieza, destino.dataset.destino);
    }
    function cancelar() {
      actual.current = null;
      setFantasma(null);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelar);
    };
  }, []);

  return {
    fantasma,
    /** onPointerDown para lo que se puede arrastrar */
    iniciar: (pieza: string) => (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      actual.current = { pieza, x0: e.clientX, y0: e.clientY, activo: false };
    },
    /** true si el click viene de terminar un arrastre y hay que ignorarlo */
    esFinDeArrastre: () => descartarClick.current,
  };
}
