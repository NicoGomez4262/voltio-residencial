# 09 · Esperas: lector del contador y sincronización

> Lee antes `00-GUIA-GENERAL.md`.

## Por qué

Hay dos esperas largas de verdad en la app:

1. **La primera vez que alguien usa el lector del contador**, se descarga un motor de
   reconocimiento de unos 4 MB. En el wifi del conjunto pueden ser 10-20 segundos.
2. **Al abrir la app** con conexión mala, mientras llegan los puestos y las reservas.

Una espera sin nada que mirar se siente el doble de larga. **Estas animaciones no son
decoración: son la diferencia entre esperar y creer que la app se colgó.**

---

## 1. Leyendo el contador — **EN BUCLE**

La más importante de las dos, porque es la más larga.

- **`viewBox="0 0 200 140"`**, se muestra a unos 180 px.
- **Qué dibujar:** un **contador de luz** visto de frente, en estilo línea: una caja
  redondeada, y dentro una **ventana de lectura** con seis casillas donde van los dígitos.
- Encima, un **marco de escaneo** del color de acento: solo las cuatro esquinas, como el
  encuadre de una cámara.

**Animación · EN BUCLE, 2.8 s:**

| Elemento | Qué hace |
|---|---|
| **Línea de escaneo** | Una línea horizontal del color de acento **baja por la ventana de lectura** y vuelve arriba. Con un rastro difuso detrás. 2.8 s, `ease-in-out` |
| **Dígitos** | Las seis casillas **cambian de contenido** al pasar la línea por encima: pasan de una barra tenue a un dígito nítido. En cascada, 0.12 s de desfase |
| **Esquinas del marco** | Laten suavemente: opacidad 0.5 → 1 → 0.5, ciclo de 1.6 s (distinto del escaneo) |

> **Sobre los dígitos:** que sean **formas abstractas de dígito**, no números reales. Si
> se lee "12345" la gente puede pensar que es su lectura de verdad. Barras de siete
> segmentos a medio formar funcionan perfecto.

## 2. Sincronizando — **EN BUCLE**

Para el arranque de la app.

- **`viewBox="0 0 120 120"`**, 64 px.
- **Qué dibujar:** un **rayo** dentro de un círculo de trazo.

**Animación · EN BUCLE, 1.8 s:**
- El **círculo se dibuja y se borra**: `stroke-dashoffset` completo en 1.8 s, dando la
  vuelta.
- El **rayo late** en fase opuesta al círculo: cuando el trazo está completo, el rayo está
  al máximo (opacidad 0.5 → 1 → 0.5, ciclo de 1.8 s desfasado 0.9 s).

## 3. Barra de progreso del lector

Acompaña a la animación 1 cuando ya se sabe cuánto falta.

- **Alto: 6 px**, ancho el del contenedor, esquinas redondeadas.
- Riel en `#1e2330`, relleno en color de acento.
- **El relleno avanza con `transform: scaleX()`**, nunca cambiando `width` (eso hace que
  el celular trabaje de más y se note el tirón).
- Cuando aún no se sabe el porcentaje: una **banda del 30 % que va y viene** de lado a
  lado, ciclo de 1.4 s, `ease-in-out`.

```css
/* Progreso conocido */
.relleno { transform-origin: left center; transform: scaleX(var(--p, 0)); transition: transform .3s ease; }

/* Progreso desconocido */
@keyframes vaiven { 0% { transform: translateX(-100%) scaleX(.3); }
                    100% { transform: translateX(333%) scaleX(.3); } }
.indeterminado { animation: vaiven 1.4s ease-in-out infinite; transform-origin: left center; }
```

## Prompt para la IA generativa (lector del contador)

> Animación vectorial SVG de un **contador de luz siendo escaneado**, estilo línea
> (outline) minimalista-futurista, para una aplicación web oscura. Fondo transparente.
>
> `viewBox="0 0 200 140"`, se mostrará a 180px de ancho, así que sin detalles finos:
> trazos de 3px.
>
> Qué dibujar: un contador eléctrico visto de frente, como una caja redondeada de trazo en
> `rgba(255,255,255,0.18)`, y dentro una ventana de lectura rectangular con seis casillas
> para los dígitos. Superpuesto, un marco de escaneo formado **solo por las cuatro
> esquinas** (como el encuadre de una cámara), en color `#3ad4e6`. Todo lo que va en
> `#3ad4e6` debe ir en una capa separada llamada "acento".
>
> Importante: los dígitos deben ser **formas abstractas tipo siete segmentos a medio
> formar**, nunca números reales legibles, para que nadie los confunda con una lectura de
> verdad.
>
> Animación en bucle infinito de 2.8 segundos con CSS `@keyframes`, animando solo
> `transform` y `opacity`: una línea horizontal en `#3ad4e6`, con un rastro difuso detrás,
> baja recorriendo la ventana de lectura y vuelve a subir con `ease-in-out`; las seis
> casillas de dígitos pasan de una barra tenue a un dígito nítido justo cuando la línea
> las cruza, en cascada con 0.12 segundos de desfase entre una y otra; y las cuatro
> esquinas del marco laten entre opacidad 0.5 y 1 con un ciclo propio de 1.6 segundos,
> deliberadamente distinto del escaneo para que no se sincronicen.
>
> Primer fotograma en reposo, bucle sin salto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Sin texto real dentro de la imagen. Máximo 25 KB.

## Antes de darlas por buenas

- [ ] **Los dígitos no se leen como números reales.** Si alguien puede leer una cifra, hay
      que hacerlos más abstractos.
- [ ] La espera **se siente más corta** con la animación que sin ella. Pruébalo: cuenta 15
      segundos mirándola.
- [ ] La barra de progreso usa `scaleX`, no `width`.
- [ ] Nada late al mismo ritmo que otra cosa.
- [ ] Con `prefers-reduced-motion`, la barra de progreso sigue mostrando el avance (esa es
      información, no decoración): lo que se apaga es el vaivén, no el relleno.
