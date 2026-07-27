# 03 · SUV familiar — "Bienvenida cálida"

> **Cambio de enfoque:** ya no pide código SVG, sino **dos fotografías fotorrealistas**
> (imagen de inicio e imagen final) para una IA de imágenes, y el movimiento entre ambas
> para una IA de video por fotogramas clave. Lee primero `01-carro-automovil.md`.

## Qué transmite y por qué su animación es distinta

Es el vehículo del vecino de familia: cómodo, amplio, sin pretensiones deportivas ni de
aventura. Está a medio camino entre el sedán y el 4x4 — y esa posición intermedia es su
mayor riesgo: **si la animación se parece a la del sedán o a la del 4x4, falló.**

Su personalidad es **cálida y acogedora**, no elegante-fría como el sedán ni
enérgica-aventurera como el 4x4. Por eso su gesto propio es único entre los cuatro: al
encender, **las manijas se despliegan levemente**, como un gesto de bienvenida — un
detalle que ningún otro vehículo tiene.

## El vehículo: en qué nos basamos

Una SUV eléctrica familiar, con el lenguaje visual de los crossovers eléctricos actuales
— volumen continuo de dos cajas, mucho vidrio, proporciones amplias y confortables.
**Sin ningún logotipo, insignia ni nombre de modelo visible.**

Rasgos que la definen:
- **Silueta de volumen continuo**: a diferencia de la pickup, no hay ningún corte entre
  la cabina y la zona de carga — es una sola forma fluida de principio a fin.
- **Techo alto, largo y curvo**, con caída suave hacia el portón trasero (nunca en
  escalón como el 4x4, nunca bajo como el baúl del sedán).
- **Techo panorámico de vidrio** visible desde el ángulo de cámara, con una insinuación
  de rieles de techo integrados (no un portaequipajes robusto: solo una sugerencia
  discreta).
- **Franja de luz envolvente**: a diferencia de la franja recta del sedán o la cuadrada
  de la pickup, la de la SUV **se curva ligeramente en las esquinas**, envolviendo el
  frente — su firma lumínica.
- **Rines de tamaño medio, diseño limpio de cinco radios** (menos extremos que el sedán o
  la pickup).
- **Pintura gris grafito con una temperatura ligeramente más cálida** que el sedán y la
  pickup — el mismo neutro, pero menos frío, para reforzar la sensación hogareña.
- **Manijas enrasadas** que se despliegan al desbloquear (este gesto es protagonista de
  su animación).
- **Puerto de carga** en el guardabarros trasero, con aro iluminado.
- **Espejo lateral** con un indicador de luz direccional discreto (parpadea una vez en la
  animación de entrada — otro detalle exclusivo suyo).

## Encuadre, cámara y fondo

Igual que el sedán (formato maestro 2400×1500 px, zona segura 80 % central, estudio
`#0a0c11` → `#12151c`, piso espejo difuso), con un ajuste:

- **Cámara a 15° de elevación** (como el sedán), pero con un **encuadre ligeramente más
  amplio** para que se vea completo el volumen del techo panorámico y algo más del
  lateral — es el vehículo más "grande" de los cuatro y necesita algo más de aire visual
  alrededor.

## Imagen A — "Dormida" (para la entrada, no es un bucle)

- Franja de luz envolvente **apagada**.
- Manijas **plegadas**, enrasadas con la carrocería.
- Espejo sin ningún indicador encendido.
- Puerto de carga apagado.
- Contraluz de borde muy tenue (10-15 %).
- Postura de reposo total.

## Imagen B — "Despierta" (final de la entrada, y también el bucle)

Mismo encuadre exacto, mismo vehículo — solo cambian las luces y un gesto físico
pequeño. Esta imagen es el destino de la entrada y, a la vez, el único fotograma del
bucle siguiente.

- Franja de luz envolvente **encendida por completo**, en el color de acento, con su
  curva en las esquinas bien visible.
- **Manijas ligeramente desplegadas** (unos pocos milímetros hacia afuera, un gesto sutil
  de bienvenida, no una apertura completa).
- Puerto de carga encendido.
- Contraluz de borde a plena intensidad.
- Reflejo del piso mostrando las luces encendidas.

## Animación de entrada (A → B) — una sola vez, 3.2 segundos

