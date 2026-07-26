# ⚡ Voltio — Carga Compartida

**La red de carga para vehículos eléctricos entre vecinos.**
Cualquier persona en Colombia puede ofrecer su parqueadero con cargador como punto de
carga —porque no lo usa, está de viaje o quiere un ingreso extra— y cualquier conductor
puede encontrarlo, compararlo y reservarlo.

🌐 **App en vivo:** https://voltio-red.web.app

> PWA instalable · 100% responsive (celular y PC) · Mapa real (OpenStreetMap) · Backend Firebase en tiempo real

---

## 💡 La idea

La infraestructura pública de carga en Colombia todavía es escasa, pero hay miles de
garajes privados con cargadores (o simples tomas de 110/220 V) que pasan horas sin
usarse. **Voltio conecta esas dos puntas:**

- **🏠 Anfitriones** publican su parqueadero: precio por kWh, potencia, tipo de puerto,
  horario semanal de disponibilidad y su llave **Bre-B** para recibir el pago.
- **🚗 Conductores** ven un mapa con los puestos cercanos, filtran por precio, potencia,
  puerto o disponibilidad, comparan y **solicitan una reserva** que el anfitrión puede
  aceptar o declinar.

Además, Voltio incluye la herramienta original que dio origen al proyecto: una
**calculadora de cobro por contador** — anotas la lectura del medidor antes y después de
la carga y la app calcula los kWh y el total en COP, con recibo compartible por WhatsApp.

> **Backend real:** la app usa **Firebase Auth** (Google o correo) y **Cloud Firestore**
> con actualizaciones en tiempo real: las estaciones publicadas, reservas, chats y
> calificaciones existen de verdad y se sincronizan entre dispositivos al instante.
> El mapa es **OpenStreetMap vía Leaflet** con geolocalización GPS y pines en vivo.
> Reglas de seguridad de Firestore incluidas en [`firestore.rules`](firestore.rules).

---

## ✨ Funcionalidades

### Para conductores 🚗
- **Mapa estilizado** con tu ubicación, anillos de distancia y pines de puestos cercanos
  (encendidos si están disponibles ahora).
- **Filtros en vivo**: ordenar por cercanía/precio/potencia, precio máximo, potencia
  mínima (7/11/22 kW), tipo de puerto (Tipo 1, Tipo 2, CCS, doméstico) y "disponible ahora".
- **Ficha de cada puesto**: calificación, verificación, specs, horario y **estimador de
  costo** según los kWh que necesites.
- **Reservas**: eliges fecha y hora dentro del horario del anfitrión, envías la solicitud
  y sigues su estado (pendiente → confirmada/rechazada). Al confirmarse, ves la **llave
  Bre-B y el titular** para transferir el pago, con botón de copiar.

### Para anfitriones 🏠
- **Publica tu puesto**: nombre, dirección, precio/kWh, potencia, puerto, disponibilidad
  semanal (días + franja horaria) y datos de pago Bre-B.
- **Bandeja de solicitudes** con aceptar/declinar.
- **Calculadora de cobro por contador** (lectura antes/después) o por kWh directos, con
  tarifa de servicio y descuento opcionales, torre/apartamento del vecino y **guardado
  automático**.
- **Historial** con totales y exportación a CSV.
- **Gráficas**: ingresos (COP) y energía (kWh), por día o por vecino, con unidades y
  animaciones.

### Experiencia ⚡
- **Animación de carga cinematográfica**: tu vehículo llega con suspensión real, se
  conecta al wallbox, carga con contadores en vivo (kWh y COP) y arranca al terminar.
- **4 vehículos a elegir**: automóvil, pickup, SUV familiar o 4x4 alto — el que más se
  parezca al tuyo.
- **Estética futurista**: glassmorphism, neón sobrio, tipografías Orbitron + Exo 2 y
  5 colores de acento.
- **Extras EV** en cada recibo: autonomía estimada, CO₂ evitado y ahorro vs gasolina.
- **PWA**: instalable en Android/iOS/PC y funciona sin conexión.
- **Privacidad**: todo se guarda en tu dispositivo (localStorage). Nada se envía a servidores.

---

## 🖥️ Correr en local

