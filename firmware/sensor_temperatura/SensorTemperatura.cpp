#include "SensorTemperatura.h"

namespace {

constexpr uint8_t kConvertirT = 0x44;
constexpr uint8_t kLeerScratchpad = 0xBE;
constexpr uint8_t kEscribirScratchpad = 0x4E;
constexpr uint8_t kLeerAlimentacion = 0xB4;

constexpr uint8_t kFamiliaDS18S20 = 0x10;
constexpr uint8_t kFamiliaDS1822 = 0x22;
constexpr uint8_t kFamiliaDS18B20 = 0x28;

// 750 ms es el peor caso a 12 bits según la hoja de datos; el margen cubre
// sensores lentos o que volvieron a 12 bits tras un reinicio.
constexpr uint32_t kMaxConversionMs = 800;

bool esTermometro(uint8_t familia) {
  return familia == kFamiliaDS18B20 || familia == kFamiliaDS1822 || familia == kFamiliaDS18S20;
}

}  // namespace

SensorTemperatura::SensorTemperatura(uint8_t pin, uint8_t resolucionBits)
    : pin_(pin), resolucion_(constrain(resolucionBits, 9, 12)) {}

uint8_t SensorTemperatura::begin() {
  conversion_ = Conversion::Inactiva;
  cantidad_ = 0;
  pinOk_ = pinValido(pin_);
  if (!pinOk_) {
    estadoBus_ = Estado::PinInvalido;
    return 0;
  }
  bus_.begin(pin_);
  return descubrir();
}

bool SensorTemperatura::lineaLibre() {
  // En reposo la resistencia de pull-up mantiene la línea en alto. Si está en
  // bajo, hay un corto a GND o falta la resistencia de 4.7 kΩ.
  return digitalRead(pin_) == HIGH;
}

uint8_t SensorTemperatura::descubrir() {
  cantidad_ = 0;
  parasita_ = false;
  redescubrir_ = false;
  if (!lineaLibre()) {
    estadoBus_ = Estado::BusEnCorto;
    return 0;
  }

  uint8_t rom[8];
  bus_.reset_search();
  while (cantidad_ < kMaxSensores && bus_.search(rom)) {
    // Una ROM de puros ceros pasa el CRC: es la línea pegada a GND, no un sensor.
    if (rom[0] == 0 || OneWire::crc8(rom, 7) != rom[7]) continue;
    if (!esTermometro(rom[0])) continue;
    memcpy(roms_[cantidad_++], rom, sizeof(rom));
  }
  if (cantidad_ == 0) {
    estadoBus_ = Estado::SinSensor;
    return 0;
  }

  // Con alimentación parásita el sensor responde 0 a "leer alimentación".
  if (bus_.reset()) {
    bus_.skip();
    bus_.write(kLeerAlimentacion);
    parasita_ = bus_.read_bit() == 0;
  }
  for (uint8_t i = 0; i < cantidad_; i++) configurarResolucion(roms_[i]);

  estadoBus_ = Estado::Ok;
  return cantidad_;
}

void SensorTemperatura::configurarResolucion(const uint8_t* rom) {
  if (rom[0] == kFamiliaDS18S20) return;  // resolución fija de 9 bits

  uint8_t datos[9];
  if (leerScratchpad(rom, datos) != Estado::Ok) return;
  const uint8_t config = ((resolucion_ - 9) << 5) | 0x1F;
  if (datos[4] == config) return;

  // Solo se escribe el scratchpad (RAM), no la EEPROM: no se desgasta, a cambio
  // de que un reinicio del sensor vuelva a 12 bits. conversionLista() lo tolera.
  if (!bus_.reset()) return;
  bus_.select(rom);
  bus_.write(kEscribirScratchpad);
  bus_.write(datos[2]);  // TH: se conserva la alarma que tuviera
  bus_.write(datos[3]);  // TL
  bus_.write(config);
}