Un ritmo intermedio entre la calma del sedán (4.0 s) y la rapidez de la pickup (2.2 s) —
cálido pero sin prisa, como quien abre la puerta de su casa a un invitado.

- **0.0 – 1.0 s:** pausa breve, casi en calma.
- **1.0 – 2.4 s:** la franja de luz envolvente se enciende con un barrido suave que
  **recorre las esquinas curvas primero y luego se extiende hacia el centro** — un
  movimiento distinto al del sedán (que enciende de extremo a extremo en línea recta).
- **1.8 – 2.4 s:** en simultáneo, **las manijas se despliegan levemente** — este es el
  gesto exclusivo de la SUV, no lo tiene ningún otro de los cuatro vehículos.
- **2.2 – 2.6 s:** el espejo lateral parpadea una sola vez con su indicador (un guiño
  breve, no un parpadeo repetido).
- **2.6 – 3.2 s:** el puerto de carga se enciende, el contraluz sube a intensidad plena y
  aparece el reflejo del piso.
- Curva de aceleración: `ease-in-out` suave en todo momento — nada brusco, es un gesto de
  bienvenida, no un encendido mecánico.

## Animación en bucle (B → B) — infinita, 5.5 segundos

Segunda más lenta de las cuatro (después del sedán): calma familiar, no urgencia.

- **La carrocería sube y baja 6 px** (intermedio entre los 4-5 px del sedán y los 6-7 px
  de la pickup/4x4 — es un vehículo más grande, pero su carácter sigue siendo sereno, sin
  el balanceo mecánico de la pickup).
- **Sin ninguna rotación ni balanceo** — a diferencia de la pickup y el 4x4, la SUV es
  estable y no se inclina: es la familia, no la aventura ni el trabajo.
- **El reflejo en el techo panorámico se desliza lentamente**: un brillo suave que viaja
  de un lado al otro del cristal del techo, en un ciclo propio de **8 segundos**
  (deliberadamente distinto de los 5.5 s de la flotación, para que ningún par de
  movimientos se sincronice nunca). Esta es la firma visual del bucle de la SUV: ningún
  otro vehículo tiene este reflejo móvil en el techo.
- El reflejo del piso acompaña sutilmente el movimiento vertical.

> **Nota de color:** la Imagen A no muestra acento y sirve para las cinco variantes.
> Genera 5 versiones de la Imagen B, cambiando solo el color de la franja de luz
> envolvente y el puerto de carga. El prompt de movimiento no cambia entre acentos.

---

## Prompt listo — Imagen A ("Dormida")

> Fotografía de producto automotriz ultra realista de una **SUV familiar eléctrica**,
> vista de tres cuartos delantero, cámara elevada 15° sobre el horizonte, lente de 75mm,
> encuadre ligeramente amplio para mostrar el techo panorámico completo, en un estudio
> fotográfico oscuro con degradado de `#0a0c11` arriba a `#12151c` en el piso, piso tipo
> espejo difuso que refleja al 30% de nitidez.
>
> El vehículo: silueta de volumen continuo sin cortes entre cabina y zona de carga, techo
> alto y largo con caída curva suave hacia el portón trasero, techo panorámico de vidrio
> con una insinuación discreta de rieles integrados, rines de tamaño medio de cinco
> radios limpios, líneas generales redondeadas sin aristas duras. Pintura gris grafito de
> temperatura cálida (un neutro menos frío que el de un sedán deportivo). **Sin ningún
> logotipo, insignia ni nombre de marca o modelo visible.**
>
> Estado: completamente **apagada y a oscuras** — la franja de luz envolvente del frente
> (con una curva sutil en las esquinas) está apagada, las manijas de las puertas están
> plegadas y enrasadas con la carrocería, el espejo lateral no muestra ningún indicador
> encendido. Un contraluz de borde extremadamente tenue (10-15%) en `#3ad4e6` recorre
> apenas el contorno del vehículo. Composición: el vehículo y su sombra caben dentro del
> 80% central del encuadre 2400×1500px (16:10), sin tocar los bordes.
>
> Sin texto, sin marcas de agua, sin interfaz, sin personas ni otros vehículos. Alta
> resolución, fotorrealista, iluminación de estudio profesional.

