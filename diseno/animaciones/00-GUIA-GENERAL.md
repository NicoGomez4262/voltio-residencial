# Voltio · Guía general para generar animaciones

**Léela antes que cualquier otro archivo de esta carpeta.** Todo lo que se genere
tiene que caber en este sistema visual, si no la app se ve como un collage.

---

## 1. Qué es Voltio y qué tono tiene

Voltio Residencial es una app de carga de vehículos eléctricos **entre vecinos de un
conjunto residencial en Colombia**. No es una app de una petrolera ni de una marca de
carros: es cotidiana, de barrio, de gente que se presta el parqueadero.

**El tono es "minimalista-futurista":** oscuro, limpio, con un solo color de acento que
brilla. Cero degradados arcoíris, cero brillos exagerados, cero estética gamer. Piensa
en el tablero de un carro eléctrico bien diseñado, no en una nave espacial.

**Regla de oro:** si una animación llama más la atención que el dato que acompaña,
está mal. La animación acompaña, no protagoniza.

---

## 2. Paleta obligatoria

El fondo es siempre oscuro. El color de acento **lo elige cada usuario** entre cinco
opciones, así que **nada puede tener el acento quemado dentro**: se entrega como
variable o como capa separada que se pueda recolorear.

| Uso | Color | Nota |
|---|---|---|
| Fondo de la app | `#0a0c11` | casi negro azulado |
| Superficie de tarjeta | `#12151c` | |
| Superficie elevada | `#1e2330` | |
| Texto principal | `#e9edf4` | |
| Texto secundario | `#aab4c4` | |
| Texto tenue | `#828d9e` | mínimo legible (AA) |
| Carrocería (oscuro→claro) | `#0b0f1a` → `#151b2c` → `#2b3550` | degradado vertical |
| Vidrios | `#6ff0ff` 55% → `#0a1830` 90% | diagonal |
| Llantas | `#0a0f18`, aro `#1c2740`, rines `#38507e` | |
| Peligro / error | `#e8697a` | |

**Los cinco acentos posibles** (el mismo elemento debe verse bien con los cinco):

| Nombre | Acento | Acento 2 |
|---|---|---|
| cyan (por defecto) | `#3ad4e6` | `#5ee7c8` |
| verde | `#4ade9a` | `#3ad4e6` |
| violeta | `#8b8cf0` | `#3ad4e6` |
| dorado | `#e8c46a` | `#e89a5a` |
| rosa | `#e878b8` | `#9b7ce8` |

> **Cómo entregar el color:** en SVG, poner `fill="var(--accent)"` o `class="acento"`
> en las piezas que deben tomar el color del usuario. Si la herramienta no permite
> variables, usa **cyan `#3ad4e6`** y deja esas piezas **en una capa aparte llamada
> `acento`**, sin fusionar con el resto.

---

## 3. Formato de entrega (esto es lo más importante)

### Prioridad 1 — SVG animado con CSS (lo que ya usa la app)
Un solo archivo `.svg` o un fragmento `<svg>` con la animación en `<style>` interno
usando `@keyframes`. **Es el formato preferido**: pesa unos pocos KB, escala perfecto
en cualquier pantalla y toma el color del usuario.

### Prioridad 2 — Lottie (`.json`)
Solo si la animación tiene más de 6 u 8 elementos moviéndose a la vez. Máximo **150 KB**.

### Prioridad 3 — WebM/APNG
Solo para cosas imposibles en vector (humo, partículas reales). Máximo **300 KB**.
Siempre con fondo transparente.

### ❌ Nunca
GIF (pesa mucho y se ve con bordes), JPG con fondo negro pegado, PNG de más de 200 KB,
vídeo con audio, nada que requiera una librería externa de más de 50 KB.

---

## 4. Reglas técnicas que no se negocian

1. **Todo en bucle perfecto.** El último fotograma tiene que empalmar con el primero sin
   salto visible. Si el bucle "pega", está mal.
2. **Duración del bucle: entre 3 y 8 segundos.** Más corto cansa, más largo no se nota.
3. **60 fps o animación por CSS.** Nada de 12 fps entrecortados.
4. **Solo se animan `transform` y `opacity`.** Mover `left`, `top`, `width` o `height`
   hace que el celular se caliente y la app se sienta lenta.
5. **Nada de texto dentro de la imagen.** El texto lo pone la app, que está en español
   y tiene que poder cambiarlo.
6. **Fondo transparente siempre.**
7. **Respetar `prefers-reduced-motion`.** Incluye siempre este bloque al final del CSS:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * { animation: none !important; }
   }
   ```
   Hay gente a la que el movimiento le produce mareo. No es opcional.

---

## 5. Responsive: se ve en celular y en PC

La app tiene **un ancho máximo de 620 px** y se centra. O sea: en un PC no se estira,
se queda como una columna. Pero el celular es lo que más se usa.

- **Todo con `viewBox`**, nunca con `width`/`height` fijos en píxeles.
- **Probar a 320 px de ancho** (el celular más pequeño que existe hoy). Si a ese tamaño
  un detalle no se distingue, ese detalle sobra.
- **Nada de detalles menores a 2 px** de grosor: desaparecen en pantallas pequeñas.
- **La zona importante debe caber en el centro**: si la imagen se recorta por los lados,
  no se puede perder lo esencial.
- Si el diseño necesita cambiar en pantalla ancha, entrégalo con
  `@media (min-width: 700px)` dentro del mismo SVG, no como dos archivos.

---

## 6. Buenas prácticas de la web moderna que quiero que se respeten

- **Movimiento con física, no lineal.** Nada se mueve a velocidad constante en la vida
  real. Usa `cubic-bezier(.2,.8,.3,1)` para entradas y `ease-in-out` para bucles.
- **Desfase entre elementos.** Si tres cosas laten, que no laten a la vez: 0 s, 0.4 s,
  0.8 s. Lo simultáneo se ve barato.
- **Amplitud pequeña.** Un carro que flota se mueve 6-8 px, no 40. La elegancia está en
  que se note poco.
- **Una sola idea por animación.** Si el carro flota, brilla, gira las llantas y suelta
  chispas a la vez, no se entiende nada.
- **Sombra que acompaña.** Si algo sube, su sombra se achica y se aclara. Ese detalle es
  el que hace que se vea "caro".
- **Empezar quieto.** El primer fotograma es el estado de reposo, para que si la
  animación no carga, lo que se ve siga teniendo sentido.

---

## 7. Los archivos de esta carpeta

| Archivo | Qué pedir |
|---|---|
| `01-carro-automovil.md` | Sedán del usuario |
| `02-carro-pickup.md` | Camioneta pickup |
| `03-carro-suv.md` | SUV familiar |
| `04-carro-4x4.md` | 4x4 alto |
| `05-escena-de-carga.md` | El carro conectado al wallbox (la escena grande) |
| `06-fondo-app.md` | Fondo general de la aplicación |
| `07-estados-vacios.md` | Ilustraciones de "aún no hay nada aquí" |
| `08-exito-y-pago.md` | Confirmación de reserva y de pago |
| `09-cargando-y-ocr.md` | Esperas: lector del contador, verificación del pago |
| `10-iconos-e-insignias.md` | Insignias (vecino verificado, etc.) e íconos animados |

Cada archivo trae: **medidas exactas, duración, si va en bucle, qué se mueve y qué no,
y el texto listo para pegarle a la IA generativa.**
