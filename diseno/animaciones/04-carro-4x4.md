# 04 · 4x4 alto — "Modo aventura"

> **Cambio de enfoque:** ya no pide código SVG, sino **dos fotografías fotorrealistas**
> (imagen de inicio e imagen final) para una IA de imágenes, y el movimiento entre ambas
> para una IA de video por fotogramas clave. Lee primero `01-carro-automovil.md`.

## Qué transmite y por qué su animación es la más enérgica

El vehículo de aventura del conjunto: cuadrado, alto, con actitud. Es el que más se aleja
del sedán en diseño, y también en **ritmo de animación**: donde el sedán es lento y
contemplativo, el 4x4 es **el más rápido y punzante de los cuatro** — se enciende como
quien prepara el vehículo para salir de expedición, no como quien lo admira en una
vitrina.

Su gesto exclusivo: al encender, **la suspensión parece elevarse** — una referencia
directa a la suspensión neumática ajustable de los todoterrenos eléctricos reales, que
suben de altura en modo offroad.

## El vehículo: en qué nos basamos

Un todoterreno eléctrico robusto, con el lenguaje visual de los 4x4 eléctricos actuales
— carrocería alta y recta, luces auxiliares de techo, neumáticos de mayor tamaño. **Sin
ningún logotipo, insignia ni nombre de modelo visible.**

Rasgos que lo definen — **hay que exagerarlo**, mejor demasiado cuadrado que ambiguo:
- **Todo recto y vertical.** Techo horizontal de punta a punta, parabrisas casi vertical,
  portón trasero que cae en ángulo casi recto — nada de curvas de despedida como la SUV.
- **Frente vertical y plano, tipo caja**, sin parrilla.
- **Ganchos de remolque expuestos** en el paragolpes delantero (un detalle que ningún
  otro de los cuatro vehículos tiene).
- **Barra de luces auxiliar en el techo** — su rasgo lumínico más distintivo, muy
  distinto de la franja del sedán, la franja del platón de la pickup o la franja
  envolvente de la SUV. Es una barra independiente, montada sobre el techo.
- **Focos auxiliares pequeños integrados en el paragolpes delantero**, además de la
  franja de luz frontal estándar.
- **Estribos laterales / rieles de roca** entre los pasos de rueda.
- **Neumáticos notablemente más grandes** que los otros tres vehículos, con dibujo de
  taco de terreno mixto visible.
- **Buena altura al piso** — el mayor espacio entre carrocería y suelo de los cuatro.
- **Pintura gris grafito casi negro, acabado mate** — el más oscuro y rudo de los cuatro.
- **Puerto de carga** en el guardabarros trasero, con aro iluminado.

## Encuadre, cámara y fondo

Igual que el sedán (formato maestro 2400×1500 px, zona segura 80 % central, estudio
`#0a0c11` → `#12151c`, piso espejo difuso), con el ajuste más marcado de los cuatro:

- **Cámara notablemente más baja: 5-8° de elevación**, casi a nivel de calle — un ángulo
  "heroico" que exagera su altura y su masa, muy distinto de los 15° del sedán/SUV o los
  10° de la pickup. Este ángulo bajo es parte de su identidad.

## Imagen A — "En reposo" (para la entrada, no es un bucle)

- Barra de luces del techo **apagada**.
- Focos auxiliares del paragolpes **apagados**.
- Franja de luz frontal estándar **apagada**.
- Puerto de carga apagado.
- Suspensión en su **altura normal de calle** (no elevada).
- Contraluz de borde muy tenue (10-15 %).

## Imagen B — "Modo aventura activo" (final de la entrada, y también el bucle)

Mismo encuadre exacto, mismo vehículo — cambian las luces y, algo exclusivo de este
modelo, **la altura de la carrocería**. Esta imagen es el destino de la entrada y, a la
vez, el único fotograma del bucle siguiente.

- Barra de luces del techo **encendida por completo**, en el color de acento — el
  elemento más llamativo de la imagen.
- Focos auxiliares del paragolpes **encendidos**.
- Franja de luz frontal encendida.
- Puerto de carga encendido.
- **La carrocería se ve ligeramente más elevada** respecto a las llantas — más espacio
  visible entre el paso de rueda y el neumático que en la Imagen A (simulando la
  suspensión neumática en modo alto). Las llantas permanecen apoyadas en el mismo punto
  del suelo: **es la carrocería la que "sube" sobre ellas, no el vehículo entero.**
- Contraluz de borde a plena intensidad.
- Reflejo del piso mostrando las luces encendidas.

## Animación de entrada (A → B) — una sola vez, 2.0 segundos

**La más rápida de los cuatro carros** — un chasquido de energía, como quien enciende el
modo offroad antes de salir a la montaña.

