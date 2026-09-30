# TP final — forma de trabajo

Esta carpeta es el trabajo práctico final. El informe de la entrega sigue en `README.md`. Esta página es la regla de cómo se construye.

## Cada prompt

1. Escribir un plan antes de tocar código. El plan dice qué se va a hacer, qué archivos entran y qué queda afuera.
2. Mostrar el plan y pedir confirmación. Sin un sí explícito, no se construye.
3. El plan queda en el chat. No se guarda en disco salvo que se pida.

## Cambios

Cada cambio va en una rama y en un pull request, para poder validarlo. No se commitea directo a `main`.

Si el plan tiene más de un cambio que se puede revisar por separado, cada uno es su propio pull request anidado:

- El primero apunta a `main`.
- Cada siguiente apunta a la rama del pull request anterior.
- No se mezclan en un solo pull request.
- Cuando uno se mergea, el siguiente se redirige a la base que quedó.
