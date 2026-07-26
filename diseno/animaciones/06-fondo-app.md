# 06 · Fondo de la aplicación

> Lee antes `00-GUIA-GENERAL.md`.

## Por qué

Hoy el fondo es una rejilla estática y un resplandor fijo. Está bien, pero es donde
**menos esfuerzo cuesta y más se gana**: un fondo con un movimiento casi imperceptible
hace que toda la app se sienta viva sin robarle atención a nada.

**La regla aquí es más estricta que en cualquier otro archivo: si el usuario nota el
fondo, está mal.** Solo debe notarlo si lo mira fijamente a propósito.

## Medidas

- **Ocupa toda la pantalla**, detrás del contenido. `position: fixed; inset: 0;`
- **Debe funcionar de 320x568 (celular chico) a 2560x1440 (monitor grande)** con el mismo
  archivo. Por eso: `preserveAspectRatio="xMidYMid slice"` y todo definido en
  proporciones, no en píxeles.
- **Nunca genera barra de desplazamiento horizontal.**

## Las tres capas

### 1. Base sólida
Color plano `#0a0c11`. No se anima nunca.

### 2. Rejilla
Líneas finas de 1 px en `rgba(255,255,255,0.025)` formando cuadrícula de **40x40 px**,
con **desvanecimiento hacia los bordes** (más visible en el centro-superior, invisible
abajo). En pantallas de más de 700 px la cuadrícula pasa a 56x56 px, para que no se vea
apretada.

**Animación:** se desplaza **2 px en diagonal** (1 px en x, 1 px en y) en un ciclo de
**20 segundos**, ida y vuelta, `ease-in-out`. Es tan lento que nadie lo ve moverse, pero
la pantalla deja de sentirse muerta.

### 3. Resplandor de acento
Dos manchas radiales grandes y suaves del color de acento:

| Mancha | Posición | Tamaño | Opacidad | Ciclo |
|---|---|---|---|---|
| Principal | 20 % / 0 % (arriba a la izquierda) | 70 % del ancho | 0.10 → 0.16 | 12 s |
| Secundaria | 85 % / 40 % (derecha, media altura) | 50 % del ancho | 0.05 → 0.09 | 17 s |

Las dos **respiran** cambiando opacidad y escala (1 → 1.08), pero con **ciclos primos
entre sí (12 y 17 segundos)**: así nunca coinciden y el patrón no se vuelve predecible.
Ese es el truco.

```css
@keyframes deriva  { 0%,100% { transform: translate(0,0); } 50% { transform: translate(1px,1px); } }
@keyframes brillar { 0%,100% { opacity:.10; transform: scale(1); } 50% { opacity:.16; transform: scale(1.08); } }

.rejilla  { animation: deriva  20s ease-in-out infinite; }
.glow-1   { animation: brillar 12s ease-in-out infinite; transform-origin: 20% 0%; }
.glow-2   { animation: brillar 17s ease-in-out infinite 3s; transform-origin: 85% 40%; opacity:.05; }
```

## Variante opcional: partículas

**Solo si la primera versión se ve demasiado quieta.** Entre 6 y 10 puntos de 1.5 a 2.5 px
en color de acento al 12 % de opacidad, subiendo muy lentamente (40 a 70 segundos de
recorrido completo) y desvaneciéndose al llegar arriba.

**Condiciones para aceptarla:**
- Máximo 10 puntos. Con más, el celular gasta batería.
- Se apagan por completo con `prefers-reduced-motion`.
- Si al mirar la app tu ojo se va a un punto, sobran los puntos.

## Prompt para la IA generativa

> Fondo vectorial SVG a pantalla completa para una aplicación web oscura de estilo
> minimalista-futurista. Debe ser **extremadamente sutil**: el usuario no debe notarlo a
> menos que lo mire fijamente.
>
> Tres capas, con `preserveAspectRatio="xMidYMid slice"` para cubrir desde 320x568 hasta
> 2560x1440 con el mismo archivo:
>
> 1. Un fondo sólido de color `#0a0c11`.
> 2. Una rejilla de líneas de 1px en `rgba(255,255,255,0.025)` formando cuadrícula de
>    40x40px, con un desvanecimiento que la hace visible en el centro y la parte
>    superior e invisible hacia abajo y los bordes. En pantallas de más de 700px de
>    ancho la cuadrícula pasa a 56x56px mediante `@media (min-width:700px)`.
> 3. Dos manchas radiales grandes y difusas en color `#3ad4e6` (en una capa llamada
>    "acento"): la principal centrada al 20% horizontal y 0% vertical, de un tamaño
>    equivalente al 70% del ancho, con opacidad base 0.10; y la secundaria centrada al
>    85% horizontal y 40% vertical, de un 50% del ancho, con opacidad base 0.05. Ambas se
>    desvanecen a transparente en los bordes.
>
> Animación en bucle infinito con CSS `@keyframes`, animando únicamente `transform` y
> `opacity`: la rejilla se desplaza 1px en horizontal y 1px en vertical en un ciclo de 20
> segundos de ida y vuelta con `ease-in-out`; la mancha principal varía entre opacidad
> 0.10 y 0.16 con escala de 1 a 1.08 en un ciclo de 12 segundos; y la secundaria varía
> entre opacidad 0.05 y 0.09 con escala de 1 a 1.08 en un ciclo de 17 segundos, con 3
> segundos de retraso inicial. Los ciclos de 12 y 17 segundos son deliberadamente
> distintos para que las dos manchas nunca se sincronicen.
>
> Sin partículas, sin estrellas, sin texto. Nada debe generar desplazamiento horizontal.
> Incluye `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Máximo 15 KB.

## Antes de darlo por bueno

- [ ] **Míralo 30 segundos seguidos.** Si te distrae, hay que bajarle.
- [ ] Pon una tarjeta de contenido encima: el texto tiene que leerse sin esfuerzo.
- [ ] En un monitor de 2560 px no se ve pixelado ni la rejilla se ve gigante.
- [ ] En un celular de 320 px no aparece barra horizontal.
- [ ] Con el acento dorado (`#e8c46a`) el resplandor no se ve amarillento ni sucio: es el
      que peor se lleva con el fondo azulado.
