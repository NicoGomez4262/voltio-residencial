# 02 · Camioneta pickup

> Lee antes `00-GUIA-GENERAL.md`. **Y lee `01-carro-automovil.md`**: las medidas, las
> capas, las tres animaciones y el checklist son idénticos. Aquí solo va lo que cambia.

## Por qué importa

Es el vehículo **por defecto** de la app: el que ve quien nunca entra a Ajustes. Es el
que más gente va a mirar, así que es el que mejor tiene que estar hecho.

## Medidas

Idénticas a las del sedán: `viewBox="0 0 520 300"`, suelo en y=250, llantas en
**(125, 232)** y **(400, 232)** con radio 34.

**La diferencia:** la pickup es más alta y más recta. El techo llega a **y=100** (10 px
más arriba que el sedán) y el capó es notablemente más alto.

## Cómo debe verse

**Lo que la hace una pickup y no otra cosa:**
- **El platón trasero.** Es su firma y tiene que ser inconfundible: un cajón abierto,
  plano, que ocupa **el tercio trasero** del vehículo, con el borde superior recto a la
  altura del capó. Si esto no se ve claro, el dibujo falló.
- **Cabina corta y cuadrada**, adelantada, con dos ventanas rectas (nada de curvas
  deportivas). El parabrisas es más vertical que el del sedán.
- **Capó alto y plano**, casi horizontal, que termina en un frente vertical y robusto.
- **Separación visible entre la cabina y el platón** — una línea vertical que las
  divide.
- Aspecto de herramienta de trabajo: sólida, con los ángulos más marcados.

Todo lo demás (degradados, contorno, cristales, llantas, piezas de acento) igual que el
sedán.

**Detalle propio:** en el borde trasero, un **rectángulo rojo `#ff5d6c` de 7x26** en
(28, 190) haciendo de piloto trasero. No lleva acento: es rojo siempre.

**Tapa de carga:** en (452, 195), igual que el sedán.

## Las tres animaciones

Exactamente las mismas del sedán (`01-carro-automovil.md`): **Reposo 5.5 s**,
**Cargando 2.4 s**, **Listo 4 s**, todas en bucle.

**Dos ajustes por el peso del vehículo:**

1. **La flotación es de 6 px, no de 7.** Una pickup pesa más; si flota igual que un
   sedán se ve de juguete.
2. **Añade un balanceo mínimo**: además de subir y bajar, el cuerpo rota **0.4 grados**
   con un ciclo de 5.5 s desfasado 1.4 s respecto de la flotación. El eje de giro va en
   el centro del vehículo, a la altura de las llantas (`transform-origin: 262px 232px`).
   Es casi imperceptible y es justo lo que la hace sentir pesada.

```css
@keyframes flotar-pesado { 0%,100% { transform: translateY(0) rotate(0deg); }
                            50% { transform: translateY(-6px) rotate(-0.4deg); } }
.carro { animation: flotar-pesado 5.5s ease-in-out infinite; transform-origin: 262px 232px; }
```

## Prompt para la IA generativa

> Ilustración vectorial SVG de una **camioneta pickup eléctrica en vista lateral pura**,
> mirando a la derecha, estilo minimalista-futurista de tablero automotriz. Sin
> perspectiva, fondo transparente.
>
> `viewBox="0 0 520 300"`. El vehículo ocupa de x=30 a x=490 y de y=100 a y=250. Llantas
> centradas en (125,232) y (400,232), radio 34.
>
> Silueta: es la más recta y robusta de una familia de cuatro vehículos. Su rasgo
> inconfundible es el **platón trasero abierto**, un cajón plano que ocupa el tercio
> trasero con el borde superior recto. Cabina corta y cuadrada adelantada, con dos
> ventanas rectas y parabrisas casi vertical. Capó alto y plano que termina en un frente
> vertical. Una línea vertical marca la separación entre la cabina y el platón. Ángulos
> marcados, aspecto de vehículo de trabajo.
>
> Carrocería con degradado vertical de `#2b3550` arriba a `#151b2c` en medio y `#0b0f1a`
> abajo, reflejo blanco al 28% en el borde superior del capó y el techo, contorno de
> 1.5px en `rgba(130,170,225,0.28)`. Ventanas con degradado diagonal de `#6ff0ff` al 55%
> a `#0a1830` al 90%. Llantas negras `#0a0f18`, aro `#1c2740`, radios `#38507e`. Un
> rectángulo redondeado rojo `#ff5d6c` de 7x26 en (28,190) como piloto trasero.
>
> En una capa separada llamada "acento", con el color `#3ad4e6`: el faro delantero, su
> halo difuminado, el aro exterior de cada rin, el centro del rin, y el aro de la tapa de
> carga (círculo de radio 13 centrado en (452,195)).
>
> Animación en bucle infinito de 5.5 segundos con CSS `@keyframes`, animando solo
> `transform` y `opacity`: el vehículo sube y baja 6px y a la vez rota −0.4 grados con
> origen en (262,232), con `ease-in-out`, para que se sienta pesado; la elipse de sombra
> pasa de opacidad 0.45 y escala horizontal 1 a opacidad 0.28 y escala 0.92; el núcleo de
> la tapa de carga late aparte con ciclo propio de 2.6 segundos entre opacidad 0.40 y
> 0.85. Las llantas no giran.
>
> Primer fotograma en reposo, bucle sin salto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Sin texto dentro de la imagen. Máximo 40 KB.

## Antes de darlo por bueno

Además del checklist del sedán:

- [ ] **El platón se entiende sin explicación.** Enséñaselo a alguien: si duda entre
      pickup y SUV, el dibujo falló.
- [ ] Se ve más pesada que el sedán, no solo más grande.
- [ ] A 320 px de ancho el corte entre cabina y platón sigue distinguiéndose.
