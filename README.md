# ⚡ Voltio Residencial

**Carga eléctrica compartida entre vecinos de un conjunto residencial.**

Un residente con cargador publica su parqueadero; sus vecinos lo reservan, cargan y le
pagan. La administración ve el consumo del conjunto y descarga el reporte mensual.

**Producción:** [voltio-red.web.app](https://voltio-red.web.app) · **v2.7.4** ·
piloto activo en el conjunto MontReal (3 torres · 96 apartamentos)

[![PWA](https://img.shields.io/badge/PWA-instalable-3ad4e6)](https://voltio-red.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28)](https://firebase.google.com)
[![Wompi](https://img.shields.io/badge/Pagos-Wompi%20%2B%20Bre--B-4ade9a)](https://wompi.co)
[![Sin dependencias](https://img.shields.io/badge/build-ninguno-828d9e)](#arquitectura)

---

## El problema

En Colombia la carga pública para vehículos eléctricos es escasa y cara, pero en un solo
conjunto residencial puede haber varios parqueaderos con cargador que pasan el día
vacíos —porque su dueño está trabajando, de viaje, o simplemente no lo usa a esa hora—.
Al mismo tiempo, vecinos del mismo edificio no tienen dónde cargar.

Voltio conecta esas dos puntas **dentro del conjunto**, donde ya existe la confianza
entre vecinos y no hace falta que nadie se desplace.

## Qué resuelve, en concreto

| Antes | Con Voltio |
|---|---|
| "¿Me prestas el parqueadero?" por WhatsApp | Reserva con fecha y hora, que el anfitrión acepta o declina |
| Dos vecinos aparecen a la misma hora | La hora queda apartada en el servidor: nadie la pisa |
| "¿Cuánto te debo?" a ojo | Lectura del contador antes/después → kWh reales × precio |
| Anotar la lectura a mano | Foto del contador y la app lee los números |
| Transferencia y captura de pantalla | Bre-B, o pago en línea que la app concilia sola |
| La administración no sabe cuánto se consume | Reporte mensual por torre en PDF y CSV |

---

## Funcionalidades

<table>
<tr><td width="33%" valign="top">

### 🚗 Residente que carga

- Busca puestos con filtros de puerto, potencia, tamaño, día y franja horaria
- Ve las **horas ya apartadas** antes de elegir
- **Estimado de cobro** calculado a partir de la duración y la potencia del cargador, o
  puesto a mano si prefiere
- Reserva, sigue su estado y cancela liberando la hora
- Paga por **Bre-B** o **en línea** (tarjeta, PSE, Nequi)
- Chat directo con el anfitrión y calificación al terminar
- Recordatorio el día de la carga

</td><td width="33%" valign="top">

### 🏠 Residente que presta

- Publica su puesto: precio, potencia (incluida una personalizada), horario semanal,
  fotos y condiciones
- Elige **cómo quiere que le paguen**: Bre-B, en línea, o ambos
- Bandeja de solicitudes con aceptar / declinar con motivo
- **Calculadora de cobro por contador**, con lectura por foto (OCR)
- Confirma el pago recibido; los pagos en línea se confirman solos
- Historial, gráficas de ingresos y energía, exportación a CSV
- Recibo compartible como **imagen, PDF o texto**

</td><td width="33%" valign="top">

### ✦ Administración

- Panel con métricas del conjunto: ingresos, energía, reservas, puestos
- Actividad de los últimos 8 días y ranking de puestos más usados
- **Reporte mensual por torre** en PDF y CSV
- Puestos comunes y de visitantes, que se reservan sin aprobación
- Gestión de residentes: rol, acceso y datos de contacto

</td></tr>
</table>

---

## Seguridad

El piloto mueve dinero real entre vecinos, así que las decisiones de seguridad no se
delegan al navegador:

**Acceso al conjunto.** Se entra con el código que reparte la administración. El código
vive en un documento de Firestore que **ningún cliente puede leer** — solo lo consultan
las reglas de seguridad para comparar —, así que no queda expuesto en el JavaScript.
Sin él, la app se puede mirar pero no reservar ni publicar.

**Reservas dobles.** Cada reserva aparta sus cuartos de hora como documentos con id
determinista (`puesto__fecha__hora`). Firestore rechaza crear un id que ya existe y el
lote es todo-o-nada: aunque dos vecinos toquen *Agendar* en el mismo segundo, solo uno se
queda con la hora. El último medio cuarto se deja libre a propósito, para permitir 15
minutos de relevo entre una carga y la siguiente.

**Pagos.** El vecino no puede declararse pagado: las reglas se lo impiden. Un pago en
línea se registra como constancia y se **verifica contra la API de Wompi desde la sesión
del anfitrión**, comparando el monto, antes de dar la reserva por pagada.

**Privacidad.** El perfil de un residente (celular, torre, apartamento) solo lo leen su
dueño y la administración. Las llaves de la pasarela viven fuera del documento público
del puesto.

### Cómo comprobarlo

```bash
node scripts/test-rules.js
```

24 casos contra el simulador de reglas de Firebase (requiere el permiso
`firebaserules.rulesets.test` en la cuenta de servicio).

Y **[/diagnostico.html](https://voltio-red.web.app/diagnostico.html)** ejecuta las
pruebas del camino autenticado contra Firestore real: código correcto e incorrecto,
bloqueo de hora doble, relevo de 15 minutos, privacidad, estimador y generación del
recibo. Usa una fecha de 2030 y borra lo que crea, así que no toca datos del piloto.

---

## Arquitectura

**Sin framework, sin build, sin dependencias en el cliente.** Se despliega copiando
`public/` y arranca instantáneo en el celular de cualquier vecino, incluso con mala
conexión.

```
public/
├── index.html               Todas las vistas + escenas SVG de los 4 vehículos
├── css/styles.css           Sistema visual (5 acentos, glassmorphism, animaciones)
├── js/
│   ├── app.js               Roles, búsqueda, reservas, cobro, gráficas, PWA
│   ├── backend.js           Firebase Auth + Firestore en tiempo real (módulo ES)
│   ├── wompi.js             Checkout firmado SHA-256 y verificación de transacciones
│   ├── ocr.js               Lectura del contador por foto (motor bajo demanda)
│   ├── recibo.js            Recibo dibujado en canvas → imagen o PDF
│   ├── reporte.js           Reporte mensual del conjunto → PDF y CSV
│   └── firebase-config.js   Configuración pública + clave VAPID
├── sw.js                    Service worker (offline + caché versionada)
├── firebase-messaging-sw.js Notificaciones con la app cerrada
└── diagnostico.html         Pruebas en vivo contra el backend real

functions/                   Cloud Functions de notificaciones (requiere Blaze)
scripts/                     Aprovisionamiento y pruebas por REST, sin dependencias
diseno/animaciones/          Guías para generar las animaciones con IA
```

**Backend:** Firebase Auth (Google y correo) + Cloud Firestore en tiempo real.
La base de datos se llama `default` (no `(default)`), así que el release de reglas es
`cloud.firestore/default`.

**Decisiones técnicas notables**
- Los PDF se generan a mano, byte a byte, sin librerías — tanto el reporte mensual
  (texto) como el recibo (imagen JPEG embebida por `/DCTDecode`).
- El OCR descarga su motor solo la primera vez que alguien usa la cámara, para no cargar
  4 MB a quien nunca la va a usar.
- El fondo, las animaciones y las microinteracciones respetan `prefers-reduced-motion`.
- Las preferencias del residente (vehículo, color, tarifa) viajan en su perfil, no en el
  dispositivo.

---

## Desarrollo local

Solo hace falta [Node.js](https://nodejs.org) 16+.

```bash
npm start
```

→ http://localhost:5173

> El service worker cachea el JavaScript: tras editar hay que **recargar dos veces** (la
> primera actualiza la caché en segundo plano).

En localhost aparecen puestos de ejemplo que en producción no existen. Para probar la
interfaz de administración sin backend: `localStorage.setItem('voltio.dev.admin','1')`.

## Despliegue

```bash
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

Usa una cuenta de servicio aislada (`GOOGLE_APPLICATION_CREDENTIALS`) para no depender
del `firebase login` que haya activo en la máquina.

**Al desplegar cambios en JS o CSS hay que subir la versión** en las URLs de
`index.html` y en `VERSION` de `sw.js`: sin eso, los visitantes anteriores se quedan con
la versión vieja en caché.

### Operación del conjunto

```bash
node scripts/backend-setup.js codigo MONTREAL2026   # cambiar el código de acceso
node scripts/backend-setup.js admin correo@ejemplo.com admin
node scripts/backend-setup.js rules                 # publicar reglas de Firestore
node scripts/backend-setup.js check                 # estado del backend
node scripts/backend-setup.js unseed                # retirar los puestos de ejemplo
```

### Notificaciones con la app cerrada

El código está listo; faltan dos pasos que implican facturación:

1. Activar el **plan Blaze** en el proyecto (la capa gratuita cubre de sobra un piloto).
2. Firebase → Configuración → Cloud Messaging → *Web Push certificates* → **Generate key
   pair**, y pegar la clave en `vapidKey` de `public/js/firebase-config.js`.
3. `cd functions && npm install && firebase deploy --only functions`

Mientras `vapidKey` esté vacía, la app no intenta nada y los avisos siguen llegando con
la app abierta.

---

## Estado y siguientes pasos

- [x] Backend real con Firebase Auth y Firestore en tiempo real
- [x] Reservas con calendario, aceptación y motivos de rechazo
- [x] Calculadora de cobro por contador con historial en la nube
- [x] Reporte mensual por torre (PDF y CSV)
- [x] Pagos Bre-B con QR y **Wompi con conciliación verificada**
- [x] Lectura del contador por foto (OCR en el dispositivo)
- [x] Bloqueo de reservas solapadas a nivel de servidor
- [x] Código de acceso al conjunto y perfiles privados
- [x] Recibo compartible como imagen o PDF
- [ ] Notificaciones con la app cerrada *(código listo, requiere Blaze)*
- [ ] Verificación de identidad para el distintivo 🪪
- [ ] Check-in con QR al llegar al puesto
- [ ] Escalar a varios conjuntos con un mismo despliegue

---

## Licencia

MIT. Hecho con ⚡ y energía limpia en Colombia.
