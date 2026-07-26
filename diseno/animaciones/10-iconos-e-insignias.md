# 10 · Insignias e íconos animados

> Lee antes `00-GUIA-GENERAL.md`.

## Por qué

Las insignias son **señales de confianza entre vecinos**: dicen quién está verificado,
quién ya pagó, qué puesto está libre ahora. En un conjunto donde la gente se presta el
parqueadero y se transfiere plata, esa confianza es el producto.

Un detalle animado bien puesto las hace creíbles. Uno mal puesto las convierte en ruido:
**en pantalla puede haber cuatro o cinco a la vez**, así que aquí la contención importa
más que en ningún otro archivo.

**Regla dura: solo dos de estas se mueven en bucle. Las demás se animan una vez, cuando
aparecen.**

---

## Formato común

- **`viewBox="0 0 24 24"`** para íconos, **`0 0 80 24`** para insignias con forma de
  píldora.
- Se muestran a **14-18 px de alto**. Son diminutos: **trazo de 2 px, cero detalles**.
- Trazo redondeado en las puntas y en las uniones, siempre.
- Los que llevan color de acento, en capa `acento`.

---

## 1. ✓ Vecino verificado — **animación de entrada, UNA VEZ**

La más importante: marca a quien metió el código del conjunto.

- **Qué dibujar:** un **escudo** simple con un chulo dentro.
- **Animación (0.5 s, una sola vez, al aparecer):** el escudo entra con escala de 0.7 a 1
  (`cubic-bezier(.2,.8,.3,1.4)`) y el chulo se dibuja con `stroke-dashoffset` entre 0.15 y
  0.45 s.
- **Después se queda quieto para siempre.** Una insignia que parpadea sin parar parece una
  alarma, no un sello de confianza.

## 2. ● Disponible ahora — **EN BUCLE** (una de las dos únicas)

Marca los puestos que se pueden usar en este momento. Se gana el bucle porque **informa de
algo que está pasando ahora mismo**.

- **Qué dibujar:** un **punto relleno** del color de acento, radio 3.5, con un anillo
  exterior.
- **Animación · bucle de 2.4 s:** el punto mantiene su opacidad y **el anillo exterior
  crece** de escala 1 a 2.2 mientras se desvanece de 0.5 a 0. Como la onda de un radar.
- **Muy suave.** Si en una lista de seis puestos las ondas distraen, bájale la opacidad
  máxima a 0.3.

## 3. 💵 Pago recibido — **animación de entrada, UNA VEZ**

- **Qué dibujar:** un **billete** simple con un chulo pequeño en la esquina.
- **Animación (0.6 s):** entra desde abajo 6 px mientras aparece; el chulo se dibuja al
  final (0.35 – 0.6 s).
- Color: **acento 2**, no el acento principal. Es un cierre, no una llamada a la acción.

## 4. ⏳ Pago en proceso — **EN BUCLE** (la segunda y última)

Se gana el bucle porque **algo se está moviendo de verdad** en el banco.

- **Qué dibujar:** un **reloj de arena** de trazo, muy simple.
- **Animación · bucle de 3 s:** rota 180 grados en 0.6 s, se queda quieto 2.4 s, y repite.
  El giro con `cubic-bezier(.4,0,.2,1)`.
- Color: **`#e8c46a`** (el amarillo de advertencia), no el acento.

## 5. 🔌 Tipo de puerto, ⚡ potencia, 📐 tamaño — **SIN ANIMACIÓN**

Son datos, no estados. Se quedan quietos. Aquí solo se pide que sean **iconos de trazo
coherentes** con el resto: un conector, un rayo y una regla, todos de 2 px, todos con la
misma "mano".

## 6. Ícono de la app (el rayo de la marca)

Ya existe: un rayo en el logo. Lo que se pide es la versión animada **solo para la
pantalla de carga inicial**.

- **`viewBox="0 0 100 100"`**.
- El rayo **se dibuja solo** con `stroke-dashoffset` en 0.8 s, luego **se rellena** con el
  color de acento en 0.3 s.
- **Una sola vez.** En cuanto la app carga, desaparece.

---

## Prompt para la IA generativa (vecino verificado)

> Ícono vectorial SVG de **insignia de "vecino verificado"** para una aplicación web
> oscura, estilo línea minimalista-futurista. Fondo transparente.
>
> `viewBox="0 0 24 24"`. Se mostrará a solo 16px de alto, así que debe ser **extremadamente
> simple**: un escudo de contorno con una marca de verificación (chulo) dentro. Trazo de
> 2px con extremos y uniones redondeados, en color `#3ad4e6`, en una capa llamada "acento".
> Sin relleno, sin degradados, sin sombras, sin detalles interiores.
>
> Animación de **una sola pasada, sin bucle**, de 0.5 segundos, con CSS `@keyframes`
> animando solo `transform`, `opacity` y `stroke-dashoffset`: el escudo entra escalando de
> 0.7 a 1 con `cubic-bezier(.2,.8,.3,1.4)` mientras pasa de opacidad 0 a 1; y entre los
> 0.15 y los 0.45 segundos el chulo se dibuja solo mediante `stroke-dashoffset`.
>
> Usa `animation-fill-mode: forwards` para que al terminar quede quieto y visible
> permanentemente: **no debe repetirse ni parpadear**. Sin texto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Máximo 4 KB.

## Antes de darlos por buenos

- [ ] **A 16 px se distingue qué es cada uno.** Míralos al tamaño real, no ampliados: es
      el error clásico.
- [ ] **Solo dos se mueven en bucle** ("disponible ahora" y "pago en proceso"). Si hay
      más, la pantalla se vuelve una feria.
- [ ] Pon seis tarjetas de puesto juntas en pantalla: **¿las ondas de "disponible ahora"
      distraen?** Si sí, baja la opacidad.
- [ ] Todos tienen el mismo grosor de trazo y la misma "mano". Deben verse hermanos.
- [ ] Los que son de estado usan el color que les toca (amarillo para espera, acento 2
      para cerrado), no todos el acento principal.
