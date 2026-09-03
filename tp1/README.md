# TP 1 — Guía de la materia

Página autocontenida (HTML + CSS + JS) que presenta el contenido de *Introducción a la ingeniería de software asistida por IA*, armada con el programa y los hilos de `Material/`.

## Cómo se ejecuta

Abrir `index.html` con doble click, o arrastrarlo a un navegador. No hace falta instalar nada ni levantar un servidor.

## Qué me propuse construir

Una página de saludo mínima (HTML + CSS, etiquetas semánticas) como primer corte. Después, una página completa sobre la materia: qué es el curso, objetivos, unidades, calendario de ocho semanas, evaluación y bibliografía. Un solo archivo, con JavaScript para tema, filtro de semanas y marca de sección activa.

## Decisiones que tomé yo

- Un solo `index.html` (paradigma *single-file* de la semana 2): CSS en `<style>`, JS en `<script>`. Sin CDN ni dependencias.
- Contenido en el HTML, no en un objeto JavaScript: la página se lee sin JS; el script solo realza (tema, filtro, navegación).
- Landmarks semánticos: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `details`/`summary`. Los `div` que quedan son cajas de layout, no encabezados disfrazados.
- Paleta y tipografía del Hola mundo, más tema claro/oscuro con variables CSS y `localStorage`.
- Calendario filtrable (botones + búsqueda) en lugar de una tabla estática, para usar estado, DOM y eventos.

## Qué salió mal y cómo lo corregí

El primer corte era solo un Hola mundo. Se aceptó como primera vista y se pidió la página completa; no se tiró el enfoque semántico ni el archivo único, se amplió encima.

## Prompts

El registro completo va en [prompts.md](prompts.md).

Los que más cambiaron el resultado:

1. Pedir HTML semántico y CSS plano para un Hola mundo.
2. Pedir la página completa de la materia, autocontenida, con JS, usando `Material/`.
