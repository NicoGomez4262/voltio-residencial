# 01 · Automóvil (sedán)

> Lee antes `00-GUIA-GENERAL.md`. Aquí solo va lo propio de este vehículo.

## Dónde se usa

Es uno de los cuatro vehículos que el vecino elige como "su carro". Aparece:

1. **En la pantalla de inicio**, flotando suavemente, apenas entra a la app. Es lo
   primero que ve y lo que hace que sienta que la app es *suya*.
2. **En la animación de cobro**, conectado al cargador mientras suben los kWh.

Como el vecino lo escoge a propósito, tiene que reconocerse **de un vistazo** frente a
los otros tres. La silueta manda.

## Medidas

- **`viewBox="0 0 520 300"`**, relación 26:15.
- El carro ocupa de **x=30 a x=490** y de **y=110 a y=250**. Nunca toca los bordes.
- **Suelo en y=250.** Las llantas se apoyan ahí, no lo atraviesan.
- **Llantas:** centros en **(125, 232)** y **(400, 232)**, radio **34**.
- Se muestra a unos 340 px de ancho en celular y 560 px en PC. **Verifícalo a 320 px:**
  a ese tamaño la silueta tiene que seguir leyéndose como un sedán.

## Cómo debe verse

Vista **lateral pura**, mirando a la derecha. Sin perspectiva, sin 3/4: es un perfil
limpio, casi de icono técnico, pero con volumen por el degradado.

**Lo que lo hace un sedán y no otra cosa:**
- El más **bajo** de los cuatro: el techo no pasa de y=110.
- **Capó largo y bajo** que sube en curva suave hacia el parabrisas.
- **Techo curvo** que cae en diagonal hacia un **baúl marcado** atrás — esa caída es
  su firma. Sin ella parece un hatchback.
- Voladizos cortos, aspecto pegado al piso.
- **Dos ventanas** separadas por un pilar delgado.

**Acabado:** carrocería con degradado vertical (`#2b3550` arriba → `#151b2c` medio →
`#0b0f1a` abajo), un brillo blanco al 28 % en el borde superior del capó y el techo, y
contorno de 1.5 px en `rgba(130,170,225,0.28)`.

**Piezas que llevan el color del usuario** (capa `acento`, ver guía):
faro delantero, halo del faro, aro de la llanta, centro del rin, y el aro de la tapa
de carga. Nada más.

**La tapa de carga** va en el guardabarros delantero derecho, en **(452, 195)**: un
círculo de radio 13 con borde claro y un núcleo que respira.

## Animación A · Reposo (la del inicio) — **EN BUCLE**

La principal. Es lo que el vecino ve al abrir la app.

- **Duración: 5.5 s**, bucle infinito, `ease-in-out`.
- El carro entero **sube y baja 7 px**. Nada más. Sin girar, sin inclinarse.
- **La sombra del piso responde:** cuando el carro está arriba, la sombra se achica al
  92 % y baja su opacidad de 0.45 a 0.28. Este detalle es el 80 % del efecto.
- **El núcleo de la tapa de carga late** aparte: 2.6 s, opacidad 0.4 → 0.85 → 0.4.
  Que *no* coincida con la flotación, así se ve orgánico.
- Las **llantas quietas**. El carro está parqueado.
- Bajo las llantas, una **línea de suelo** del color de acento, opacidad 0.55.

```css
@keyframes flotar   { 0%,100% { transform: translateY(0); }    50% { transform: translateY(-7px); } }
@keyframes sombra   { 0%,100% { opacity: .45; transform: scaleX(1); } 50% { opacity: .28; transform: scaleX(.92); } }
@keyframes respirar { 0%,100% { opacity: .40; } 50% { opacity: .85; } }

.carro  { animation: flotar   5.5s ease-in-out infinite; }
.sombra { animation: sombra   5.5s ease-in-out infinite; transform-origin: center; }
.nucleo { animation: respirar 2.6s ease-in-out infinite; }
```

## Animación B · Cargando — **EN BUCLE**

Cuando está conectado al cargador.