Solo necesitas [Node.js](https://nodejs.org) 16+ (sin dependencias que instalar):

```bash
npm start
# → http://localhost:5173
```

Alternativas: `python -m http.server 5173 --directory public` o cualquier servidor estático.

**Probar en el celular** (misma red WiFi): abre `http://IP-DE-TU-PC:5173`.

## 🚀 Desplegar (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
# edita .firebaserc con tu Project ID
firebase deploy
```

La configuración de `firebase.json` ya maneja el caché correctamente (HTML y assets
versionados sin caché pegajoso, imágenes con caché de 7 días).

---

## 📁 Estructura

```
├── public/                  # La app completa (esto es lo que se despliega)
│   ├── index.html           # Vistas + escenas SVG de los 4 vehículos
│   ├── css/styles.css       # Estética futurista + animaciones
│   ├── js/app.js            # Roles, mapa, reservas, cálculo, gráficas, PWA
│   ├── sw.js                # Service worker (offline)
│   ├── manifest.webmanifest
│   └── icons/
├── scripts/gen-icons.js     # Generador de íconos PNG (cero dependencias)
├── server.js                # Servidor local de desarrollo (cero dependencias)
├── firebase.json            # Hosting + política de caché
└── deploy.ps1               # Redespliegue con cuenta de servicio (Windows)
```

**Decisiones técnicas:** vanilla JS sin frameworks ni librerías (carga instantánea,
offline total, sin build), SVG + Web Animations API para las animaciones, gráficas SVG
propias, y datos en localStorage con claves versionadas.

---

## 💳 Pagos (diseño)

Hoy: el anfitrión registra su **llave Bre-B** (el sistema de pagos inmediatos de
Colombia) y el nombre del titular. El conductor los ve al confirmarse la reserva,
transfiere desde su banco y verifica el titular antes de enviar.

Siguiente paso pensado: integración **PSE / pasarela** (Wompi, PayU o similar) con
retención del pago hasta completar la carga y liberación automática al anfitrión
(split payment), eliminando la transferencia manual.

## 🏙️ Piloto residencial (v2.4 — conjunto MontReal)

La app en producción es **Voltio Residencial**: el mismo motor, pero cerrado a un
conjunto. Además del rol `admin` (panel de métricas, puestos comunes y usuarios), la
v2.4 agrega:

- **📄 Reporte mensual para la administración** — en el panel, con selector de mes:
  consumo e ingresos **por torre**, detalle por puesto y detalle de cargas.
  Se descarga en **PDF** (generado por [`public/js/reporte.js`](public/js/reporte.js),
  sin librerías) y en **CSV** (separador `;`, decimales con coma → lo abre Excel en
  español directo).
- **🔋 Historial real del conjunto** — las cargas medidas con la calculadora ya no se
  quedan en `localStorage`: se guardan también en la colección **`sessions`** de
  Firestore. Al entrar con la cuenta, las que estaban solo en el dispositivo se
  sincronizan solas.
- **🔗 Reserva ↔ carga real** — al calcular un cobro puedes vincularlo con una reserva;
  esta queda `completada` con `kwhReal`/`totalReal` y el panel **no la cuenta dos
  veces** (las reservas con `kwhReal` se excluyen del estimado).
- **💵 Pago recibido** — el anfitrión confirma que llegó la transferencia Bre-B
  (`pagado`); el vecino lo ve en su reserva y el panel muestra *pagado* vs *por cobrar*.
- **📷 Fotos del puesto** — hasta 3, comprimidas en el dispositivo con
  `compressImageFile`, visibles en la ficha antes de reservar.

> **Reglas de Firestore:** la colección `sessions` y la restricción del campo `pagado`
> (solo anfitrión o admin) están en [`firestore.rules`](firestore.rules). Publícalas con
> `node scripts/backend-setup.js rules` — la base de este proyecto se llama `default`,
> así que el release es `cloud.firestore/default`.

## 🔒 v2.6 — Nadie pisa la hora de otro, y solo entran los del conjunto

- **⛔ Reservas dobles, imposibles.** Cada reserva aparta sus cuartos de hora como
  documentos con id fijo (`puesto__fecha__hora`). Como Firestore rechaza crear un id
  que ya existe y el lote es todo-o-nada, **el choque lo impide el servidor**: aunque
  dos vecinos toquen *Agendar* en el mismo segundo, solo uno se queda con la hora.
  El último medio cuarto no se aparta a propósito, así que **una carga puede empezar
  cuando otra va terminando (hasta 15 minutos de relevo)**. En la ficha del puesto se
  ven las franjas ya tomadas, y cancelar o declinar libera la hora.
- **🔐 Código del conjunto.** Sin él se puede mirar la app, pero no reservar ni publicar.
  El código vive en `config/acceso`, **un documento que ningún cliente puede leer**:
  solo lo consultan las reglas de seguridad para comparar, así que no queda expuesto
  en el JavaScript. Quien lo mete queda con el distintivo **✓ Vecino verificado**,
  visible en su puesto y en sus reservas. La administración puede verificar a alguien
  a mano desde *Usuarios*.
  Se cambia con `node scripts/backend-setup.js codigo MONTREAL2026`.
- **🗑️ Cancelar una reserva confirmada** (antes solo se podían cancelar las pendientes),
  con aviso extra si ya tenía un pago registrado.
- **📅 Recordatorio del día**: al abrir la app, "Hoy cargas a las 3:00 p.m. · Torre 2 ·
  puesto P-208". Al anfitrión le avisa a quién recibe hoy. Sin depender de push.
- **🔎 Privacidad reforzada**: el perfil de un vecino (celular, torre, apartamento) ya
  solo lo leen su dueño y la administración. Antes lo veía cualquier cuenta con sesión.

### Comprobarlo tú mismo

- `node scripts/test-rules.js` — 24 casos contra el simulador de reglas de Firebase
  (necesita el permiso `firebaserules.rulesets.test` en la cuenta de servicio).
- **https://voltio-red.web.app/diagnostico.html** — entras con tu cuenta y corre las
  pruebas de verdad contra Firestore: código correcto e incorrecto, bloqueo de horas
  dobles, relevo de 15 minutos, privacidad y firma de Wompi. Usa una fecha de 2030 y
  borra lo que crea, así que no toca datos reales.

## 🚀 v2.5 — Lista para el piloto real

- **💳 Pago en línea con Wompi (tarjeta, PSE, Nequi)** — opcional y por anfitrión.
  Cada quien decide: solo Bre-B, solo en línea, o los dos; al vecino le aparecen
  únicamente los métodos que su anfitrión configuró.
  La **conciliación es automática**: al volver del banco se consulta la transacción
  contra la API de Wompi y, cuando el anfitrión abre la app, se vuelve a verificar
  desde su sesión antes de dar la reserva por pagada.
  Con una llave `pub_test_` los pagos son simulados: se puede ensayar todo el flujo
  sin mover un peso.
- **📷 Lectura del contador por foto (OCR)** — botón de cámara en la calculadora.
  Encuadras los números, la app los lee en el dispositivo (la foto no se sube) y
  propone la lectura para que la confirmes. El motor se descarga solo la primera vez.
- **🚙 Tu carro en la pantalla de inicio** — el vehículo y el color elegidos aparecen
  animados al entrar, y **quedan guardados en la cuenta**: al entrar desde otro
  celular siguen ahí.
- **🏢 El conjunto real** — 3 torres × 8 pisos × 4 apartamentos (101 → 804), con
  selectores en lugar de campos libres.
- **✦ Panel de administración depurado** — el administrador ya no ve ajustes de
  residente (su información en el conjunto, notificaciones, precio de la energía,
  estimaciones y recibo) ni el selector de vehículo: solo los colores.
- **🔔 Push con la app cerrada** — cliente y Cloud Functions listos en
  [`functions/`](functions/index.js); se activan al pasar el proyecto a Blaze
  (ver abajo).
- Sin puestos de ejemplo en producción: en el conjunto solo se ven cargadores reales.

### Notificaciones con la app cerrada

Queda todo escrito; falta un paso que es tuyo porque implica facturación:

1. Activa el **plan Blaze** en el proyecto `voltio-aec23` (tiene capa gratuita amplia:
   el piloto no debería costar nada).
2. Firebase → Configuración del proyecto → **Cloud Messaging** → *Web Push
   certificates* → **Generate key pair**.
3. Pega esa clave en `vapidKey` dentro de
   [`public/js/firebase-config.js`](public/js/firebase-config.js).
4. `cd functions && npm install && firebase deploy --only functions`

Mientras `vapidKey` esté vacía la app no intenta nada: los avisos siguen llegando
con la app abierta, como hasta ahora.

## 🗺️ Roadmap

- [x] **Backend real**: Firebase Auth (Google/correo) + Firestore en tiempo real.
- [x] **Mapa real** (Leaflet + OpenStreetMap) con GPS y pin arrastrable al publicar.
- [x] Calificaciones bidireccionales (anfitrión ↔ conductor) con agregados en vivo.
- [x] Chat anfitrión-conductor (también sin reserva: "pregúntale al anfitrión").
- [x] Fotos del parqueadero (comprimidas en el dispositivo) y condiciones del servicio.
- [x] Reporte mensual (PDF/CSV) por torre para la administración.
- [x] Historial real del conjunto: cargas de la calculadora en Firestore.
- [x] Confirmación de pago recibido por el anfitrión.
- [x] **Pagos integrados (Wompi) con conciliación automática.**
- [x] **Lectura del contador por foto (OCR).**
- [x] Preferencias del residente guardadas en su cuenta.
- [ ] **Notificaciones push con la app cerrada** (código listo; requiere plan Blaze + clave VAPID).
- [ ] Verificación de identidad (cédula) para el badge 🪪.
- [ ] Check-in con QR al llegar al puesto.

## 🤝 Contribuir

El proyecto es abierto: issues y pull requests son bienvenidos. La app está pensada para
crecer por módulos (el marketplace, la calculadora y las gráficas son independientes).

---

Hecho con ⚡ y energía limpia en Colombia.
