// Lectura robusta de sensores DS18B20 (y DS1822 / DS18S20) sobre ESP32.
//
// Pensado para placas Heltec (ESP32-S3) con la librería "Heltec ESP32 Dev-Boards"
// instalada. Esa librería trae su propio src/driver/gpio.h que tapa al de ESP-IDF
// y rompe la compilación de OneWire ('GPIO_IS_VALID_GPIO' was not declared): el
// build_opt.h de esta carpeta lo corrige. Ver firmware/README.md.
//
// Qué lo hace robusto frente al ejemplo típico:
//   - No bloquea: la conversión (hasta 750 ms) se lanza y se cosecha después.
//   - Verifica el CRC de la ROM y del scratchpad, y descarta los bloques de puros
//     ceros (pasan el CRC) o puros 0xFF: un cable largo o ruidoso no se convierte
//     en una temperatura inventada.
//   - Distingue sensor desconectado, bus en corto/sin pull-up, valor de arranque
//     de 85 °C y lecturas imposibles.
//   - Reintenta las lecturas fallidas y redescubre el bus si no hay sensores
//     (se conectó tarde, se cambió uno, etc.).
//   - Soporta alimentación parásita (mantiene el bus en alto durante la conversión).
//   - Rechaza en begin() pines que OneWire no puede manejar.

#pragma once

#include <Arduino.h>
#include <OneWire.h>

#ifndef VOLTIO_FIX_GPIO_HELTEC
#warning "Falta build_opt.h junto al .ino: con la librería Heltec instalada, OneWire no compila en ESP32-S3. Ver firmware/README.md"
#endif

class SensorTemperatura {
 public:
  static constexpr uint8_t kMaxSensores = 8;
  static constexpr uint8_t kReintentos = 3;

  enum class Estado : uint8_t {
    Ok,
    SinSensor,          // nadie respondió al pulso de reset (desconectado)
    BusEnCorto,         // la línea no sube: corto a GND o falta la resistencia de 4.7 kΩ
    ErrorCrc,           // datos corruptos tras todos los reintentos
    ValorDeArranque,    // 85 °C de fábrica: el sensor se reinició y no convirtió
    FueraDeRango,       // fuera de -55..125 °C, imposible para un DS18B20
    SinConversion,      // no se llamó a iniciarConversion()
    ConversionEnCurso,  // se pidió leer antes de que el sensor terminara
    PinInvalido,
  };

  struct Lectura {
    Estado estado = Estado::SinSensor;
    float celsius = NAN;
    uint8_t rom[8] = {0};
    bool ok() const { return estado == Estado::Ok; }
  };

  // Un pin sirve para OneWire si existe, puede ser salida y no está ocupado por
  // la flash, la PSRAM o el USB. En ESP32 y ESP32-S3 además tiene que ser <= 33:
  // OneWire 2.3.8 no pone como salida los pines superiores, y el bus queda mudo
  // sin dar ningún error. (En módulos S3 con PSRAM octal, 33 también está ocupado.)
  static constexpr bool pinValido(int pin) {
#if CONFIG_IDF_TARGET_ESP32S3
    return pin >= 0 && pin <= 33 && pin != 19 && pin != 20 && !(pin >= 22 && pin <= 32);
#elif CONFIG_IDF_TARGET_ESP32
    return pin >= 0 && pin <= 33 && !(pin >= 6 && pin <= 11) && pin != 20 && pin != 24 &&
           !(pin >= 28 && pin <= 31);
#else
    return pin >= 0 && pin < SOC_GPIO_PIN_COUNT;
#endif
  }

  explicit SensorTemperatura(uint8_t pin, uint8_t resolucionBits = 12);

  // Configura el bus y descubre los sensores. Devuelve cuántos encontró.
  uint8_t begin();

  uint8_t cantidad() const { return cantidad_; }
  bool alimentacionParasita() const { return parasita_; }
  // Por qué falló el último begin()/iniciarConversion(), u Ok.
  Estado estadoBus() const { return estadoBus_; }

  // Lanza la conversión en todos los sensores a la vez. No bloquea.
  bool iniciarConversion();
  bool conversionLista();

  // Lee el sensor `indice` (0..cantidad()-1) tras conversionLista().
  // Puede bloquear hasta ~750 ms solo si el sensor devuelve 85 °C, para
  // confirmar con una conversión nueva si es real o un reinicio del sensor.
  Lectura leer(uint8_t indice);

  // Atajo bloqueante: inicia, espera y lee el primer sensor.
  Lectura leerBloqueante();

  static const char* describir(Estado estado);

 private:
  enum class Conversion : uint8_t { Inactiva, EnCurso, Lista };

  uint8_t descubrir();
  bool lineaLibre();
  bool convertir(const uint8_t* rom);
  void esperarConversion(uint32_t inicio);
  Estado leerScratchpad(const uint8_t* rom, uint8_t* datos);
  Estado leerConReintentos(const uint8_t* rom, float* celsius);
  void configurarResolucion(const uint8_t* rom);
  float aCelsius(const uint8_t* rom, const uint8_t* datos) const;
  uint16_t tiempoConversionMs() const;

  const uint8_t pin_;
  const uint8_t resolucion_;
  OneWire bus_;
  uint8_t roms_[kMaxSensores][8];
  uint8_t cantidad_ = 0;
  bool parasita_ = false;
  bool pinOk_ = false;
  bool redescubrir_ = false;
  Estado estadoBus_ = Estado::SinSensor;
  Conversion conversion_ = Conversion::Inactiva;
  uint32_t inicioConversion_ = 0;
};
