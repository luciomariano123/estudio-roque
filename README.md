# ISO 31000:2018 — estudio

Web app para preparar el examen de la ISO 31000:2018 (Gestión del riesgo — Directrices): entender la estructura, memorizar listas y definiciones, y practicar con preguntas tipo examen.

Vite + React + TypeScript + Tailwind. Sin backend: el progreso se guarda en el navegador.

## Comandos

```bash
npm install
npm run dev        # servidor local
npm run validate   # revisa los JSON del contenido
npm run banco      # regenera docs/BANCO.md para revisar el banco
npm run build      # valida, chequea tipos y genera dist/ (sitio estático)
```

## Publicación

Cada push a `main` se publica solo en GitHub Pages (`.github/workflows/pages.yml`): https://luciomariano123.github.io/estudio-roque/

El workflow corre `npm run build`, que incluye `npm run validate`: si el contenido tiene errores, no se publica. Para que funcione, Pages tiene que estar activado en *Settings → Pages → Source: GitHub Actions*.

## Contenido

Todo vive en `src/content/`, separado del código:

| Archivo | Qué tiene |
|---|---|
| `preguntas/*.json` | El banco de preguntas. Cualquier `.json` nuevo en esta carpeta se carga solo. |
| `flashcards.json` · `mazos.json` | Flashcards y sus mazos. |
| `estructura.json` | Los tres bloques (principios, marco, proceso) y las fichas del mapa. |
| `clasificador.json` | Los sets del modo "¿Dónde va?" y sus categorías. |
| `memotest.json` | Las parejas del memotest (término ↔ definición, cláusula ↔ propósito). |
| `diagramas.json` | Las piezas de cada figura para "Armá el diagrama" y las que sobran. |
| `clausulas.json` | Cláusulas válidas de la norma (el validador las usa). |

Para revisar el banco sin levantar la app: [`docs/BANCO.md`](docs/BANCO.md).

### Formato de una pregunta

```json
{
  "id": "mc-6.4.3-01",
  "tipo": "mc",
  "capitulo": 6,
  "clausula": "6.4.3",
  "dificultad": 2,
  "enunciado": "…",
  "opciones": ["correcta", "distractor", "distractor", "distractor"],
  "correcta": 0,
  "explicacion": "Con palabras propias. Ver 6.4.3.",
  "tags": ["trampa"]
}
```

- `tipo`: `mc`, `vf`, `cloze`, `clasificar`, `caso` o `clausula`. El id empieza con `mc-`, `vf-`, `cloze-`, `clas-`, `caso-` o `clau-`.
- `vf` no lleva opciones y `correcta` es `true`/`false`.
- `cloze` lleva `____` en el enunciado.
- `clasificar` lleva `grupo` (un id de `clasificador.json`) y sus opciones son las categorías de ese grupo.
- Por convención la correcta va primera; la app mezcla las opciones en cada intento.
- `capitulo` 0 = prólogo, introducción y bibliografía.

`npm run validate` controla ids únicos, que la respuesta correcta exista, que la cláusula exista y corresponda al capítulo, y que la explicación esté y cite la cláusula ("Ver …").

## Progreso

Se guarda en `localStorage` bajo la clave `progreso.v1`: respuestas por pregunta (aciertos, errores y si la última salió bien), caja Leitner de cada flashcard, días con actividad, récord del verdadero o falso y los últimos simulacros. Un simulacro sin terminar se guarda aparte (`simulacro.v1`) para poder retomarlo. Si el navegador bloquea el storage, la app funciona igual pero no recuerda nada al cerrar.

## Accesibilidad

- Todo se puede usar con teclado: foco visible, "Saltar al contenido", teclas 1–4 para responder, Enter para seguir, ← → en el simulacro, espacio y 1–3 en las flashcards, V/F en el contrarreloj.
- Arrastrar y soltar siempre tiene alternativa de tocar la pieza y después el lugar.
- Al cambiar de pantalla, el foco va al contenido nuevo y cambia el título de la pestaña.
- Contraste AA en tema claro y oscuro (auditado con axe-core en todas las pantallas), y se respeta "reducir movimiento".

## Reglas del contenido

- Explicaciones y enunciados con palabras propias, citando la cláusula. No se pegan párrafos de la norma; solo las definiciones del capítulo 3 usan su formulación.
- Los diagramas se redibujan como SVG propios.
- El PDF de la norma tiene licencia de un solo usuario: no se sube al repo ni entra al build (`*.pdf` está en `.gitignore`).

## Estado

- [x] Fase 1 — Base, navegación, tema claro/oscuro, banco de contenido y validador
- [x] Fase 2 — Mapa interactivo, flashcards (Leitner), multiple choice, V/F, guardado de progreso
- [x] Fase 3 — Clasificador, armá el diagrama, memotest, completar la frase, casos, ¿qué cláusula es?
- [x] Fase 4 — Simulacro, tablero de progreso, repasar errores, pulido mobile y accesibilidad
