# 05 · Escena de carga (el momento estrella)

> Lee antes `00-GUIA-GENERAL.md`.

## Dónde se usa

Es **la animación más importante de la app**. Aparece a pantalla completa cuando el
anfitrión calcula el cobro de una carga: el carro llega, se conecta, la batería sube
mientras corren los kWh y los pesos, y al terminar aparece el recibo.

Hoy existe una versión hecha a mano en SVG. Lo que se pide aquí es **el escenario que
rodea al carro** (el wallbox, el cable, el piso, la atmósfera), no el carro: ese sale de
los archivos 01 a 04 y se monta encima.

## Medidas

- **`viewBox="0 0 820 380"`**, relación 41:19, apaisado.
- **Suelo en y=288**, recorriendo de x=20 a x=800.
- **El carro (que va aparte) ocupa de x=30 a x=490.** No pongas nada ahí: es su espacio.
- **El wallbox va a la derecha**, entre x=654 y x=758, de y=120 a y=270.
- En celular se ve a unos 350 px de ancho: **el wallbox quedará de unos 45 px**. Nada de
  detalles finos ahí.

## Qué pintar

### El muro del parqueadero
Un panel de fondo detrás del wallbox: rectángulo de x=612 a x=808, de y=40 a y=288,
esquinas redondeadas 14, relleno `#0c1322`, borde `rgba(255,255,255,0.06)`. Dos líneas
horizontales tenues (`rgba(255,255,255,0.04)`) en y=96 y y=170 sugiriendo las juntas del
muro. Nada más: es un fondo, no un protagonista.

### El wallbox (el cargador de pared)
- Cuerpo: rectángulo redondeado de 104x150 en (654,120), radio 18, relleno `#111a2b`,
  borde `rgba(255,255,255,0.12)`, con un brillo blanco descendente encima.
- Pantalla: rectángulo de 76x52 en (668,136), radio 9, relleno `#04121a`, borde del
  **color de acento** al 50 %.
- Un **rayo** dibujado dentro de la pantalla, en color de acento.
- Un **LED** de radio 6 en (706,206) con un halo difuminado de radio 12, en acento.
- Una **base para el conector**: rectángulo de 60x30 en (676,224), radio 10.

### El cable
Una curva que va del wallbox al costado del carro: de **(686,246) a (481,209)**, con
control en `C 648 278, 570 250`. Dos trazos superpuestos:
1. El cable físico: grosor 12, color `#0e1626`, extremos redondeados.
2. **El flujo de energía**: grosor 5, con el degradado del acento, extremos redondeados y
   línea discontinua `10 18`.

### El piso
- Una **elipse de brillo** centrada en (410,290), radios 380x30, con el color de acento
  desvaneciéndose, opacidad 0.35.
- Dos **líneas de suelo** superpuestas en y=288 (una nítida al 50 %, otra difuminada al
  90 %) en color de acento.

### La atmósfera
Nada más. Ni estrellas, ni partículas de fondo, ni rejillas. El vacío oscuro es parte
del diseño.

---

## Animación A · Conectado y cargando — **EN BUCLE**

Es el estado que más dura, así que es el que mejor tiene que estar.

| Elemento | Qué hace | Duración | Bucle |
|---|---|---|---|
| **Flujo del cable** | Los guiones **corren del wallbox hacia el carro**: `stroke-dashoffset` de 0 a −56 | 1.2 s lineal | sí |
| **LED del wallbox** | Late: opacidad 0.45 → 1 → 0.45 | 1.0 s | sí |
| **Halo del LED** | Late igual pero **desfasado 0.3 s** y con más recorrido (0.2 → 0.6) | 1.0 s | sí |
| **Rayo de la pantalla** | Brillo suave: opacidad 0.7 → 1 → 0.7 | 2.4 s | sí |
| **Brillo del piso** | Respira: opacidad 0.28 → 0.42 → 0.28 y escala 1 → 1.04 | 4 s | sí |

**Lo importante:** que el flujo del cable (1.2 s) y el LED (1 s) **no estén
sincronizados**. Esa ligera deriva entre ambos es lo que hace que se vea vivo y no
mecánico.

```css
@keyframes fluir { to { stroke-dashoffset: -56; } }
@keyframes latir { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
@keyframes respirar-piso { 0%,100% { opacity:.28; transform: scale(1); } 50% { opacity:.42; transform: scale(1.04); } }

.flujo { animation: fluir 1.2s linear infinite; }
.led   { animation: latir 1s ease-in-out infinite; }
.halo  { animation: latir 1s ease-in-out infinite .3s; }
.piso  { animation: respirar-piso 4s ease-in-out infinite; transform-origin: 410px 290px; }
```

## Animación B · Enchufe conectándose — **NO EN BUCLE**, una sola vez

Ocurre cuando el carro llega y se conecta. **Dura 0.5 s y no se repite.**

