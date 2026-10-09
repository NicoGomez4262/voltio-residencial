// Ejemplo: temperatura de uno o varios DS18B20 sin bloquear el loop().
//
// Para usarlo en tu propio sketch, copia junto a tu .ino estos tres archivos:
//   build_opt.h               <- arregla el error 'GPIO_IS_VALID_GPIO' (librería Heltec)
//   SensorTemperatura.h
//   SensorTemperatura.cpp
// Requiere la librería OneWire (Paul Stoffregen) 2.3.8 o posterior.
//
// Conexión: datos del DS18B20 a PIN_ONEWIRE, con resistencia de 4.7 kΩ entre
// datos y 3V3. En la Heltec WiFi LoRa 32 V3 los GPIO 2 a 7 están libres; los
// libres por encima del 33 (38-42, 45-48) NO sirven con OneWire 2.3.8.

#include "SensorTemperatura.h"

constexpr uint8_t PIN_ONEWIRE = 7;
constexpr uint32_t PERIODO_MS = 2000;

static_assert(SensorTemperatura::pinValido(PIN_ONEWIRE),
              "PIN_ONEWIRE no sirve para OneWire en esta placa: usa un GPIO libre <= 33");

SensorTemperatura sensores(PIN_ONEWIRE, 12);

void imprimirRom(const uint8_t* rom) {
  for (uint8_t i = 0; i < 8; i++) {
    if (rom[i] < 0x10) Serial.print('0');
    Serial.print(rom[i], HEX);
  }
}

void setup() {
  Serial.begin(115200);
  uint8_t n = sensores.begin();
  Serial.printf("Sensores encontrados: %u%s\n", n, sensores.alimentacionParasita() ? " (alimentacion parasita)" : "");
  if (n == 0) {
    Serial.printf("Aviso: %s. Se reintentara en cada ciclo.\n",
                  SensorTemperatura::describir(sensores.estadoBus()));
  }
}

void loop() {
  static uint32_t ultimoCiclo = 0;
  static bool esperando = false;

  if (!esperando && millis() - ultimoCiclo >= PERIODO_MS) {
    ultimoCiclo = millis();
    esperando = sensores.iniciarConversion();
    if (!esperando) {
      Serial.printf("Bus: %s\n", SensorTemperatura::describir(sensores.estadoBus()));
    }
  }

  if (esperando && sensores.conversionLista()) {
    esperando = false;
    // Los índices pueden cambiar si se agrega o quita un sensor: identifícalos por su ROM.
    for (uint8_t i = 0; i < sensores.cantidad(); i++) {
      SensorTemperatura::Lectura l = sensores.leer(i);
      imprimirRom(l.rom);
      if (l.ok()) {
        Serial.printf("  %.2f C\n", l.celsius);
      } else {
        Serial.printf("  error: %s\n", SensorTemperatura::describir(l.estado));
      }
    }
  }

  // Aquí sigue el resto del programa (LoRa, pantalla, WiFi...) sin esperar al sensor.
}
