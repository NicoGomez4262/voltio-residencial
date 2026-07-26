# 07 · Estados vacíos

> Lee antes `00-GUIA-GENERAL.md`.

## Por qué importan tanto en este piloto

El conjunto **arranca con la app vacía**: no hay puestos publicados, no hay reservas, no
hay mensajes. Los primeros días, **la pantalla vacía es la app**. Si se ve triste, la
gente cree que la app no sirve; si se ve como una invitación, publican su puesto.

Hoy son un emoji grande y dos líneas de texto. Funcionan, pero es el sitio donde una
ilustración cambia más la percepción.

## Medidas (las mismas para las cinco)

- **`viewBox="0 0 240 180"`**, relación 4:3.
- Se muestran a **160-200 px de ancho**, centradas. **Son pequeñas**: nada de detalles
  finos, todo con formas de 3 px de grosor mínimo.
- El texto va **debajo**, lo pone la app. **Cero texto dentro.**
- Estilo: **trazo, no relleno**. Líneas de 3 px en `rgba(255,255,255,0.18)`, con los
  elementos importantes en color de acento. Deben sentirse dibujadas, ligeras, no macizas.

---

## 1. Sin puestos publicados

**Dónde:** pantalla *Buscar*, cuando nadie ha publicado todavía. **Es la más importante
del piloto**, porque es la primera que verá todo el conjunto el día uno.

**Qué dibujar:** un **parqueadero vacío visto de frente**: dos líneas blancas del piso
delimitando un espacio, y al fondo una toma de corriente en la pared, esperando. La idea
que debe transmitir es "hay sitio, falta que alguien lo comparta" — no "aquí no hay nada".

**Animación · EN BUCLE, 3.5 s:**
- El **enchufe de la pared late suavemente** (opacidad 0.4 → 0.9), como diciendo "estoy
  listo".
- Las líneas del piso **se dibujan solas** una vez por ciclo: `stroke-dashoffset` de
  lleno a vacío en 1.2 s, con 2 s de pausa antes de repetir.

## 2. Sin reservas

**Dónde:** pantalla *Reservas* del vecino.

**Qué dibujar:** un **calendario minimalista** con las casillas vacías, y en una de ellas
un pequeño **rayo** del color de acento, insinuando la carga que aún no se ha agendado.

**Animación · EN BUCLE, 4 s:**
- El rayo **aparece y desaparece** de una casilla y **reaparece en otra** (dos posiciones
  alternas), con un desvanecido de 0.4 s.
- Las casillas quietas. Solo se mueve el rayo.

## 3. Sin solicitudes (anfitrión)

**Dónde:** pantalla *Novedades*.

**Qué dibujar:** una **bandeja de entrada vacía** — una bandeja de líneas simples, y
sobre ella un sobre pequeño **flotando**, aún sin caer.

**Animación · EN BUCLE, 3 s:**
- El sobre **flota 5 px** arriba y abajo.
- Su **sombra sobre la bandeja se achica y se aclara** cuando sube (el mismo truco del
  carro: es lo que da profundidad).

## 4. Sin mensajes

**Dónde:** pantalla *Chats*.

**Qué dibujar:** **dos globos de conversación** enfrentados, vacíos.

**Animación · EN BUCLE, 2.4 s:**
- Dentro del globo de la izquierda, **tres puntos de "escribiendo"** que suben y bajan
  con 0.16 s de desfase entre ellos.
- Los globos quietos. Es el detalle clásico y funciona porque todo el mundo lo reconoce.

## 5. Sin historial de cargas

**Dónde:** pantalla *Análisis*.

**Qué dibujar:** un **gráfico de barras con las barras en el suelo** (a altura casi cero),
y una línea de base del color de acento.

**Animación · EN BUCLE, 5 s:**
- Las barras **crecen un poco y vuelven a bajar** (de 4 px a 12 px de alto), en cascada
  con 0.15 s de desfase entre ellas.
- Transmite "aquí van a aparecer tus datos", no "no tienes nada".

---

## Prompt para la IA generativa

Genera **las cinco por separado**, cambiando la descripción del dibujo y la animación.
Esta es la plantilla, con la primera ya rellenada:

> Ilustración vectorial SVG minimalista para un **estado vacío** de una aplicación web
> oscura, estilo línea (outline), fondo transparente.
>
> `viewBox="0 0 240 180"`. Se mostrará a solo 180px de ancho, así que **sin detalles
> finos**: todos los trazos de 3px de grosor, formas simples y legibles a tamaño pequeño.
> Trazos en `rgba(255,255,255,0.18)` y los elementos destacados en `#3ad4e6`, este último
> en una capa separada llamada "acento". Sin relleno macizo: debe sentirse dibujado y
> ligero. **Sin ningún texto dentro de la imagen.**
>
> **Qué dibujar:** un parqueadero vacío visto de frente: dos líneas blancas del piso
> delimitando una plaza de aparcamiento, y al fondo, en la pared, una toma de corriente
> esperando. Debe transmitir "hay sitio disponible", no "no hay nada". La toma de
> corriente va en el color de acento.
>
> **Animación** en bucle infinito de 3.5 segundos con CSS `@keyframes`, animando solo
> `transform`, `opacity` y `stroke-dashoffset`: la toma de corriente late suavemente entre
> opacidad 0.4 y 0.9; y las dos líneas del piso se dibujan solas una vez por ciclo
> mediante `stroke-dashoffset`, tardando 1.2 segundos en trazarse y quedándose completas
> los 2 segundos restantes antes de repetir.
>
> Primer fotograma en reposo, bucle sin salto. Incluye
> `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
> Máximo 20 KB.

## Antes de darlas por buenas

- [ ] **A 180 px de ancho se entiende qué es** sin leer el texto de abajo.
- [ ] **Invita en vez de deprimir.** Léela como un vecino que abre la app por primera vez:
      ¿te dan ganas de publicar tu puesto, o te da la sensación de que la app está muerta?
- [ ] Las cinco se ven de la misma familia: mismo grosor de trazo, mismo nivel de detalle.
- [ ] Ninguna tiene texto dentro.
- [ ] Ninguna pesa más de 20 KB.
