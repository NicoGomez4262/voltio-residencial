# 02 · Camioneta pickup — "Lista para el trabajo"

> **Cambio de enfoque:** ya no pide código SVG, sino **dos fotografías fotorrealistas**
> (imagen de inicio e imagen final) para una IA de imágenes, y el movimiento entre ambas
> para una IA de video por fotogramas clave. Lee primero `01-carro-automovil.md`: aquí no
> se repiten las explicaciones generales de encuadre, solo lo que cambia.

## Por qué importa tanto

Es el vehículo **por defecto** de la app: lo ve todo el que nunca entra a Ajustes. Y su
animación tiene que sentirse **distinta a la del sedán** — no es el mismo movimiento con
otra carrocería. Donde el sedán es cinematográfico y calmado, la pickup es **mecánica y
directa**: se enciende como quien prende las luces de trabajo antes de empezar la
jornada. Menos elegancia, más energía práctica.

## El vehículo: en qué nos basamos

Una pickup eléctrica, con el lenguaje visual de las camionetas eléctricas actuales —
frente robusto sin parrilla, plataforma sin motor delantero que permite un capó más
funcional que agresivo. **Sin ningún logotipo, insignia ni nombre de modelo visible.**

Rasgos que la definen frente al sedán:
- **Frente alto, ancho y vertical**, sin parrilla, con una **franja de luz LED más
  gruesa y cuadrada** que la del sedán (menos "joya", más "herramienta").
- **Cabina corta y erguida**, con el parabrisas casi vertical (nada de rake deportivo).
- **Caja o platón trasero abierto**, con una barra o *sport bar* detrás de la cabina, y
  una **franja de luces LED integradas en el borde superior del platón** — este es su
  rasgo lumínico distintivo, muy distinto a la franja frontal continua del sedán.
- **Guardabarros marcados y flanqueados**, con rines multi-radio más robustos que los del
  sedán (no el diseño cerrado tipo disco).
- **Altura al piso mayor** — se nota más espacio entre la carrocería y el suelo.
- **Pintura gris grafito en acabado semi-mate** (menos brillante que el sedán, más
  material de trabajo).
- **Puerto de carga** en el guardabarros delantero, con aro iluminado.

## Encuadre, cámara y fondo

Igual que el sedán (formato maestro 2400×1500 px, zona segura 80 % central, mismo
estudio oscuro `#0a0c11` → `#12151c`, piso espejo difuso), con un ajuste:

- **Cámara ligeramente más baja: ~10° de elevación** (contra los 15° del sedán), para
  que se sienta su altura y su masa desde un ángulo más "de calle" y menos "de vitrina".
  Encuadre que muestre bien el platón trasero y la franja de luces de su borde.

## Imagen A — "Apagada" (para la entrada, no es un bucle)

- Franja de luz frontal **apagada**.
- Franja de luces del borde del platón **apagada**.
- Puerto de carga apagado.
- Contraluz de borde muy tenue (10-15 %), lo justo para separar la silueta del fondo.
- Postura de reposo, suspensión en altura normal.

## Imagen B — "Encendida" (final de la entrada, y también el bucle)

Mismo encuadre exacto, mismo vehículo, solo cambian las luces — y esta imagen es a la vez
el destino de la entrada y el fotograma único del bucle siguiente.

- Franja de luz frontal **encendida por completo**, en el color de acento.
- **Franja de luces del borde del platón encendida**, en el mismo color — este detalle es
  el que más la diferencia del sedán.
- Puerto de carga encendido.
- Contraluz de borde a plena intensidad.
- Reflejo del piso mostrando las luces encendidas.

## Animación de entrada (A → B) — una sola vez, 2.2 segundos

**La más rápida y directa de los cuatro carros** — nada de pausa contemplativa: se
enciende como una herramienta que se pone a trabajar.