## Prompt listo — Imagen B ("Despierta", cian por defecto)

> [Misma descripción del vehículo, cámara, encuadre y fondo de la Imagen A.] Cambia el
> estado de las luces y un gesto sutil: la franja de luz envolvente del frente, con su
> curva en las esquinas, está **completamente encendida** en `#3ad4e6`, nítida. Las
> manijas de las puertas están **ligeramente desplegadas**, sobresaliendo unos pocos
> milímetros de la carrocería, como un gesto discreto de apertura. El puerto de carga en
> el guardabarros trasero tiene su aro iluminado en `#3ad4e6`. El contraluz de borde está
> a intensidad plena. El piso refleja un brillo difuso en `#3ad4e6`. Misma postura, mismo
> encuadre exacto.

*(Para los otros acentos, repite cambiando `#3ad4e6` por `#4ade9a`, `#8b8cf0`, `#e8c46a`
o `#e878b8`.)*

## Prompt de movimiento — entrada (imagen A → imagen B)

> Anima la transición en 3.2 segundos, cámara fija, con un ritmo cálido y sereno (ni tan
> lento y ceremonioso como un GT, ni tan rápido como una herramienta de trabajo). Tras una
> pausa breve de 1 segundo, entre el segundo 1.0 y el 2.4 la franja de luz envolvente del
> frente se enciende con un barrido que recorre primero las esquinas curvas y luego se
> extiende hacia el centro. Entre el segundo 1.8 y el 2.4, en simultáneo, las manijas de
> las puertas se despliegan levemente hacia afuera, un gesto sutil de bienvenida. Entre el
> segundo 2.2 y el 2.6, el indicador del espejo lateral parpadea una sola vez, un guiño
> breve. Entre el segundo 2.6 y el 3.2, el puerto de carga se enciende, el contraluz sube a
> intensidad plena y aparece el reflejo en el piso. Todo el movimiento con curva de
> aceleración `ease-in-out` suave, sin brusquedad en ningún momento.

## Prompt de movimiento — bucle (imagen B → imagen B, mismo fotograma)

> Genera un bucle continuo de 5.5 segundos a partir de esta misma imagen como fotograma
> inicial y final, cámara fija. El vehículo completo sube y baja 6 píxeles con
> `ease-in-out`, sin ninguna rotación ni inclinación — el vehículo permanece
> completamente estable en todo momento. Un brillo suave se desliza lentamente sobre el
> cristal del techo panorámico, viajando de un lado al otro, en un ciclo propio de 8
> segundos deliberadamente distinto del ciclo de 5.5 segundos del movimiento vertical,
> para que nunca se sincronicen. El reflejo del piso acompaña sutilmente el movimiento
> vertical. Sin chispas, sin partículas. El primer y último fotograma deben ser idénticos
> para que el bucle no muestre ningún salto.

## Si no tienes acceso a una IA de video (alternativa solo con CSS)

```css
.suv-despierta {
  animation: encender 3.2s ease-in-out forwards, reflejo-techo 8s ease-in-out 3.2s infinite;
}
@keyframes reflejo-techo {
  0%,100% { background-position: -20% 0; opacity: .08; }
  50%     { background-position: 120% 0; opacity: .16; }
}
```

Aplica `reflejo-techo` a una capa de brillo diagonal superpuesta sobre la zona del techo
en la imagen (un degradado angosto en `linear-gradient` con `background-size` amplio).

## Accesibilidad

Con "reducir movimiento" activado, mostrar solo la Imagen B fija, sin autoplay.

## Antes de darlo por bueno

Además del checklist del sedán:

- [ ] **Se distingue del 4x4 sin dudarlo:** la SUV es curva y continua, el 4x4 es
      cuadrado y con corte de suspensión visible. Ponlos lado a lado.
- [ ] **Se distingue de la pickup:** no hay ningún corte entre cabina y zona de carga.
- [ ] El gesto de las manijas desplegándose se nota, aunque sea sutil — es único de este
      modelo.
- [ ] El reflejo del techo panorámico no compite con la flotación (van a ritmos
      distintos: 8 s contra 5.5 s).
- [ ] Se siente más cálida/serena que el sedán y más calmada que la pickup o el 4x4.