- **Duración: 2.4 s**, bucle.
- **Sube y baja solo 3 px** (más contenido que en reposo: está trabajando, no flotando).
- **Anillo de la tapa de carga:** dos ondas que salen desde el centro, crecen del 100 %
  al 260 % y se desvanecen. La segunda arranca 0.8 s después de la primera.
- **Cinco a siete chispitas** alrededor de la tapa, subiendo 12 px mientras se apagan,
  cada una con un retardo distinto entre 0 y 1.2 s.
- **El faro se enciende un poco más:** opacidad 0.7 → 1 → 0.7.

## Animación C · Listo — **EN BUCLE, más calmado**

Carga terminada.

- **Duración: 4 s.**
- Flotación de 5 px, sin chispas.
- El acento pasa al **acento 2** (el color secundario) en el faro y el aro de carga.
- Un **destello suave recorre la carrocería** de atrás hacia adelante una vez por bucle:
  una banda blanca al 12 % de opacidad, en diagonal, que cruza en 1.2 s y no vuelve
  hasta el siguiente ciclo.

## Capas a entregar

```
sombra          (elipse bajo el carro, se anima aparte)
piso            (línea de acento)
carroceria      (degradado + brillo + contorno)
ventanas        (cristal diagonal)
llanta-trasera  (aro + rin + centro)
llanta-delantera
acento          ← faro, halo, aros de rin, aro de carga
tapa-carga      (base + anillo + núcleo + chispas)
```

## Prompt para la IA generativa

> Ilustración vectorial SVG de un **automóvil sedán eléctrico en vista lateral pura**,
> mirando a la derecha, estilo minimalista-futurista de tablero automotriz. Sin
> perspectiva, sin fondo (transparente).
>
> `viewBox="0 0 520 300"`. El carro ocupa de x=30 a x=490 y de y=110 a y=250. Llantas
> centradas en (125,232) y (400,232), radio 34. Ninguna parte toca los bordes.
>
> Silueta: el más bajo y deportivo de una familia de cuatro vehículos. Capó largo que
> sube en curva suave, techo curvo que cae en diagonal hacia un baúl marcado, voladizos
> cortos, dos ventanas laterales separadas por un pilar delgado.
>
> Carrocería con degradado vertical de `#2b3550` arriba a `#151b2c` en medio y `#0b0f1a`
> abajo, con un reflejo blanco al 28% de opacidad en el borde superior del capó y el
> techo, y un contorno de 1.5px en `rgba(130,170,225,0.28)`. Ventanas con degradado
> diagonal de `#6ff0ff` al 55% a `#0a1830` al 90%. Llantas negras `#0a0f18` con aro
> `#1c2740` y radios finos `#38507e`.
>
> En una capa separada llamada "acento", con el color `#3ad4e6`: el faro delantero (un
> rectángulo redondeado de 26x7 en (462,179)), su halo difuminado, el aro exterior de
> cada rin, el centro del rin, y el aro de la tapa de carga (círculo de radio 13
> centrado en (452,195)).
>
> Animación en bucle infinito de 5.5 segundos con CSS `@keyframes`, animando únicamente
> `transform` y `opacity`: el carro completo sube y baja 7px con `ease-in-out`; la elipse
> de sombra bajo el carro pasa de opacidad 0.45 y escala horizontal 1 a opacidad 0.28 y
> escala 0.92 en sincronía; y el núcleo de la tapa de carga late aparte con un ciclo
> propio de 2.6 segundos entre opacidad 0.40 y 0.85. Las llantas no giran.
>
> El primer fotograma debe ser el estado de reposo y el bucle debe empalmar sin salto.
> Incluye al final `@media (prefers-reduced-motion: reduce) { * { animation: none
> !important; } }`. Sin ningún texto dentro de la imagen. Peso máximo 40 KB.

## Antes de darlo por bueno

- [ ] A 320 px de ancho se reconoce que es un sedán y no la SUV.
- [ ] El bucle no pega: se puede mirar un minuto sin ver el corte.
- [ ] Cambiando el acento a los cinco colores, se ve bien en todos (probar el dorado
      `#e8c46a`, que es el que peor contrasta).
- [ ] La sombra acompaña al movimiento. Si no, se ve plano y barato.
- [ ] No hay texto dentro de la imagen.
- [ ] Solo se animan `transform` y `opacity`.
