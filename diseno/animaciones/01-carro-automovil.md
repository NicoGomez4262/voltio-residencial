# 01 · Automóvil (sedán) — "Gran turismo silencioso"

> **Cambio de enfoque respecto a la carpeta original:** este archivo ya no pide código
> SVG. Pide **dos fotografías fotorrealistas** (imagen de inicio e imagen final) para una
> IA generativa de imágenes, y por separado **el movimiento entre ellas** para una IA de
> video por fotogramas clave (Runway, Kling, Pika, Luma o similar). `05, 07, 08, 09, 10`
> siguen con el método anterior (SVG/CSS) hasta que se rehagan.

## Dónde se usa y por qué esta es la que más nos jugamos

Es el vehículo que aparece en la pantalla de inicio cuando el vecino elige "Automóvil" en
Ajustes. **Cada carro tiene su propia personalidad de animación** — no es el mismo
movimiento con otra carrocería. La del sedán es la más elegante y calmada de las cuatro:
transmite un GT silencioso, seguro de sí mismo, sin necesidad de gritar. Es justo lo
opuesto a la energía del 4x4 o el tono utilitario de la pickup.

## El vehículo: en qué carro real nos basamos (sin copiar una marca)

Un sedán eléctrico tipo *gran turismo*, con el lenguaje visual de los eléctricos premium
actuales — piensa en la familia de sedanes eléctricos aerodinámicos que ya circulan hoy
(perfil tipo fastback, sin parrilla). **No lleva ningún logotipo, insignia ni nombre de
modelo**: es un diseño genérico inspirado en esa familia, no la réplica de una marca.

Rasgos que lo definen:
- **Perfil fastback**: el techo cae en una sola curva continua desde el parabrisas hasta
  la cajuela, sin quiebre — no es un sedán de tres volúmenes clásico, es más deportivo.
- **Carrocería baja, ancha y de voladizos cortos** — la batería va en el piso, así que no
  hay motor al frente que empuje el capó hacia adelante.
- **Frente cerrado, sin parrilla**: un panel liso donde debería ir la rejilla, con una
  **franja de luz LED delgada y continua** que cruza de faro a faro — su firma lumínica.
- **Manijas enrasadas** que sobresalen apenas al desbloquear (típico de los eléctricos).
- **Techo panorámico de vidrio**, sin marco visible en las ventanas laterales.
- **Rines de 19-20", de diseño cerrado/aerodinámico** (pocos radios, casi un disco), no
  rines deportivos de radios abiertos.
- **Pintura gris grafito metalizado**, neutra — nunca lleva el color de acento en la
  pintura, solo en las luces (ver más abajo).
- **Puerto de carga** en el guardabarros trasero izquierdo, con un aro delgado que se
  ilumina.
- Detalle aerodinámico: un labio muy sutil tipo *ducktail* en el borde de la cajuela.

## Encuadre, cámara y fondo (igual para las dos imágenes)

- **Formato maestro: 2400×1500 px (relación 16:10), horizontal.**
- **Zona segura:** el carro entero y su sombra deben caber dentro del 80 % central del
  ancho y el 80 % central del alto (margen de ~10-12 % en cada lado). Así se puede recortar
  a 4:3 en el celular o a formatos más anchos en PC **sin perder nunca la silueta**.
  Verifica el resultado importado a 340 px de ancho: a ese tamaño debe seguir
  reconociéndose como un sedán y no como la SUV.
- **Cámara:** tres cuartos delantero, cámara elevada unos **15°** sobre el horizonte,
  lente equivalente a 65-85 mm (nada de gran angular que deforme el capó). Se ve el
  frente y el lateral izquierdo, con la franja de luz y la caída del techo bien visibles.
- **Fondo:** estudio fotográfico oscuro, degradado de `#0a0c11` arriba a `#12151c` en el
  piso. Piso tipo espejo difuso (refleja el carro y sus luces al ~30 % de nitidez, no un
  espejo perfecto). Sin objetos, sin paredes con textura, sin gente, sin otros vehículos.
- **Iluminación:** luz de estudio suave desde arriba-frente que modela la carrocería, más
  un **contraluz de borde (rim light)** del color de acento recorriendo el contorno del
  techo y el capó. En la imagen final, las luces propias del carro también iluminan.
- Sin texto, sin marcas de agua, sin interfaz superpuesta.

## Imagen A — "Dormido" (para la animación de entrada, no es un bucle)

El carro parqueado, a oscuras, apenas visible: es el instante justo antes de que la app
"despierte" el vehículo del vecino.

- Franja de luz del frente **apagada**, sin ningún brillo.
- Puerto de carga **apagado**.
- Interior oscuro, sin luces de cabina.
- Piso casi sin reflejo (el carro es solo una silueta suave contra el fondo).
- Postura de reposo: la carrocería en su altura normal, sin ningún indicio de movimiento.
- El contraluz de borde apenas se insinúa, muy tenue (10-15 % de intensidad), lo justo
  para que la silueta se recorte del fondo oscuro.