- **0.0 – 0.3 s:** una pausa mínima, casi imperceptible.
- **0.3 – 1.0 s:** la franja de luz frontal se enciende de golpe, de un extremo al otro,
  más rápido y "cuadrado" que el barrido del sedán (menos suave, más directo).
- **0.9 – 1.6 s:** justo después, la franja de luces del borde del platón se enciende
  **de atrás hacia adelante**, como una secuencia de luces de trabajo activándose una a
  una (aunque el resultado final sea una franja continua, el encendido tiene ese
  recorrido).
- **1.3 – 2.2 s:** el puerto de carga se enciende y el contraluz de borde sube a
  intensidad plena; el reflejo del piso aparece.
- Curva de aceleración: `ease-out` marcado — entra rápido y se asienta, sin el
  `ease-in-out` suave del sedán. Se debe sentir mecánico, no ceremonioso.

## Animación en bucle (B → B) — infinita, 4.0 segundos

Más corta que el bucle del sedán (6 s): el ritmo es más despierto, como un motor al
ralentí, no como una respiración lenta.

- **La carrocería sube y baja 6 px** (más que los 4-5 px del sedán: es un vehículo más
  pesado y su movimiento debe notarse un poco más, con `ease-in-out`).
- **Balanceo mínimo:** además de subir y bajar, el vehículo se inclina **apenas 0.3-0.4°**
  hacia atrás y adelante, como si tuviera que asentar su propio peso — el sedán no tiene
  este balanceo, es exclusivo de la pickup y el 4x4.
- **La franja de luces del platón parpadea suavemente una vez por ciclo** (no late
  continuamente como la del sedán): sube de 85 % a 100 % de brillo y vuelve, con un
  pequeño "salto" a mitad de camino, como una luz de trabajo que confirma que sigue
  encendida — un carácter más "utilitario" que "orgánico".
- El reflejo del piso acompaña el movimiento vertical.

> **Nota de color:** igual que con el sedán, la Imagen A no muestra ningún acento y sirve
> para las cinco variantes. Genera 5 versiones de la Imagen B (una por color), cambiando
> solo la palabra de color de las dos franjas de luz y el puerto de carga. El prompt de
> movimiento no cambia entre acentos.

---

## Prompt listo — Imagen A ("Apagada")

> Fotografía de producto automotriz ultra realista de una **camioneta pickup eléctrica**,
> vista de tres cuartos delantero, cámara elevada 10° sobre el horizonte, lente de 75mm,
> en un estudio fotográfico completamente oscuro con degradado de `#0a0c11` arriba a
> `#12151c` en el piso, piso tipo espejo difuso que refleja al 30% de nitidez.
>
> El vehículo: frente alto, ancho y vertical sin parrilla, cabina corta y erguida con
> parabrisas casi vertical, platón o caja trasera abierta con una barra tipo *sport bar*
> detrás de la cabina, guardabarros marcados y flanqueados, rines multi-radio robustos,
> buena altura al piso. Pintura gris grafito en acabado semi-mate. **Sin ningún logotipo,
> insignia ni nombre de marca o modelo visible.**
>
> Estado: completamente **apagada y a oscuras** — tanto la franja de luz frontal como la
> franja de luces integrada en el borde superior del platón están apagadas, sin ningún
> brillo. Un contraluz de borde extremadamente tenue (10-15%) en `#3ad4e6` recorre apenas
> el contorno del vehículo. Composición: el vehículo y su sombra caben dentro del 80%
> central del encuadre 2400×1500px (16:10), sin tocar los bordes, con el platón trasero y
> su franja de luces bien visibles.
>
> Sin texto, sin marcas de agua, sin interfaz, sin personas ni otros vehículos. Alta
> resolución, fotorrealista, iluminación de estudio profesional.

## Prompt listo — Imagen B ("Encendida", cian por defecto)

