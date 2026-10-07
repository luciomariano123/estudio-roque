// localStorage puede no existir o tirar error (modo privado, sitio bloqueado).
// La app tiene que andar igual: si falla, se pierde la persistencia y nada más.

export function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo === null ? porDefecto : (JSON.parse(crudo) as T);
  } catch {
    return porDefecto;
  }
}

export function guardar<T>(clave: string, valor: T): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin persistencia */
  }
}

export function borrar(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* sin persistencia */
  }
}
