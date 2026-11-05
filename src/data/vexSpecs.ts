import { VexCategory } from '../types';

export interface VexHardwareSpec {
  officialPartNumber: string;
  category: VexCategory;
  interfaceProtocol: string;
  operatingRange: string;
  weightGrams: number;
  firmwareTarget?: string;
  keySpecs: string[];
  gameManualRule: string;
}

export const VEX_HARDWARE_SPECS: Record<string, VexHardwareSpec> = {
  Brain: {
    officialPartNumber: '276-4810',
    category: 'Brain',
    interfaceProtocol: 'Dual Cortex-A9 @ 667 MHz / VEXos',
    operatingRange: '7.2V - 12.8V Li-ion Smart Battery',
    weightGrams: 288,
    firmwareTarget: 'v1.1.2+',
    keySpecs: [
      '21 Smart Ports with RS-485 transceiver (100k baud)',
      '4.25" Full Color Capacitive Touch Screen (480x272)',
      '8 3-Wire legacy analog/digital expansion ports',
      'Unified diagnostics, logging & user program engine',
    ],
    gameManualRule: '<R11> Maximum 1 V5 Robot Brain permitted per competition robot',
  },
  Radio: {
    officialPartNumber: '276-4831',
    category: 'Radio',
    interfaceProtocol: '2.4 GHz Direct-Sequence Spread Spectrum (DSSS)',
    operatingRange: 'Bluetooth 4.2 / VEXnet 3.0 Field Link',
    weightGrams: 32,
    firmwareTarget: 'VEXnet 3.0',
    keySpecs: [
      'Bidirectional telemetry to V5 Controller & Tournament Field',
      'Dynamic frequency hopping across 16 RF channels',
      'Ultra-low packet loss (<0.01% in full field RF saturation)',
      'Tri-color diagnostic LED indicator',
    ],
    gameManualRule: '<R11> Must be mounted outside metal structure for optimal signal line of sight',
  },
  Optical: {
    officialPartNumber: '276-4833',
    category: 'Optical',
    interfaceProtocol: 'V5 Smart Port (RS-485 bidirectional)',
    operatingRange: '10 mm to 100 mm proximity detection',
    weightGrams: 22,
    keySpecs: [
      'Integrated ambient lux sensor & RGBC color classification',
      'White LED illuminator with adjustable PWM brightness (0-100%)',
      'High-speed gesture tracking (up/down/left/right vectors)',
      '100 Hz internal sensor sample update rate',
    ],
    gameManualRule: '<R13> Official legal V5 Smart Port sensor',
  },
  Distance: {
    officialPartNumber: '276-4834',
    category: 'Distance',
    interfaceProtocol: 'V5 Smart Port (Class 1 Eye-Safe Laser ToF)',
    operatingRange: '20 mm to 2,000 mm (2 meters)',
    weightGrams: 28,
    keySpecs: [
      'VCSEL 940nm Time-of-Flight laser rangefinder',
      'Millimeter distance resolution with target size estimation',
      'Object approach velocity tracking & acceleration readout',
      '20 Hz to 50 Hz programmable telemetry polling',
    ],
    gameManualRule: '<R13> Class 1 eye-safe laser under IEC 60825-1',
  },
  Inertial: {
    officialPartNumber: '276-4840',
    category: 'Inertial',
    interfaceProtocol: 'V5 Smart Port (20-bit internal rate gyro)',
    operatingRange: '±2,000 deg/sec 3-Axis Gyro & ±8G Accelerometer',
    weightGrams: 24,
    keySpecs: [
      'Full 6-DOF internal measurement unit (IMU)',
      'Real-time heading, roll, pitch & yaw drift correction',
      'Onboard Kalman filter for vibration noise rejection',
      'Millisecond heading integration for autonomous precision',
    ],
    gameManualRule: '<R13> Must be securely mounted flat on rigid chassis crossbar',
  },
  Rotational: {
    officialPartNumber: '276-6010',
    category: 'Rotational',
    interfaceProtocol: 'V5 Smart Port (High-resolution magnetic encoder)',
    operatingRange: 'Continuous 360° rotation up to 1,000 RPM',
    weightGrams: 30,
    keySpecs: [
      'Contactless absolute & relative position sensing',
      '0.088° measurement resolution (4,096 ticks per revolution)',
      'Zero gear backlash direct shaft tracking',
      'Velocity and direction of rotation readout',
    ],
    gameManualRule: '<R13> Ideal for non-driven unpowered dead-wheel tracking pods',
  },
  Solenoids: {
    officialPartNumber: '276-8140',
    category: 'Solenoids',
    interfaceProtocol: 'V5 3-Wire port or PCM driver / 5V DC solenoid',
    operatingRange: '0 - 100 PSI (0 - 690 kPa) clean compressed air',
    weightGrams: 52,
    keySpecs: [
      'SMC double-acting / single-acting 5/2 pneumatic valve',
      'Fast 12ms valve shift response time',
      'M5 threaded ports with 4mm push-to-connect air fittings',
      'Spring return / detented pneumatic cylinder actuation',
    ],
    gameManualRule: '<R12> Pneumatics system cannot exceed 100 PSI working pressure (max 2 air tanks)',
  },
  Sensors: {
    officialPartNumber: 'V5-SEN-GEN',
    category: 'Sensors',
    interfaceProtocol: 'V5 Smart Port / 3-Wire Legacy',
    operatingRange: '0 - 3.3V / RS-485',
    weightGrams: 26,
    keySpecs: [
      'Compatible with V5 autonomous navigation stack',
      'High noise-immunity shielded communication harness',
      'Real-time telemetry streaming into VEXcode Pro / PROS C++',
    ],
    gameManualRule: '<R13> V5 Smart Port or legal 3-Wire sensor',
  },
};

export function getVexHardwareSpec(category: string): VexHardwareSpec {
  return VEX_HARDWARE_SPECS[category] || VEX_HARDWARE_SPECS.Sensors;
}
