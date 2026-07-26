# 03 · SUV familiar

> Lee antes `00-GUIA-GENERAL.md` y `01-carro-automovil.md`. Medidas, capas, animaciones
> y checklist son los mismos. Aquí solo lo que cambia.

## Qué transmite

Es el vehículo del vecino de familia: **cómodo, amplio, sin pretensiones deportivas ni
de aventura**. Está entre el sedán y el 4x4, y ese "entre" es justo su dificultad: si se
dibuja mal, se confunde con cualquiera de los dos.

## Medidas

`viewBox="0 0 520 300"`, suelo en y=250, llantas en **(125, 232)** y **(400, 232)**,
radio 34.

**La diferencia:** techo alto y **largo**, de y=98 hasta muy atrás. Es el vehículo con
más superficie acristalada de los cuatro.

## Cómo debe verse

**Lo que la hace una SUV y no una pickup ni un 4x4:**
- **Techo alto pero curvo**, que corre casi horizontal y al final **cae en una curva
  suave** hacia el portón trasero. No termina en escalón (eso sería 4x4) ni en un baúl
  bajo (eso sería sedán).
- **Carrocería de una sola pieza**: nada de cortes entre cabina y carga. Es un volumen
  continuo, y eso es lo que hay que leer de un vistazo.
- **Tres ventanas laterales**, no dos: la delantera, la trasera y una tercera pequeña
  triangular junto al portón. Este detalle es el que la distingue mejor.
- **Buena altura al piso**, con los pasos de rueda marcados y algo de plástico oscuro
  alrededor.
- Líneas redondeadas, sin aristas duras.

**Detalle propio:** una **barra de techo apenas insinuada** — dos líneas horizontales
finas de 1.5 px a lo largo del techo, en `rgba(255,255,255,0.10)`. No es un portaequipajes
completo (eso es del 4x4), es solo una sugerencia.

**Tapa de carga:** en (452, 195).

**Piloto trasero:** rectángulo rojo `#ff5d6c` de 7x26 en (28, 184).

## Las tres animaciones

Las del sedán: **Reposo 5.5 s**, **Cargando 2.4 s**, **Listo 4 s**, en bucle.

**Un ajuste:** la flotación es de **6.5 px** — a medio camino entre el sedán (7) y el 4x4
(5.5). Sin rotación: la SUV es estable, no se balancea.

**Detalle extra que vale la pena en este modelo:** como tiene mucho vidrio, el reflejo de
las ventanas puede moverse. Un **degradado diagonal que se desplaza lentamente** por las
tres ventanas, con ciclo de 8 s (distinto de la flotación, para que no se sincronicen).
Solo `opacity` y `transform`, muy sutil: opacidad máxima 0.18.

```css
@keyframes reflejo { 0%,100% { transform: translateX(-12px); opacity: .06; }
                      50%    { transform: translateX(12px);  opacity: .18; } }
.ventanas-reflejo { animation: reflejo 8s ease-in-out infinite; }
```

## Prompt para la IA generativa

> Ilustración vectorial SVG de una **SUV familiar eléctrica en vista lateral pura**,
> mirando a la derecha, estilo minimalista-futurista de tablero automotriz. Sin
> perspectiva, fondo transparente.
>
> `viewBox="0 0 520 300"`. El vehículo ocupa de x=30 a x=490 y de y=98 a y=250. Llantas
> centradas en (125,232) y (400,232), radio 34.
>
> Silueta: es el vehículo más amplio y redondeado de una familia de cuatro. Techo alto y
> largo, casi horizontal, que al final cae en curva suave hacia el portón trasero —nunca
> en escalón ni en baúl bajo—. Carrocería de un solo volumen continuo, sin cortes.
> **Tres ventanas laterales**: la delantera, la trasera y una tercera pequeña triangular
> junto al portón. Buena altura al piso, pasos de rueda marcados con plástico oscuro
> alrededor, líneas redondeadas sin aristas duras. Dos líneas horizontales finas de
> 1.5px en `rgba(255,255,255,0.10)` a lo largo del techo insinuando una barra.
>
> Carrocería con degradado vertical de `#2b3550` arriba a `#151b2c` en medio y `#0b0f1a`
> abajo, reflejo blanco al 28% en el borde superior, contorno de 1.5px en
> `rgba(130,170,225,0.28)`. Ventanas con degradado diagonal de `#6ff0ff` al 55% a
> `#0a1830` al 90%. Llantas negras `#0a0f18`, aro `#1c2740`, radios `#38507e`. Un
> rectángulo redondeado rojo `#ff5d6c` de 7x26 en (28,184) como piloto trasero.
>
> En una capa separada llamada "acento", con `#3ad4e6`: faro delantero, su halo, aro
> exterior y centro de cada rin, y el aro de la tapa de carga (círculo de radio 13 en
> (452,195)).
>
> Animación en bucle infinito con CSS `@keyframes`, solo `transform` y `opacity`: el
> vehículo sube y baja 6.5px en 5.5 segundos con `ease-in-out`, sin rotar; la sombra pasa
> de opacidad 0.45 y escala horizontal 1 a opacidad 0.28 y escala 0.92 en sincronía; el
> núcleo de la tapa de carga late aparte cada 2.6 segundos entre opacidad 0.40 y 0.85; y
> un reflejo claro se desplaza sobre las tres ventanas con un ciclo propio de 8 segundos,
> moviéndose 12px a cada lado y variando entre opacidad 0.06 y 0.18. Las llantas no giran.
>
> Primer fotograma en reposo, bucle sin salto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Sin texto en la imagen. Máximo 45 KB.

## Antes de darlo por bueno

Además del checklist del sedán:

- [ ] **Se distingue del 4x4 sin dudarlo.** Ponlos lado a lado: la SUV es curva, el 4x4
      es cuadrado. Si se parecen, hay que exagerar más la curva del portón.
- [ ] **Se distingue de la pickup:** no hay ningún corte en la carrocería.
- [ ] La tercera ventana triangular se ve incluso a 320 px.
- [ ] El reflejo de las ventanas no compite con el latido de la tapa de carga (van a
      ritmos distintos: 8 s contra 2.6 s).
