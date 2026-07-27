# 06 · Fondo de la aplicación

> **Cambio de enfoque:** este archivo ya no pide una ilustración vectorial, sino **una
> imagen atmosférica fotorrealista/pictórica generada por IA**, más una animación descrita
> aparte — pero, a diferencia de los carros, aquí la recomendación es **no** usar una IA
> de video. Se explica por qué más abajo. `05, 07, 08, 09, 10` siguen con el método
> vectorial anterior hasta que se rehagan.

## Por qué y la regla más estricta de toda la carpeta

Es el fondo detrás de **cada pantalla, todo el tiempo**. Es donde más se gana con menos:
una atmósfera con movimiento casi imperceptible hace que la app se sienta viva sin
robarle atención a nada.

**Regla que no se negocia: si el usuario nota el fondo, está mal.** Solo debe notarlo si
lo mira fijamente a propósito, nunca de reojo mientras reserva un puesto o revisa un
pago.

## Por qué esta vez NO recomiendo una IA de video

Los carros son un momento puntual (la pantalla de inicio, unos segundos de atención). El
fondo, en cambio, **está corriendo todo el rato, en todas las pantallas**. Un video de
fondo en bucle constante:

- Obliga al navegador a decodificar video de forma continua → **gasta batería** en el
  celular de tu vecino de una manera que un carro que se ve 5 segundos no gasta.
- Pesa más que una imagen fija + un poco de CSS, y esa diferencia se paga en **cada
  pantalla que se abre**, no una sola vez.

Por eso aquí el plan es: **una sola imagen fija generada con IA** (la atmósfera), animada
después con **CSS puro** — exactamente como ya funciona el resto de microinteracciones de
la app (ripples, success-pop). Es la buena práctica real para un fondo persistente, no
una limitación del método.

## Encuadre y qué tan grande hay que generarla

- **Formato maestro: 2400×1350 px (relación 16:9)**, pensada para cubrirse con
  `object-fit: cover` desde 320×568 (celular) hasta 2560×1440 (monitor grande) sin
  recortes que arruinen la composición.
- **Composición centrada y sin ningún punto focal fuerte.** Nada de formas reconocibles,
  nada de un "objeto" que el ojo busque. Es una atmósfera, no una escena.
- **Debe seguir funcionando con cualquier contenido encima**: tarjetas, texto, botones.
  Prueba mental: si no puedes leer un párrafo de texto claro sobre ella sin esfuerzo,
  está demasiado cargada.
- Sin bordes duros ni límites visibles: todo se desvanece hacia las esquinas.

## Qué pintar: la atmósfera

Una versión fotográfica/pictórica, mucho más rica que la rejilla plana actual, pero
igual de contenida:

1. **Base:** un ambiente oscuro tipo estudio o estacionamiento moderno desenfocado —
   sugiere estructura (líneas arquitectónicas suaves, quizás vigas o columnas muy
   desenfocadas al fondo) sin que se reconozca literalmente un lugar. Tonos entre
   `#0a0c11` y `#12151c`.
2. **Una rejilla arquitectónica muy sutil**, insinuada más que dibujada — como si se
   intuyeran las líneas de un techo o un piso de concreto muy desenfocado, no una
   cuadrícula gráfica perfecta como la actual. Apenas perceptible, casi textura.
2. **Dos resplandores atmosféricos** del color de acento, como si fueran reflejos de luz
   ambiental lejana (no focos, no fuentes de luz reconocibles): uno grande arriba a la
   izquierda, cubriendo cerca del 70 % del ancho a baja intensidad; otro más pequeño a la
   derecha, a media altura, más tenue todavía. Ambos muy desenfocados, sin bordes duros.
4. **Grano fotográfico fino** (film grain sutil) en vez de la textura vectorial plana:
   esto es lo que más diferencia a esta versión de la anterior — se siente fotografiado,
   no dibujado.

## La única imagen — sirve como inicio y como final (es un bucle)

Como toda la animación de este fondo es un bucle continuo, **se genera una sola imagen**:
es al mismo tiempo el primer y el último fotograma. No hace falta una segunda imagen.

- Atmósfera oscura descrita arriba, con los dos resplandores de acento en su posición e
  intensidad **promedio** (ni al mínimo ni al máximo de su respiración — el punto medio
  del ciclo, para que la animación de CSS pueda subir y bajar la intensidad en ambas
  direcciones desde ahí).
- Grano fotográfico fino visible pero discreto.
- Composición sin ningún punto focal fuerte, válida para cubrir cualquier proporción de
  pantalla.

## La animación — en bucle, con CSS puro (no con IA de video)

Sobre la única imagen generada, se aplican capas de movimiento con CSS, igual que ya hace
el resto de la app:

| Qué | Cómo | Duración | Nota |
|---|---|---|---|
| **Zoom respirado** (*Ken Burns* casi inmóvil) | `transform: scale()` de 1.00 a 1.015 | 24 s, ida y vuelta, `ease-in-out` | El movimiento más lento de toda la app — si se nota, se baja aún más |
| **Resplandor principal** | `filter: brightness()` sobre una máscara de esa zona, o una capa de degradado radial superpuesta que sube y baja de opacidad | 12 s | Independiente del zoom |
| **Resplandor secundario** | Igual que el principal | 17 s, con 3 s de retraso | Deliberadamente distinto de 12 s: nunca coincide con el principal |

```css
.fondo-app {
  background-image: url('fondo.webp');
  background-size: cover;
  background-position: center;
  animation: respirar-fondo 24s ease-in-out infinite;
}
.fondo-app::before, .fondo-app::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(60% 50% at 20% 0%, rgba(var(--accent-rgb), .14), transparent 70%);
}
.fondo-app::after {
  background: radial-gradient(50% 45% at 85% 40%, rgba(var(--accent-rgb), .07), transparent 70%);
  animation: brillar-secundario 17s ease-in-out infinite 3s;
}
.fondo-app::before { animation: brillar-principal 12s ease-in-out infinite; }

@keyframes respirar-fondo     { 0%,100% { transform: scale(1); } 50% { transform: scale(1.015); } }
@keyframes brillar-principal  { 0%,100% { opacity: .7; } 50% { opacity: 1; } }
@keyframes brillar-secundario { 0%,100% { opacity: .6; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .fondo-app, .fondo-app::before, .fondo-app::after { animation: none !important; }
}
```

Esto reutiliza el mismo esqueleto de variables de color que ya usa toda la app
(`--accent-rgb`), así que **los resplandores sí cambian con el acento del usuario** sin
regenerar la imagen — solo la atmósfera base de fondo (el ambiente oscuro y el grano) es
fija; el color vivo va siempre en la capa CSS, nunca "horneado" en la imagen.

> **Por qué esto es mejor que pedirle el resplandor de color a la IA de imágenes:**
> si el resplandor quedara pintado dentro de la imagen, habría que generar 5 versiones
> (una por acento) de una imagen que pesa mucho más que un simple `radial-gradient` de
> CSS. Separando el color en una capa de CSS, **una sola imagen sirve para los cinco
> acentos** y el archivo pesa una fracción de lo que pesaría regenerarla cinco veces.

## Prompt listo para la IA de imágenes

> Fondo atmosférico oscuro fotorrealista para una aplicación web de estilo
> minimalista-futurista, formato 2400×1350px (relación 16:9). **Debe ser extremadamente
> sutil y sin ningún punto focal reconocible** — es una atmósfera, no una escena con
> objetos.
>
> Ambiente: un espacio oscuro tipo estudio o estacionamiento moderno, completamente
> desenfocado, con apenas la insinuación de líneas arquitectónicas suaves (posibles vigas
> o bordes de concreto muy fuera de foco) en tonos que van de `#0a0c11` a `#12151c`. Sin
> ninguna forma, objeto, vehículo, persona ni texto reconocible en ningún punto de la
> imagen.
>
> Dos zonas de resplandor ambiental muy suave y difuso, en un tono neutro azulado-grisáceo
> tenue (no un color vivo, solo una insinuación de temperatura de luz): una grande arriba
> a la izquierda cubriendo cerca del 70% del ancho a baja intensidad, otra más pequeña y
> más tenue a la derecha, a media altura. Ambas completamente desenfocadas, sin bordes
> definidos, mezclándose con el fondo.
>
> Grano fotográfico fino y sutil en toda la imagen, dándole una textura fotografiada en
> vez de una apariencia digital plana. Composición sin ningún punto de atención fuerte,
> válida para verse recortada tanto en formato vertical de celular como en formato
> horizontal ancho de escritorio sin perder su sentido — todo el interés visual debe
> repartirse suavemente, no concentrarse en una zona que se pueda recortar.
>
> Sin texto, sin marcas de agua, sin logotipos, sin ningún color vivo o saturado (los
> acentos de color se añaden después por separado). Alta resolución, fotorrealista con
> grano sutil, extremadamente minimalista y de bajísimo contraste.

## Antes de darlo por bueno

- [ ] **Míralo 30 segundos seguidos.** Si distrae, hay que bajarle aún más la intensidad
      antes de generarla de nuevo.
- [ ] Pon una tarjeta de contenido con texto encima: se debe leer sin ningún esfuerzo.
- [ ] Recortada en 320×568 (celular) y en 2560×1440 (monitor grande) con `object-fit:
      cover`, ninguna de las dos versiones muestra un "vacío" raro ni corta algo
      importante — porque no hay nada importante que cortar, esa es la prueba.
- [ ] El grano fotográfico se nota como textura, no como ruido digital molesto.
- [ ] Con los cinco acentos de la app (cian, verde, violeta, dorado, rosa) aplicados por
      CSS encima, ninguno se ve sucio o desentona con el tono base de la imagen.
- [ ] Pesa poco: apunta a menos de 200 KB en WebP para la imagen fija; sin video de fondo
      corriendo nunca.