## Imagen B — "Despierto" (final de la entrada, y también inicio = final del bucle)

El mismo encuadre exacto, el mismo carro, la misma cámara — **solo cambia el estado de
las luces**. Esta imagen cumple doble función: es el destino de la animación de entrada
y, como el bucle siguiente es un bucle de verdad, **es también su primer y su último
fotograma** (por eso no hay una "Imagen C" aparte).

- Franja de luz del frente **encendida por completo**, nítida, en el color de acento.
- Puerto de carga **encendido**, con su aro brillando en el mismo color.
- Contraluz de borde a plena intensidad, recorriendo el techo y el capó.
- El piso ahora refleja las luces encendidas: un brillo difuso del color de acento bajo
  el carro.
- Misma postura de reposo — este es un instante de calma, no de movimiento.

## Animación de entrada (A → B) — una sola vez, 4.0 segundos

La más lenta y cinematográfica de los cuatro carros — a propósito: un GT no tiene prisa.

- **0.0 – 1.2 s:** nada se mueve. Silencio visual, el carro sigue a oscuras.
- **1.2 – 3.0 s:** la franja de luz del frente se enciende **de un extremo al otro**, como
  si un pulso de luz recorriera la franja hasta llenarla por completo (no un parpadeo, un
  barrido suave).
- **2.2 – 3.4 s:** en simultáneo, el aro del puerto de carga se enciende con un
  desvanecido suave, y el contraluz de borde sube de 10-15 % a intensidad plena.
- **3.0 – 4.0 s:** el reflejo del piso aparece gradualmente bajo el carro.
- Curva de aceleración: `ease-in-out` general, con la parte del barrido de luz un poco
  más lenta al final (`ease-out`), para que se sienta como que la luz "se asienta".
- Nada de rebote, nada de vibración: es elegancia, no un efecto de videojuego.

## Animación en bucle (B → B) — infinita, 6.0 segundos

La más lenta y calmada de los cuatro — el sedán "respira" en vez de moverse.

- **Flotación mínima:** la carrocería completa sube y baja **solo 4-5 px** (el
  desplazamiento más sutil de los cuatro vehículos), con `ease-in-out`.
- **La franja de luz late muy suavemente:** de brillo 90 % a 100 % y de vuelta, en el
  mismo ciclo de 6 s pero con un pequeño desfase de 1.5 s respecto a la flotación, para
  que no se sientan como el mismo movimiento.
- **Reflejo del piso:** acompaña la flotación — cuando el carro "sube", el reflejo se
  aclara un poco; cuando "baja", se atenúa. Es el detalle que más vende la sensación de
  peso real.
- Sin destellos, sin chispas, sin partículas: la calma es el punto.

> **Nota de color y cómo no multiplicar el trabajo por cinco:** la Imagen A no muestra
> ningún color de acento (todo está apagado), así que **sirve igual para las cinco
> opciones de color** sin regenerarla. Solo la Imagen B cambia: genera una versión por
> cada acento (`#3ad4e6` cian por defecto, `#4ade9a` verde, `#8b8cf0` violeta, `#e8c46a`
> dorado, `#e878b8` rosa), cambiando únicamente la palabra de color en el prompt de la
> franja de luz, el puerto de carga y el contraluz. El prompt de movimiento no cambia.
> Total por vehículo: **1 Imagen A + 5 Imágenes B = 6 generaciones**, no 10.

---

## Prompt listo — Imagen A ("Dormido")

> Fotografía de producto automotriz ultra realista de un **sedán eléctrico tipo gran
> turismo**, vista de tres cuartos delantero, cámara elevada 15° sobre el horizonte, lente
> de 75mm, en un estudio fotográfico completamente oscuro con degradado de `#0a0c11`
> arriba a `#12151c` en el piso, piso tipo espejo difuso que refleja al 30% de nitidez.
>
> El vehículo: perfil fastback bajo y ancho de voladizos cortos, techo curvo continuo
> desde el parabrisas hasta la cajuela sin quiebre, frente completamente cerrado sin
> parrilla (panel liso), manijas enrasadas en las puertas, techo panorámico de vidrio sin
> marcos visibles, rines de 19-20" de diseño cerrado tipo disco. Pintura gris grafito
> metalizado. **Sin ningún logotipo, insignia ni nombre de marca o modelo visible en
> ningún punto del vehículo.**
>
> Estado: el vehículo está completamente **apagado y a oscuras** — la franja de luz
> delantera está apagada, el interior está oscuro, no hay ningún brillo encendido. Un
> contraluz de borde extremadamente tenue (10-15% de intensidad) en color `#3ad4e6`
> recorre apenas el contorno del techo y el capó, lo justo para separar la silueta del
> fondo oscuro. El piso casi no refleja nada. Composición: el vehículo y su sombra caben
> dentro del 80% central del encuadre 2400×1500px (relación 16:10), sin tocar los bordes.
>
> Sin texto, sin marcas de agua, sin interfaz, sin personas, sin otros objetos ni
> vehículos en el fondo. Fotorrealista, iluminación de estudio profesional, alta
> resolución.

