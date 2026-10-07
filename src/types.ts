export type Capitulo = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = prólogo, introducción y bibliografía

export type TipoItem = "mc" | "vf" | "cloze" | "clasificar" | "caso" | "clausula";

export type Tag = "trampa" | "lista" | "definicion" | "proposito";

export type Item = {
  id: string; // "mc-6.4.3-01"
  tipo: TipoItem;
  capitulo: Capitulo;
  clausula: string; // "6.4.3"
  dificultad: 1 | 2 | 3;
  enunciado: string;
  opciones?: string[]; // en el JSON la correcta suele ir primera; la app mezcla al mostrar
  correcta: number | boolean | string;
  explicacion: string; // con palabras propias + cláusula
  tags?: Tag[];
  grupo?: string; // solo clasificar: id del set en clasificador.json
};

export type Flashcard = { id: string; mazo: string; frente: string; dorso: string; clausula: string };

export type Mazo = { id: string; titulo: string; descripcion: string };

export type Clausula = { id: string; capitulo: Capitulo; titulo: string };

export type GrupoClasificacion = { id: string; titulo: string; clausula: string; categorias: string[] };

export type Parte = { id: string; titulo: string; clausula: string; resumen: string; puntos: string[] };

export type Bloque = {
  id: "principios" | "marco" | "proceso";
  titulo: string;
  capitulo: Capitulo;
  clausula: string;
  centro?: string; // solo las figuras de principios y marco tienen centro
  resumen: string;
  partes: Parte[];
};

export type ParMemotest = { id: string; clausula: string; a: string; b: string };
export type SetMemotest = { id: string; titulo: string; pares: ParMemotest[] };

export type Lugar = { id: string; correcta: string; pista: string };
export type Diagrama = {
  id: "principios" | "marco" | "proceso";
  titulo: string;
  clausula: string;
  forma: "rueda" | "proceso";
  centro?: Lugar;
  lugares: Lugar[];
  distractores: string[];
};
