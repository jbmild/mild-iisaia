# TP 1 — Guía de la materia

Página autocontenida (HTML + CSS + JS) que presenta el contenido de *Introducción a la ingeniería de software asistida por IA*, armada con el programa y los hilos de `Material/`.

## Cómo se ejecuta

Abrir `index.html` con doble click, o arrastrarlo a un navegador. No hace falta instalar nada ni levantar un servidor.

## Qué me propuse construir

Una página de saludo mínima, después una guía completa de la materia, un restyling al estilo Matrix (fósforo verde, lluvia digital) y un frente Bad UI Battle: la página solo se desplaza en horizontal y el sentido está invertido.

## Decisiones que tomé yo

- Un solo `index.html` (paradigma *single-file* de la semana 2): CSS en `<style>`, JS en `<script>`. Las fuentes se piden a Google Fonts.
- Contenido en el HTML, no en un objeto JavaScript: la página se lee sin JS; el script solo realza (filtro, eje invertido, distancias aleatorias, lluvia inestable).
- Landmarks semánticos: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `details`/`summary`. Los `div` que quedan son cajas de layout, no encabezados disfrazados.
- Paleta Matrix (verde fósforo sobre negro), tipografías `VT323` y `Share Tech Mono` desde Google Fonts, lluvia digital en canvas, scanlines CRT.
- SVG propio de las dos cápsulas. Sin still embebido: el data URI hacía ilegible el archivo. Un solo tema: Matrix; el modo claro (“El constructo”) se sacó porque no encajaba.
- Calendario filtrable (botones + búsqueda) en lugar de una tabla estática, para usar estado, DOM y eventos.
- Eje único horizontal: cada sección es un panel; unidades, semanas y listas largas se leen de costado para no volver al scroll vertical.
- Inversión deliberada: rueda y trackpad mueven la pista al revés.
- Distancia de scroll no lineal: cada gesto toma un factor nuevo (casi nada, un paso, un salto). La lluvia cambia de velocidad por columna y a ráfagas, para desorientar.
- Barra de scroll oculta. El portal solo explica el truco: hay que usar la rueda, que dispara el factor aleatorio.
- El menú de arriba es un mapa muerto: se ve y marca la sección, pero no se clickea. La única forma de recorrer es la rueda.

## Qué salió mal y cómo lo corregí

El primer corte era solo un Hola mundo. Se aceptó y se pidió la página completa. El segundo corte se aceptó y se pidió un cambio de estilo (Matrix), sin tirar contenido ni estructura semántica. El tercero se aceptó y se pidió un frente Bad UI con scroll horizontal invertido. El still JPEG embebido dejó el HTML ilegible: se sacó y quedó solo el canvas. El menú de arriba todavía saltaba secciones: se lo dejó a la vista, pero sin enlaces. El modo claro no convenció: se sacó el botón y quedó solo Matrix.

## Prompts

El registro completo va en [prompts.md](prompts.md).

Los que más cambiaron el resultado:

1. Pedir HTML semántico y CSS plano para un Hola mundo.
2. Pedir la página completa de la materia, autocontenida, con JS, usando `Material/`.
3. Pedir estilo inspirado en Matrix, con imágenes embebidas o de la web.
4. Pedir un frente Bad UI Battle: solo scroll horizontal, invertido.
5. Sacar el still embebido; hacer aleatoria la distancia de scroll y la velocidad de la lluvia.
6. Esconder la barra y dejar solo la explicación en el portal, para forzar la rueda.
7. Apagar el menú: que se vea, que no navegue.
8. Sacar el modo claro (“El constructo”).
