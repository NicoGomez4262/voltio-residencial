# 08 · Confirmaciones y pago

> Lee antes `00-GUIA-GENERAL.md`.

## Por qué

Son los momentos en que **alguien acaba de mover dinero o de comprometer su parqueadero**.
La animación aquí no decora: **confirma**. Si es ambigua, el vecino se queda con la duda de
si la reserva quedó o no, y vuelve a tocar el botón.

**Todas son de una sola pasada. Ninguna va en bucle**, salvo la de "esperando el pago".
Una confirmación que se repite en bucle deja de leerse como confirmación.

---

## 1. Confirmación general (reserva enviada, puesto publicado, carga guardada)

Ya existe en la app: un círculo con un chulo. Lo que se pide es una versión más fina.

- **`viewBox="0 0 120 120"`**, se muestra a 96 px, centrada sobre la pantalla.
- Un **círculo relleno del color de acento**, radio 48, con un anillo exterior difuso.
- Dentro, un **chulo blanco** de trazo 3.5 px, extremos redondeados.

**Animación · UNA SOLA VEZ, 1.1 s en total:**

| Momento | Qué pasa |
|---|---|
| 0 – 0.5 s | El círculo entra: escala de 0 a 1.06 y de vuelta a 1, con `cubic-bezier(.2,.8,.3,1.4)`. Ese pequeño rebote es lo que lo hace agradable. |
| 0.16 – 0.56 s | El chulo **se dibuja solo** con `stroke-dashoffset`, de 40 a 0 |
| 0.5 – 0.9 s | Un **anillo sale disparado**: escala de 1 a 1.8 mientras se desvanece de 0.5 a 0 |
| 0.7 – 1.1 s | Todo se desvanece |

## 2. Pago aprobado (Wompi)

Distinta de la anterior a propósito: **el dinero merece su propia señal.**

- **`viewBox="0 0 160 120"`**.
- Una **tarjeta** (rectángulo redondeado, 90x58, radio 10) inclinada 8 grados, con una
  banda oscura y un chulo del color de acento sobre ella.
- Un **anillo de "verificado"** rodeándola.

**Animación · UNA SOLA VEZ, 1.4 s:**
1. La tarjeta **entra desde abajo** (24 px) mientras aparece: 0 – 0.4 s.
2. El **anillo se dibuja alrededor** en sentido horario: 0.3 – 0.9 s (`stroke-dashoffset`).
3. El **chulo aparece** sobre la tarjeta: 0.8 – 1.1 s.
4. Un **destello suave** recorre la tarjeta en diagonal: 1.0 – 1.4 s, banda blanca al 20 %.

## 3. Esperando confirmación del pago — **ESTA SÍ EN BUCLE**

Aparece mientras se consulta a Wompi si el pago entró. Puede durar unos segundos.

- **`viewBox="0 0 120 120"`**, 72 px.
- Un **anillo del color de acento** con un hueco (un arco de unos 280 grados).

**Animación · EN BUCLE, 1.4 s:**
- El anillo **gira 360 grados**, lineal.
- El **arco se alarga y se acorta** (de 280 a 120 grados) en un ciclo de 2.1 s — distinto
  del giro, para que el movimiento no se vea mecánico.
- En el centro, un **símbolo de peso colombiano** ($) que late suavemente cada 1.8 s.

## 4. Pago rechazado

**No inventes drama.** Un error de pago ya es bastante frustrante.

- Mismo formato que la confirmación: `viewBox="0 0 120 120"`.
- Círculo en **`#e8697a`** (el rojo del sistema), con una **equis** blanca de trazo 3.5 px.
- **Sin rebote, sin sacudida, sin vibración.** Entra con un desvanecido y una escala de
  0.92 a 1 en 0.35 s, `ease-out`. Y ya.
- **UNA SOLA VEZ.**

## Prompt para la IA generativa (confirmación general)

> Animación vectorial SVG de **confirmación de éxito** para una aplicación web oscura,
> estilo minimalista-futurista, fondo transparente.
>
> `viewBox="0 0 120 120"`, se mostrará a 96px. Un círculo relleno de color `#3ad4e6` de
> radio 48 centrado, rodeado de un anillo exterior difuso del mismo color al 14% de
> opacidad. Dentro del círculo, una marca de verificación (chulo) en color `#06222a` con
> trazo de 3.5px, extremos y uniones redondeados. Todo lo que va en `#3ad4e6` debe ir en
> una capa separada llamada "acento".
>
> Animación de **una sola pasada, sin bucle**, de 1.1 segundos en total, con CSS
> `@keyframes` animando solo `transform`, `opacity` y `stroke-dashoffset`:
> — de 0 a 0.5s el círculo escala de 0 a 1.06 y vuelve a 1 con
> `cubic-bezier(.2,.8,.3,1.4)`, para que rebote ligeramente al llegar;
> — de 0.16 a 0.56s el chulo se dibuja solo mediante `stroke-dashoffset` de 40 a 0;
> — de 0.5 a 0.9s un anillo exterior escala de 1 a 1.8 mientras se desvanece de opacidad
> 0.5 a 0;
> — de 0.7 a 1.1s el conjunto se desvanece a opacidad 0.
>
> Usa `animation-fill-mode: forwards` para que termine y se quede quieto: **no debe
> repetirse**. Sin texto dentro de la imagen. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Máximo 12 KB.

## Antes de darlas por buenas

- [ ] **La de éxito dura menos de 1.2 s.** Si dura más, estorba: la gente quiere seguir.
- [ ] **No se repiten** (salvo la de espera). Compruébalo dejándolas correr 10 segundos.
- [ ] La de pago aprobado **se distingue** de la de confirmación general: son momentos
      distintos y deben sentirse distintos.
- [ ] La de rechazo **no sacude ni vibra**. Nada de castigar al usuario.
- [ ] La de espera no se ve mecánica: el giro y el largo del arco van a ritmos distintos.