- Un **círculo del color de acento** aparece en el punto de conexión (477,207), crece del
  50 % al 260 % y se desvanece de opacidad 0.9 a 0.
- Al mismo tiempo, **el piso destella**: la elipse de brillo sube a opacidad 0.7 durante
  0.15 s y vuelve.
- **Cinco a siete chispas** salen del punto de conexión: circulitos de radio 1.4 a 3.4 px
  que se dispersan hasta 22 px en direcciones aleatorias mientras se apagan, cada una con
  su propio retardo entre 0 y 0.3 s.

## Animación C · Carga completa — **EN BUCLE, calmado**

- El flujo del cable **se detiene** (los guiones quedan quietos).
- El LED pasa a **acento 2** y late más lento: 2.4 s.
- El brillo del piso sube un poco (opacidad base 0.4) y respira a 5 s.
- Todo se siente en reposo. Es el momento de leer el recibo, no de mirar la animación.

## Capas a entregar

```
muro
piso-brillo
piso-lineas
wallbox-cuerpo
wallbox-pantalla   ← borde en acento
wallbox-rayo       ← acento
wallbox-led        ← acento
wallbox-halo       ← acento
cable-fisico
cable-flujo        ← acento (el que se anima)
conexion-destello  ← acento (solo para la animación B)
chispas            ← acento (solo para la animación B)
```

## Prompt para la IA generativa

> Escena vectorial SVG de **una estación de carga de pared en un parqueadero**, vista
> lateral, estilo minimalista-futurista, fondo transparente y oscuro. **No dibujes ningún
> vehículo**: el espacio de x=30 a x=490 debe quedar completamente vacío porque ahí se
> monta el carro aparte.
>
> `viewBox="0 0 820 380"`. Elementos:
>
> Un panel de muro de x=612 a x=808, de y=40 a y=288, esquinas redondeadas 14, relleno
> `#0c1322`, borde `rgba(255,255,255,0.06)`, con dos líneas horizontales tenues en y=96 y
> y=170 en `rgba(255,255,255,0.04)`.
>
> Un cargador de pared: cuerpo redondeado de 104x150 en (654,120) radio 18, relleno
> `#111a2b`, borde `rgba(255,255,255,0.12)`, con un reflejo blanco descendente. Una
> pantalla de 76x52 en (668,136) radio 9, relleno `#04121a` y borde en `#3ad4e6` al 50%,
> con un símbolo de rayo en `#3ad4e6` dentro. Un LED circular de radio 6 en (706,206) en
> `#3ad4e6` con un halo difuminado de radio 12. Una base para el conector: rectángulo de
> 60x30 en (676,224) radio 10.
>
> Un cable curvo del cargador al costado izquierdo: de (686,246) a (481,209) con curva de
> control `C 648 278, 570 250`, dibujado dos veces superpuesto: primero el cable físico de
> grosor 12 en `#0e1626` con extremos redondeados, y encima un trazo de energía de grosor
> 5 con degradado de `#3ad4e6` a `#5ee7c8`, extremos redondeados y patrón discontinuo
> `10 18`.
>
> Un suelo: elipse de brillo centrada en (410,290) con radios 380x30, degradado radial de
> `#3ad4e6` a transparente, opacidad 0.35; y dos líneas horizontales en y=288 de x=20 a
> x=800 en `#3ad4e6`, una nítida al 50% de opacidad y otra difuminada al 90%.
>
> Nada de estrellas, partículas de fondo ni rejillas: el vacío oscuro es parte del diseño.
>
> Animación en bucle infinito con CSS `@keyframes`, solo `transform` y `opacity` (más
> `stroke-dashoffset` en el cable): el trazo de energía del cable desplaza sus guiones del
> cargador hacia el vehículo con `stroke-dashoffset` de 0 a −56 en 1.2 segundos lineal; el
> LED late entre opacidad 0.45 y 1 cada 1 segundo; su halo late igual pero con 0.3
> segundos de retraso y entre opacidad 0.2 y 0.6; el rayo de la pantalla varía entre
> opacidad 0.7 y 1 cada 2.4 segundos; y el brillo del suelo respira entre opacidad 0.28 y
> 0.42 con escala de 1 a 1.04 cada 4 segundos, con origen en (410,290). Es importante que
> el cable (1.2s) y el LED (1s) NO estén sincronizados.
>
> Todos los elementos en color `#3ad4e6` deben ir en una capa separada llamada "acento".
> Primer fotograma en reposo, bucle sin salto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Sin texto dentro de la imagen. Máximo 60 KB.

## Antes de darlo por bueno

- [ ] El hueco del carro (x=30 a x=490) está **completamente vacío**.
- [ ] El flujo del cable va **del cargador hacia el carro**, no al revés. Es el error más
      común y se nota.
- [ ] A 350 px de ancho (celular) el wallbox se entiende aunque quede pequeño.
- [ ] El LED y el cable no laten al mismo tiempo.
- [ ] Se ve bien con los cinco acentos.
