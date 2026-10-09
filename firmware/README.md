# Firmware — sensores de temperatura (Heltec ESP32-S3 + DS18B20)

## El error

Al compilar un sketch que usa **OneWire** junto con la librería **Heltec ESP32 Dev-Boards**
en el core **Heltec-esp32 3.3.x** (ESP32-S3):

```
esp32-hal-gpio.h:68:34: error: 'GPIO_IS_VALID_GPIO' was not declared in this scope;
did you mean 'RTC_GPIO_IS_VALID_GPIO'?
OneWire/util/OneWire_direct_gpio.h:214:10: note: in expansion of macro 'digitalPinIsValid'
```

### Causa

La librería Heltec trae su propio archivo `src/driver/gpio.h` (el driver GPIO de LoRa de
Semtech). Cuando el sketch incluye cualquier cabecera de Heltec, la carpeta `src/` de esa
librería entra en la ruta de búsqueda de **todas** las unidades de compilación, también la
de `OneWire.cpp`. El core del ESP32 hace `#include "driver/gpio.h"` esperando el de
ESP-IDF, pero recibe el de Heltec, que no define `GPIO_IS_VALID_GPIO`. OneWire usa
`digitalPinIsValid()`, que se expande a esa macro, y la compilación falla.

No es culpa del sketch, ni de la versión de OneWire (la 2.3.8 también falla), y no se
arregla bajando de versión el core.

## El arreglo

Copia [`sensor_temperatura/build_opt.h`](sensor_temperatura/build_opt.h) a la carpeta
de tu sketch, junto al `.ino`, y vuelve a compilar.

El core del ESP32 pasa ese archivo como opciones del compilador a todo el proyecto,
librerías incluidas. Define `GPIO_IS_VALID_GPIO` (y sus dos hermanas) con exactamente
el mismo texto que ESP-IDF, así que:

- **No modifica ninguna librería.** Sobrevive a las actualizaciones de OneWire, de Heltec y del core.
- **No choca con ESP-IDF.** Cuando el `gpio.h` correcto sí se incluye, la redefinición es
  idéntica y el compilador no avisa nada.
- Si un día Heltec renombra su archivo, el `build_opt.h` sigue sin hacer daño.

> El `build_opt.h` **solo** puede tener opciones del compilador: nada de comentarios
> ni `#include`. Si el IDE lo abre como pestaña, no lo edites.

### Comprobado

Compilación completa con `arduino-cli` 1.3.1, core ESP32 3.3.8 (el mismo en el que se
basa Heltec-esp32 3.3.8), placa `heltec_wifi_lora_32_V3`, Heltec ESP32 Dev-Boards 2.1.7
(precompilada para esp32s3) y OneWire 2.3.8:

| | Resultado |
|---|---|
| Sin `build_opt.h` | El mismo error, en las mismas líneas 214 y 240 |
| Con `build_opt.h` | Compila y enlaza: 336 KB de flash (10 %), 23 KB de RAM (7 %) |

## Otro problema de OneWire en el ESP32-S3: pines por encima del 33

OneWire 2.3.8 **no pone como salida** los GPIO mayores que 33 (`pin <= 33` en
`directModeOutput`). En el S3 eso deja el bus mudo: compila, no da error, y
`search()` no encuentra nada. En la Heltec WiFi LoRa 32 V3 casi todos los pines libres
del conector (38–42, 45–48) caen ahí.

**Usa un GPIO libre ≤ 33** (en la WiFi LoRa 32 V3: del 2 al 7). El módulo de abajo lo
comprueba al compilar con `static_assert` y al arrancar.

## `SensorTemperatura`: lectura robusta de DS18B20

[`sensor_temperatura/`](sensor_temperatura/) es un sketch de ejemplo que compila tal cual
y trae un módulo para copiar a tu propio sketch (`SensorTemperatura.h` y `.cpp`, más el
`build_opt.h`). Solo depende de OneWire.

| Problema típico | Qué hace el módulo |
|---|---|
| `requestTemperatures()` bloquea 750 ms y frena LoRa/WiFi/pantalla | Lanza la conversión y la cosecha después: `iniciarConversion()` / `conversionLista()` / `leer()` |
| Cable largo o ruidoso: temperaturas inventadas | CRC de la ROM y del scratchpad, con 3 reintentos |
| Bus en corto: nueve ceros **pasan el CRC** y se lee 0 °C | Descarta bloques de puros ceros o puros `0xFF` |
| Sensor desconectado: −127 °C que nadie revisa | Estado `SinSensor` explícito, y redescubre el bus solo |
| Sensor reiniciado: 85 °C | Lo confirma con una conversión nueva. Si vuelve a dar 85 °C, es real y no se esconde: en un cargador puede ser un conector caliente |
| Falta la resistencia de 4.7 kΩ | Estado `BusEnCorto` (la línea no sube) |
| Alimentación parásita | La detecta y mantiene el bus en alto durante la conversión |
| Pin que OneWire no puede manejar | `static_assert` al compilar y `PinInvalido` al arrancar |

Uso mínimo:

```cpp
#include "SensorTemperatura.h"

SensorTemperatura sensores(7);          // GPIO 7, 12 bits

void setup() { sensores.begin(); }

void loop() {
  static bool esperando = false;
  if (!esperando) esperando = sensores.iniciarConversion();
  if (esperando && sensores.conversionLista()) {
    esperando = false;
    for (uint8_t i = 0; i < sensores.cantidad(); i++) {
      auto l = sensores.leer(i);
      if (l.ok()) { /* usar l.celsius; identificar el sensor por l.rom */ }
    }
  }
}
```

Conexión: datos del sensor al GPIO elegido, con una resistencia de **4.7 kΩ** entre datos y 3V3.