## Prompt listo — Imagen B ("Despierto", cian por defecto)

> [Repite exactamente la misma descripción del vehículo, la cámara, el encuadre y el
> fondo de la Imagen A.] Cambia únicamente el estado de las luces: la franja de luz LED
> delgada que cruza el frente de faro a faro está **completamente encendida**, nítida, en
> color `#3ad4e6`. El puerto de carga en el guardabarros trasero izquierdo tiene un aro
> delgado iluminado en el mismo color `#3ad4e6`. El contraluz de borde está a intensidad
> plena recorriendo el contorno del techo y el capó. El piso ahora refleja un brillo
> difuso en `#3ad4e6` bajo el vehículo. Misma postura de reposo, mismo encuadre exacto,
> ningún otro cambio.

*(Para los otros cuatro acentos, repite este mismo prompt cambiando `#3ad4e6` por:
`#4ade9a` verde, `#8b8cf0` violeta, `#e8c46a` dorado, o `#e878b8` rosa.)*

## Prompt de movimiento — entrada (IA de video, imagen A → imagen B)

> Anima la transición de la imagen de inicio a la imagen final en 4 segundos, cámara
> completamente fija. Primero 1.2 segundos sin ningún movimiento. Luego, entre el
> segundo 1.2 y el 3.0, la franja de luz del frente se enciende con un barrido suave de
> un extremo al otro (no un parpadeo). Entre el segundo 2.2 y el 3.4, el aro del puerto de
> carga se enciende con un desvanecido gradual y el contorno del vehículo gana un
> contraluz de borde que sube de tenue a intensidad plena. Entre el segundo 3.0 y el 4.0,
> aparece gradualmente el reflejo del vehículo iluminado en el piso. Movimiento de luces
> lento y suave (`ease-in-out`), sin ningún rebote, parpadeo brusco ni vibración. La
> carrocería del vehículo no se mueve en ningún momento de esta animación.

## Prompt de movimiento — bucle (IA de video, imagen B → imagen B, mismo fotograma)

> Genera un bucle perfectamente continuo de 6 segundos a partir de esta misma imagen como
> fotograma inicial y final, cámara fija. El vehículo completo se eleva y desciende muy
> sutilmente, un desplazamiento de apenas 4 a 5 píxeles, con curva de aceleración suave
> (`ease-in-out`), sin ninguna rotación ni inclinación. La franja de luz del frente varía
> muy levemente su brillo entre 90% y 100%, en el mismo ciclo de 6 segundos pero con 1.5
> segundos de desfase respecto al movimiento vertical, para que ambos movimientos no se
> sientan idénticos. El reflejo en el piso se aclara ligeramente cuando el vehículo sube y
> se atenúa cuando baja, acompañando el movimiento. Sin chispas, sin partículas, sin
> destellos adicionales: el movimiento debe sentirse calmado, elegante y silencioso. El
> primer fotograma y el último deben ser idénticos para que el bucle no muestre ningún
> salto.

## Si no tienes acceso a una IA de video (alternativa solo con CSS)

Con únicamente las dos imágenes fijas ya generadas se puede lograr un efecto aceptable:

```css
.sedan-dormido, .sedan-despierto {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;
}
.sedan-despierto {
  animation: encender 4s ease-out forwards, respirar 6s ease-in-out 4s infinite;
}
@keyframes encender { from { opacity: 0; } to { opacity: 1; } }
@keyframes respirar  { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.08); } }
@media (prefers-reduced-motion: reduce) {
  .sedan-despierto { animation: none; opacity: 1; }
}
```

La imagen "dormida" queda debajo, fija; la "despierta" se desvanece encima (simulando el
encendido) y luego respira con un filtro de brillo. No sustituye al movimiento real, pero
funciona sin depender de una IA de video.

## Accesibilidad

Si el visitante tiene activado "reducir movimiento" en su sistema, se debe mostrar
**solo la Imagen B fija** (el estado despierto), sin autoplay de ningún video ni
animación CSS.

## Antes de darlo por bueno

- [ ] A 340 px de ancho (celular) se reconoce como un sedán y no como la SUV.
- [ ] La Imagen A no muestra ningún color de acento — sirve para las cinco variantes.
- [ ] El bucle de la Imagen B no "pega": se puede ver un minuto seguido sin notar el corte.
- [ ] Ningún logotipo, insignia ni nombre de marca aparece en el vehículo.
- [ ] El vehículo se siente el más calmado y lento de los cuatro (comparar con el 4x4).
- [ ] Con los cinco acentos probados, el dorado (`#e8c46a`) sigue leyéndose bien sobre el
      gris grafito — es el que peor contraste suele dar.
- [ ] Los videos de entrega pesan menos de 1.5 MB, sin audio, con `loop autoplay muted
      playsinline`.