uint16_t SensorTemperatura::tiempoConversionMs() const {
  for (uint8_t i = 0; i < cantidad_; i++) {
    if (roms_[i][0] == kFamiliaDS18S20) return 750;
  }
  static constexpr uint16_t kPorResolucion[] = {94, 188, 375, 750};
  return kPorResolucion[resolucion_ - 9];
}

bool SensorTemperatura::convertir(const uint8_t* rom) {
  if (!bus_.reset()) return false;
  if (rom) {
    bus_.select(rom);
  } else {
    bus_.skip();
  }
  // Con alimentación parásita el bus debe quedar en alto mientras convierte.
  bus_.write(kConvertirT, parasita_ ? 1 : 0);
  return true;
}

bool SensorTemperatura::iniciarConversion() {
  if (!pinOk_) {
    estadoBus_ = Estado::PinInvalido;
    return false;
  }
  if (conversion_ == Conversion::EnCurso) return true;  // ya hay una en marcha
  // Si este intento falla, leer() no debe devolver la conversión anterior como nueva.
  conversion_ = Conversion::Inactiva;

  // Sin sensores, o alguno dejó de contestar en la vuelta anterior: se vuelve a
  // buscar, así se recupera solo si se conecta tarde o se cambia un sensor.
  if ((cantidad_ == 0 || redescubrir_) && descubrir() == 0) return false;
  if (!lineaLibre()) {
    estadoBus_ = Estado::BusEnCorto;
    return false;
  }
  if (!convertir(nullptr)) {
    estadoBus_ = Estado::SinSensor;
    redescubrir_ = true;
    return false;
  }
  estadoBus_ = Estado::Ok;
  conversion_ = Conversion::EnCurso;
  inicioConversion_ = millis();
  return true;
}

bool SensorTemperatura::conversionLista() {
  if (conversion_ != Conversion::EnCurso) return conversion_ == Conversion::Lista;

  const uint32_t transcurrido = millis() - inicioConversion_;
  bool lista;
  if (parasita_) {
    // El bus está sostenido en alto: no se puede preguntar, solo esperar.
    lista = transcurrido >= tiempoConversionMs() + tiempoConversionMs() / 10;
  } else {
    // El sensor contesta 0 mientras convierte y 1 al terminar.
    lista = transcurrido >= kMaxConversionMs || bus_.read_bit() == 1;
  }
  if (lista) {
    if (parasita_) bus_.depower();
    conversion_ = Conversion::Lista;
  }
  return lista;
}

void SensorTemperatura::esperarConversion(uint32_t inicio) {
  while (millis() - inicio < kMaxConversionMs) {
    if (!parasita_ && bus_.read_bit() == 1) break;
    delay(parasita_ ? 10 : 2);
  }
  if (parasita_) bus_.depower();
}

SensorTemperatura::Estado SensorTemperatura::leerScratchpad(const uint8_t* rom, uint8_t* datos) {
  if (!bus_.reset()) return lineaLibre() ? Estado::SinSensor : Estado::BusEnCorto;
  bus_.select(rom);
  bus_.write(kLeerScratchpad);

  bool todoCeros = true;
  bool todoUnos = true;
  for (uint8_t i = 0; i < 9; i++) {
    datos[i] = bus_.read();
    todoCeros &= datos[i] == 0x00;
    todoUnos &= datos[i] == 0xFF;
  }
  if (todoUnos) return Estado::SinSensor;  // ese sensor no contestó
  // Nueve ceros pasan el CRC, así que se descartan aparte.
  if (todoCeros || OneWire::crc8(datos, 8) != datos[8]) return Estado::ErrorCrc;
  return Estado::Ok;
}