> [Misma descripción del vehículo, cámara, encuadre y fondo de la Imagen A.] Cambia solo
> el estado de las luces: la franja de luz frontal está **completamente encendida** en
> `#3ad4e6`, y la franja de luces integrada en el borde superior del platón trasero
> también está **completamente encendida** en el mismo color — ambas franjas nítidas y
> nuevas. El puerto de carga en el guardabarros delantero tiene su aro iluminado en
> `#3ad4e6`. El contraluz de borde está a intensidad plena. El piso refleja un brillo
> difuso en `#3ad4e6` bajo el vehículo. Misma postura, mismo encuadre exacto.

*(Para los otros acentos, repite cambiando `#3ad4e6` por `#4ade9a`, `#8b8cf0`, `#e8c46a`
o `#e878b8`.)*

## Prompt de movimiento — entrada (imagen A → imagen B)

> Anima la transición en 2.2 segundos, cámara fija, con un ritmo mecánico y directo (no
> ceremonioso). Tras una pausa mínima de 0.3 segundos, entre el segundo 0.3 y el 1.0 la
> franja de luz frontal se enciende de golpe de un extremo a otro, con un movimiento más
> rápido y marcado que un simple desvanecido. Entre el segundo 0.9 y el 1.6, la franja de
> luces del borde del platón trasero se enciende con un recorrido de atrás hacia adelante,
> como una secuencia de luces de trabajo activándose. Entre el segundo 1.3 y el 2.2, el
> puerto de carga se enciende, el contraluz de borde sube a intensidad plena y aparece el
> reflejo en el piso. Usa una curva de aceleración `ease-out` marcada: el encendido debe
> sentirse rápido y luego asentarse, no suave y prolongado. La carrocería no se mueve
> durante esta animación.

## Prompt de movimiento — bucle (imagen B → imagen B, mismo fotograma)

> Genera un bucle continuo de 4 segundos a partir de esta misma imagen como fotograma
> inicial y final, cámara fija. El vehículo completo sube y baja 6 píxeles con
> `ease-in-out`, y a la vez se inclina muy levemente (0.3 a 0.4 grados) hacia atrás y
> adelante, como asentando su propio peso — un balanceo casi imperceptible pero presente.
> La franja de luces del borde del platón trasero varía su brillo entre 85% y 100% con un
> pequeño salto a mitad del ciclo, como una luz de trabajo confirmando que sigue
> encendida, en vez de latir de forma continua y suave. El reflejo del piso acompaña el
> movimiento vertical. Sin chispas ni partículas. El primer y último fotograma deben ser
> idénticos para que el bucle no muestre ningún salto.

## Si no tienes acceso a una IA de video (alternativa solo con CSS)

Misma receta que el sedán (ver `01-carro-automovil.md`), con dos cambios: la duración del
`encender` pasa a 2.2s con `ease-out`, y el `respirar` pasa a un ciclo de 4s con un salto
de brillo a la mitad en vez de una curva suave continua:

```css
.pickup-despierto {
  animation: encender 2.2s ease-out forwards, parpadeo-trabajo 4s ease-in-out 2.2s infinite;
}
@keyframes parpadeo-trabajo {
  0%, 100% { filter: brightness(1); }
  45%      { filter: brightness(1); }
  50%      { filter: brightness(1.1); }
  55%      { filter: brightness(1); }
}
```

## Accesibilidad

Con "reducir movimiento" activado, mostrar solo la Imagen B fija, sin autoplay.

## Antes de darlo por bueno

Además del checklist del sedán:

- [ ] **La franja de luces del platón se entiende sin explicación.** Es su rasgo
      distintivo frente al sedán: si no se nota, hay que hacerla más visible.
- [ ] Se siente más pesada y más "de trabajo" que el sedán — compara ambos bucles uno
      junto al otro.
- [ ] El encendido es notablemente más rápido y directo que el del sedán (2.2s vs 4.0s).
- [ ] A 340 px de ancho el platón trasero sigue siendo reconocible.
- [ ] Ningún logotipo ni insignia de marca aparece en el vehículo.
