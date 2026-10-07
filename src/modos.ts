export type Modo = { id: string; titulo: string; descripcion: string; fase: 2 | 3 | 4 };

// Fase de construcción en la que estamos: los modos de fases posteriores se muestran como "próximamente".
export const FASE_ACTUAL = 3;

// "Explorar" (el mapa) es la pantalla de inicio, así que no figura en esta lista.
export const MODOS: Modo[] = [
  { id: "flashcards", titulo: "Flashcards", descripcion: "Repetición espaciada con 3 cajas.", fase: 2 },
  { id: "multiple-choice", titulo: "Multiple choice", descripcion: "Por capítulo o mezclado, con explicación.", fase: 2 },
  { id: "verdadero-falso", titulo: "Verdadero o falso", descripcion: "60 segundos, puntaje por racha.", fase: 2 },
  { id: "clasificador", titulo: "¿Dónde va?", descripcion: "Mandá cada ítem a su categoría.", fase: 3 },
  { id: "diagrama", titulo: "Armá el diagrama", descripcion: "Las tres figuras, pieza por pieza.", fase: 3 },
  { id: "memotest", titulo: "Memotest", descripcion: "Términos y definiciones, cláusulas y propósitos.", fase: 3 },
  { id: "completar", titulo: "Completar la frase", descripcion: "Fijá las formulaciones exactas.", fase: 3 },
  { id: "casos", titulo: "Casos prácticos", descripcion: "Mini escenarios de organizaciones inventadas.", fase: 3 },
  { id: "que-clausula", titulo: "¿Qué cláusula es?", descripcion: "Ubicá cada idea en la norma.", fase: 3 },
  { id: "simulacro", titulo: "Simulacro de examen", descripcion: "30 preguntas, 30 minutos, nota al final.", fase: 4 },
  { id: "progreso", titulo: "Progreso", descripcion: "Dominio por capítulo, racha y repaso de errores.", fase: 4 },
];