SensorTemperatura::Estado SensorTemperatura::leerConReintentos(const uint8_t* rom, float* celsius) {
  uint8_t datos[9];
  Estado estado = Estado::SinSensor;
  for (uint8_t intento = 0; intento < kReintentos; intento++) {
    estado = leerScratchpad(rom, datos);
    if (estado == Estado::Ok) break;
    delay(1);
  }
  if (estado != Estado::Ok) {
    if (estado == Estado::SinSensor || estado == Estado::BusEnCorto) redescubrir_ = true;
    return estado;
  }

  *celsius = aCelsius(rom, datos);
  if (*celsius == 85.0f) return Estado::ValorDeArranque;
  if (*celsius < -55.0f || *celsius > 125.0f) return Estado::FueraDeRango;
  return Estado::Ok;
}

float SensorTemperatura::aCelsius(const uint8_t* rom, const uint8_t* datos) const {
  int16_t crudo = (int16_t)((datos[1] << 8) | datos[0]);
  if (rom[0] == kFamiliaDS18S20) {
    // 9 bits; COUNT_REMAIN (byte 6) da la resolución extendida.
    crudo = (int16_t)(crudo << 3);
    if (datos[7] == 0x10) crudo = (int16_t)((crudo & 0xFFF0) + 12 - datos[6]);
  } else {
    // A menor resolución los bits bajos no están definidos.
    switch (datos[4] & 0x60) {
      case 0x00: crudo &= ~7; break;  // 9 bits
      case 0x20: crudo &= ~3; break;  // 10 bits
      case 0x40: crudo &= ~1; break;  // 11 bits
      default: break;                 // 12 bits
    }
  }
  return crudo / 16.0f;
}

SensorTemperatura::Lectura SensorTemperatura::leer(uint8_t indice) {
  Lectura lectura;
  if (!pinOk_) {
    lectura.estado = Estado::PinInvalido;
    return lectura;
  }
  if (indice >= cantidad_) {
    lectura.estado = estadoBus_ == Estado::Ok ? Estado::SinSensor : estadoBus_;
    return lectura;
  }
  memcpy(lectura.rom, roms_[indice], sizeof(lectura.rom));
  if (conversion_ == Conversion::Inactiva) {
    lectura.estado = Estado::SinConversion;
    return lectura;
  }
  if (!conversionLista()) {
    lectura.estado = Estado::ConversionEnCurso;
    return lectura;
  }

  lectura.estado = leerConReintentos(lectura.rom, &lectura.celsius);
  // 85 °C es lo que trae el sensor al encender; también puede ser real (un
  // conector que se está calentando). Una conversión nueva lo decide: si vuelve
  // a dar 85 °C, es la temperatura de verdad y no se debe esconder.
  if (lectura.estado == Estado::ValorDeArranque && convertir(lectura.rom)) {
    esperarConversion(millis());
    lectura.estado = leerConReintentos(lectura.rom, &lectura.celsius);
    if (lectura.estado == Estado::ValorDeArranque) lectura.estado = Estado::Ok;
  }
  return lectura;
}

SensorTemperatura::Lectura SensorTemperatura::leerBloqueante() {
  if (!iniciarConversion()) {
    Lectura lectura;
    lectura.estado = estadoBus_;
    return lectura;
  }
  while (!conversionLista()) delay(5);
  return leer(0);
}

const char* SensorTemperatura::describir(Estado estado) {
  switch (estado) {
    case Estado::Ok: return "ok";
    case Estado::SinSensor: return "sin sensor (desconectado)";
    case Estado::BusEnCorto: return "bus en corto o sin resistencia de 4.7k";
    case Estado::ErrorCrc: return "datos corruptos (CRC): revisar cable y pull-up";
    case Estado::ValorDeArranque: return "85 C de arranque: el sensor se reinicio";
    case Estado::FueraDeRango: return "lectura fuera de rango";
    case Estado::SinConversion: return "no se inicio la conversion";
    case Estado::ConversionEnCurso: return "conversion en curso";
    case Estado::PinInvalido: return "pin no apto para OneWire";
  }
  return "desconocido";
}
