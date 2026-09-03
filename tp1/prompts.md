# Prompts — TP 1

El registro del proceso, en orden. No hace falta que sea exhaustivo al carácter, pero sí que se entienda cómo fuiste dirigiendo.

---

## 1 — Prompt inicial

```
Create a Hola mundo page. the page needs to be a plain html+css, make sure to use the descriptive html tags.
```

**Qué devolvió:** `tp1/index.html` (página Hola mundo, HTML semántico + CSS embebido, sin JavaScript) y este `prompts.md`.

**Qué hice con eso:** lo acepté. Primera vista bien; se commitea y se pide una página completa.

---

## 2 — Página completa de la materia

```
good first view. commit those changes.
After commiting, create a full web page with the content for this subject. It needs to be a plain html+css+javascript selfcontained page. Make sure to keep using descriptive html tags. Use the material in @Material  for the information to show.
```

**Por qué:** la primera vista servía como corte, pero faltaba el contenido de la materia y el JavaScript.

**Qué devolvió:** commit del Hola mundo (`49b73b2`) y un `index.html` autocontenido con programa, unidades, calendario filtrable, evaluación, bibliografía, tema claro/oscuro y README actualizado.

**Qué hice con eso:** lo acepté. Segundo paso bien; se commitea y se pide un cambio de estilo.

---

## 3 — Estilo Matrix

```
good second step. commit those changes.
Now moving forward I want you to change the syle. Want a style based of the movies matrix, use colors, fonts and visuals similar to the movie. Make sure to keep using descriptive html + css + javascript all in a self contained file. You can consume web images as well as images that you can embed into the file
```

**Por qué:** el contenido estaba; faltaba una identidad visual.

**Qué devolvió:** commit de la guía (`0158038`) y restyling de `index.html`: paleta verde/negro, fuentes mono, lluvia en canvas, still embebido, SVG de cápsulas, toggle Matrix / Constructo.

**Qué hice con eso:** lo acepté. “Looks amazing”; se commitea, se pushea y se pide un frente Bad UI Battle.

---

## 4 — Bad UI Battle (scroll invertido)

```
looks amazing, lets commit and push those changes.
Next, lets add the badUIBattle front of the tp1. I want the page to only scroll horizontally. but if I scroll to the left the screen moves to the right and backwards
```

**Por qué:** el estilo Matrix quedó; ahora el corte es un frente al estilo r/badUIbattles, con un solo eje de scroll y el sentido al revés.

**Qué devolvió:** commit y push del Matrix (`29a9a39`) y un `index.html` que abre con un portal Bad UI: scroll solo horizontal, invertido en rueda/trackpad/flechas/dedo; el menú de arriba sigue yendo al destino real.

**Qué hice con eso:** lo acepté. Se commitea y se pide sacar el still embebido, un desplazamiento de distancia aleatoria y lluvia a velocidad inestable.

---

## 5 — Sacar el still, scroll aleatorio, lluvia inestable

```
its ok, commit the changes.
remove the hero visual figure, its too long and makes the code illegible .
Also, make the scroll bar not to be constant, make it random so you can scroll a little and be moved a lot or a little, never the same.
make the rainning letters change speed so the user gets confused
```

**Por qué:** el still embebido inflaba `index.html` y lo volvía ilegible. El scroll invertido aún era predecible; faltaba que la distancia y la lluvia también mintieran.

**Qué devolvió:** commit del frente Bad UI (`0c4b38c`); se sacó el `<figure>` del hero (y el data URI); cada gesto de scroll aplica un factor aleatorio; cada columna de lluvia cambia de velocidad (y hay ráfagas globales).

**Qué hice con eso:** lo acepté. “Looks perfect”; se commitea, se pushea y se pide esconder la barra y dejar solo la explicación en el portal.

---

## 6 — Esconder la barra, solo la explicación

```
looks perfect, now commit and push the changes. 
Hide the scroll bar, let only the explanation in the home page so the user uses the mouse scroll and that will trigger the random scrolling ration
```

**Por qué:** con la barra visible se podía arrastrar el thumb y saltarse la rueda (y el factor aleatorio). Sobran controles en el portal.

**Qué devolvió:** commit y push de still + lluvia/scroll aleatorio (`ccc0dd9`); se ocultó la barra de `main`; el portal queda en título + explicación, sin slider ni flechas mentirosas.

**Qué hice con eso:** lo acepté. “Looks perfecto”; se commitea y se pushea.

---

## 7 — Commit y push de la barra oculta

```
looks perfecto commit and push the changes.
```

**Qué devolvió:** commit y push de la barra oculta y el portal reducido a título + explicación (`tp1/index.html`, README y este log).

**Qué hice con eso:** lo acepté. Se commiteó y se pusheó (`74930bf`); después se pide que el menú no sea clickeable.

---

## 8 — Menú no clickeable

```
wait, make the nav menu non clickable. Force the user to use the mouse scroll to navigate
```

**Por qué:** el menú de arriba saltaba a la sección real y se podía evitar la rueda.

**Qué devolvió:** los ítems del `nav` pasaron a ser etiquetas (`span`) sin enlace; se sacó el skip-link y el link del brand. El mapa sigue marcando la sección actual, pero no navega.

**Qué hice con eso:** lo acepté. Se commitea y se pushea; después se pide sacar el botón del constructo.

---

## Conversación completa