- **0.0 – 0.2 s:** casi sin pausa — el 4x4 no espera.
- **0.2 – 0.7 s:** la barra de luces del techo se enciende **de golpe, de un extremo al
  otro casi instantáneamente** — el encendido más brusco e intenso de los cuatro
  vehículos (a propósito: son luces auxiliares de trabajo/aventura, no un detalle
  decorativo).
- **0.5 – 1.0 s:** los focos auxiliares del paragolpes se encienden en rápida sucesión,
  casi simultánea, como un parpadeo doble.
- **0.6 – 1.4 s:** **la carrocería se eleva visiblemente** sobre las llantas (que
  permanecen fijas), simulando el ajuste de la suspensión neumática — este es el único
  de los cuatro vehículos con este movimiento de elevación real en la entrada.
- **1.4 – 2.0 s:** la franja de luz frontal y el puerto de carga terminan de encenderse,
  el contraluz sube a plena intensidad y aparece el reflejo del piso.
- Curva de aceleración: `ease-out` marcado, casi abrupto en el encendido de las luces
  (nada de la suavidad del sedán), pero la elevación de la suspensión sí usa
  `ease-in-out` para que se sienta mecánica y controlada, no un salto.

## Animación en bucle (B → B) — infinita, 3.5 segundos

**El bucle más corto y enérgico de los cuatro** — el todoterreno no descansa, está listo
para salir.

- **Solo la carrocería sube y baja 6-7 px sobre las llantas fijas** (las llantas
  permanecen ancladas al piso en todo momento — este es el detalle que hace especial a
  este vehículo: si las llantas se mueven con el cuerpo, el efecto de suspensión se
  pierde). La barra de techo y los estribos se mueven junto con la carrocería.
- **La barra de luces del techo parpadea con más energía que cualquier otro vehículo**:
  un pulso entre 80 % y 100 % de brillo con un ciclo de apenas **1.8 segundos** (la mitad
  del ciclo de la carrocería), dándole una sensación eléctrica, alerta, casi de vehículo
  de rescate.
- Los focos auxiliares del paragolpes laten en fase ligeramente distinta a la barra del
  techo (0.4 s de desfase), para que no parpadeen exactamente igual.
- El reflejo del piso acompaña el movimiento de la carrocería.

> **Nota de color:** la Imagen A no muestra acento y sirve para las cinco variantes.
> Genera 5 versiones de la Imagen B, cambiando solo el color de la barra de techo, los
> focos auxiliares, la franja frontal y el puerto de carga. El prompt de movimiento no
> cambia entre acentos.

---

## Prompt listo — Imagen A ("En reposo")

> Fotografía de producto automotriz ultra realista de un **todoterreno 4x4 eléctrico**,
> vista de tres cuartos delantero, cámara muy baja, apenas 5-8° de elevación sobre el
> horizonte (ángulo heroico, casi a nivel de calle), lente de 75mm, en un estudio
> fotográfico oscuro con degradado de `#0a0c11` arriba a `#12151c` en el piso, piso tipo
> espejo difuso que refleja al 30% de nitidez.
>
> El vehículo: carrocería alta, recta y cuadrada, techo horizontal de punta a punta,
> parabrisas casi vertical, portón trasero en ángulo casi recto sin curvas, frente
> vertical y plano sin parrilla, ganchos de remolque expuestos en el paragolpes
> delantero, una barra de luces auxiliar montada sobre el techo (actualmente apagada),
> focos auxiliares pequeños integrados en el paragolpes delantero, estribos laterales o
> rieles de roca entre los pasos de rueda, neumáticos notablemente grandes con dibujo de
> taco de terreno mixto, buena altura al piso. Pintura gris grafito casi negro en acabado
> mate. **Sin ningún logotipo, insignia ni nombre de marca o modelo visible.**
>
> Estado: completamente **apagado** — la barra de luces del techo, los focos auxiliares
> del paragolpes y la franja de luz frontal están todos apagados. La carrocería está en
> su altura normal de calle (no elevada), con el espacio habitual entre el paso de rueda y
> el neumático. Un contraluz de borde extremadamente tenue (10-15%) en `#3ad4e6` recorre
> apenas el contorno del vehículo. Composición: el vehículo y su sombra caben dentro del
> 80% central del encuadre 2400×1500px (16:10), sin tocar los bordes.
>
> Sin texto, sin marcas de agua, sin interfaz, sin personas ni otros vehículos. Alta
> resolución, fotorrealista, iluminación de estudio profesional.

## Prompt listo — Imagen B ("Modo aventura activo", cian por defecto)

