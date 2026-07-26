# 04 · 4x4 alto

> Lee antes `00-GUIA-GENERAL.md` y `01-carro-automovil.md`. Medidas, capas, animaciones
> y checklist son los mismos. Aquí solo lo que cambia.

## Qué transmite

El vehículo de aventura del conjunto: **cuadrado, alto, con actitud**. Es el que más se
aleja del sedán, así que es el más fácil de distinguir — y por eso el que peor queda si
se dibuja tímido. **Exagéralo**: mejor demasiado cuadrado que ambiguo.

## Medidas

`viewBox="0 0 520 300"`, suelo en y=250, llantas en **(125, 232)** y **(400, 232)**.

**Dos diferencias importantes:**
- **El techo es el más alto de los cuatro: y=90.**
- **Las llantas son más grandes: radio 38**, no 34. Y llevan un dibujo de taco más
  marcado (unas muescas en el borde exterior, nada literal, solo insinuadas).

## Cómo debe verse

**Lo que lo hace un 4x4 y no una SUV:**
- **Todo recto.** El techo es una línea horizontal plana de punta a punta, y el portón
  trasero cae **en vertical**, en ángulo casi recto. Nada de curvas de despedida.
- **Ventanas rectangulares**, grandes y planas, con el marco marcado. Parabrisas casi
  vertical.
- **Frente vertical y plano**, tipo caja.
- **Buena luz al piso**: se ve espacio entre la carrocería y el suelo, más que en
  cualquier otro de los cuatro.
- **Barra de techo real**, no insinuada: una línea horizontal gruesa de 3 px en
  `rgba(255,255,255,0.22)` que sobresale unos píxeles por delante y por detrás del techo,
  con dos soportes verticales cortos.
- **Estribo lateral**: un rectángulo horizontal oscuro
  (`rgba(0,0,0,0.35)`, alto 9 px) corriendo entre las dos llantas, a la altura de los
  bajos. Este detalle es el que lo termina de vender.

**Tapa de carga:** en (452, 190) — un poco más arriba que en los demás, porque el
vehículo es más alto.

**Piloto trasero:** rectángulo rojo `#ff5d6c` de 7x30 en (28, 160).

## Las tres animaciones

Las del sedán: **Reposo 5.5 s**, **Cargando 2.4 s**, **Listo 4 s**, en bucle.

**Ajustes por el peso y la suspensión:**

1. **La flotación es de solo 5.5 px** — es el más pesado, casi no se mece.
2. **Suspensión visible:** las dos llantas se quedan pegadas al piso mientras la
   carrocería sube y baja. O sea: **anima solo el grupo de la carrocería, no las
   llantas**. Es el único de los cuatro donde vale la pena esta separación, porque su
   altura al piso la hace evidente.
3. **La barra de techo y el estribo suben con la carrocería**, no con las llantas.

```css
/* Solo la carrocería se mueve; las llantas quedan clavadas en el piso. */
@keyframes suspension { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5.5px); } }
.carroceria { animation: suspension 5.5s ease-in-out infinite; }
.llantas    { /* sin animación: apoyadas en el suelo */ }
.sombra     { animation: sombra 5.5s ease-in-out infinite; }
```

## Prompt para la IA generativa

> Ilustración vectorial SVG de un **todoterreno 4x4 eléctrico en vista lateral pura**,
> mirando a la derecha, estilo minimalista-futurista de tablero automotriz. Sin
> perspectiva, fondo transparente.
>
> `viewBox="0 0 520 300"`. El vehículo ocupa de x=30 a x=490 y de y=90 a y=250. Llantas
> grandes centradas en (125,232) y (400,232), radio 38, con muescas insinuadas en el
> borde exterior sugiriendo dibujo de taco.
>
> Silueta: es el más cuadrado y alto de una familia de cuatro vehículos, y hay que
> exagerarlo. Techo completamente plano y horizontal de punta a punta. Portón trasero que
> cae en vertical, en ángulo casi recto, sin ninguna curva. Ventanas rectangulares
> grandes y planas con el marco marcado, parabrisas casi vertical. Frente vertical y
> plano tipo caja. Buena altura al piso, con espacio visible entre la carrocería y el
> suelo. Una barra de techo real: línea horizontal de 3px en `rgba(255,255,255,0.22)` que
> sobresale por delante y por detrás del techo, con dos soportes verticales cortos. Un
> estribo lateral: rectángulo horizontal de 9px de alto en `rgba(0,0,0,0.35)` corriendo
> entre las dos llantas a la altura de los bajos.
>
> Carrocería con degradado vertical de `#2b3550` arriba a `#151b2c` en medio y `#0b0f1a`
> abajo, reflejo blanco al 28% en el borde superior, contorno de 1.5px en
> `rgba(130,170,225,0.28)`. Ventanas con degradado diagonal de `#6ff0ff` al 55% a
> `#0a1830` al 90%. Llantas negras `#0a0f18`, aro `#1c2740`, radios `#38507e`. Un
> rectángulo redondeado rojo `#ff5d6c` de 7x30 en (28,160) como piloto trasero.
>
> En una capa separada llamada "acento", con `#3ad4e6`: faro delantero, su halo, aro
> exterior y centro de cada rin, y el aro de la tapa de carga (círculo de radio 13 en
> (452,190)).
>
> Animación en bucle infinito de 5.5 segundos con CSS `@keyframes`, solo `transform` y
> `opacity`, con un detalle clave: **solo la carrocería sube y baja 5.5px con
> `ease-in-out`; las dos llantas se quedan quietas apoyadas en el suelo**, simulando la
> suspensión. La barra de techo y el estribo se mueven con la carrocería. La elipse de
> sombra pasa de opacidad 0.45 y escala horizontal 1 a opacidad 0.28 y escala 0.92 en
> sincronía. El núcleo de la tapa de carga late aparte cada 2.6 segundos entre opacidad
> 0.40 y 0.85. Las llantas no giran.
>
> Primer fotograma en reposo, bucle sin salto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Sin texto en la imagen. Máximo 45 KB.

## Antes de darlo por bueno

Además del checklist del sedán:

- [ ] **El efecto de suspensión se nota.** Es lo que hace especial a este modelo: mira
      la separación entre llanta y carrocería mientras flota. Si las llantas suben con
      el cuerpo, se perdió el detalle.
- [ ] Puesto al lado de la SUV, no hay ninguna duda de cuál es cuál.
- [ ] La barra de techo y el estribo se distinguen a 320 px de ancho.
- [ ] Las llantas se ven claramente más grandes que las de los otros tres.