> [Misma descripción del vehículo, cámara, encuadre y fondo de la Imagen A.] Cambia el
> estado de las luces y la altura de la carrocería: la barra de luces auxiliar del techo
> está **completamente encendida** en `#3ad4e6`, intensa y nítida — es el elemento más
> brillante de la imagen. Los focos auxiliares del paragolpes delantero también están
> encendidos en el mismo color. La franja de luz frontal estándar está encendida. El
> puerto de carga en el guardabarros trasero tiene su aro iluminado en `#3ad4e6`. **La
> carrocería se ve ligeramente elevada respecto a las llantas** — hay más espacio visible
> entre el paso de rueda y el neumático que en la Imagen A, simulando una suspensión
> neumática en modo alto; los neumáticos permanecen en el mismo punto de apoyo sobre el
> piso. El contraluz de borde está a intensidad plena. El piso refleja un brillo difuso en
> `#3ad4e6`. Mismo encuadre exacto.

*(Para los otros acentos, repite cambiando `#3ad4e6` por `#4ade9a`, `#8b8cf0`, `#e8c46a`
o `#e878b8`.)*

## Prompt de movimiento — entrada (imagen A → imagen B)

> Anima la transición en 2.0 segundos, cámara fija, con el ritmo más rápido y enérgico de
> toda la serie — casi sin pausa inicial. Entre el segundo 0.2 y el 0.7, la barra de luces
> del techo se enciende de golpe, de un extremo a otro, con un encendido brusco e intenso
> (no un desvanecido suave). Entre el segundo 0.5 y el 1.0, los focos auxiliares del
> paragolpes se encienden en rápida sucesión, casi simultánea. Entre el segundo 0.6 y el
> 1.4, la carrocería completa se eleva visiblemente sobre las llantas (que permanecen
> fijas en su punto de apoyo sobre el piso), simulando el ajuste de una suspensión
> neumática, con una curva de aceleración `ease-in-out` que la haga sentir mecánica y
> controlada. Entre el segundo 1.4 y el 2.0, la franja de luz frontal y el puerto de carga
> terminan de encenderse, el contraluz sube a intensidad plena y aparece el reflejo en el
> piso. El encendido de las luces debe sentirse abrupto y potente; el movimiento de la
> suspensión debe sentirse controlado y mecánico.

## Prompt de movimiento — bucle (imagen B → imagen B, mismo fotograma)

> Genera un bucle continuo de 3.5 segundos a partir de esta misma imagen como fotograma
> inicial y final, cámara fija — el bucle más corto y enérgico de la serie. Solo la
> carrocería del vehículo sube y baja entre 6 y 7 píxeles con `ease-in-out`; las llantas
> permanecen completamente fijas y ancladas al mismo punto del piso en todo momento, sin
> moverse nunca con el cuerpo (esto es esencial: si las llantas se mueven junto con la
> carrocería, se pierde el efecto de suspensión). La barra de luces del techo parpadea con
> más energía que cualquier otro elemento, oscilando entre 80% y 100% de brillo en un
> ciclo propio de 1.8 segundos (la mitad de la duración del movimiento de la carrocería).
> Los focos auxiliares del paragolpes laten en una fase distinta a la barra del techo, con
> 0.4 segundos de desfase entre ambos, para que no parpadeen de forma idéntica. El reflejo
> del piso acompaña el movimiento de la carrocería. El primer y último fotograma deben ser
> idénticos para que el bucle no muestre ningún salto.

## Si no tienes acceso a una IA de video (alternativa solo con CSS)

```css
.4x4-activo {
  animation: encender-fuerte 2s ease-out forwards, pulso-aventura 1.8s ease-in-out 2s infinite;
}
@keyframes encender-fuerte { from { opacity: 0; filter: brightness(0.6); } to { opacity: 1; filter: brightness(1); } }
@keyframes pulso-aventura  { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }
```

Si se cuenta con la carrocería y las llantas en capas separadas (recorte manual), se
puede además animar solo la capa de carrocería con un `translateY` corto de 5.5 s en
bucle para simular la suspensión sin depender de una IA de video.

## Accesibilidad

Con "reducir movimiento" activado, mostrar solo la Imagen B fija, sin autoplay.

## Antes de darlo por bueno

Además del checklist del sedán:

- [ ] **El efecto de suspensión se nota con claridad**: la carrocería sube, las llantas
      no se mueven. Es lo que hace especial a este modelo.
- [ ] Puesto al lado de la SUV, no hay ninguna duda de cuál es cuál (recto y cuadrado
      contra curvo y continuo).
- [ ] La barra de luces del techo y los focos del paragolpes se distinguen a 340 px de
      ancho.
- [ ] Es notablemente el más rápido y enérgico de los cuatro (2.0 s de entrada, 3.5 s de
      bucle, contra los 4.0 s / 6.0 s del sedán).
- [ ] Los neumáticos se ven claramente más grandes que los de los otros tres vehículos.
