import { InventoryItem, AuditLog, CompetitionPackItem, CLUB_TEAMS } from '../types';

// Deterministic generator to guarantee EXACTLY 279 items: 239 Available, 40 Checked Out
export function generateDefaultInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];

  const categoryConfigs: {
    category: InventoryItem['category'];
    prefix: string;
    total: number;
    checkedOutCount: number;
    names: string[];
    locations: string[];
    sampleNotes: string[];
  }[] = [
    {
      category: 'Motors',
      prefix: 'MOT',
      total: 100,
      checkedOutCount: 16,
      names: [
        'V5 Smart Motor (11W, 200 RPM)',
        'V5 Smart Motor (11W, 600 RPM High-Speed)',
        'V5 Smart Motor (11W, 100 RPM High-Torque)',
        'V5 Smart Motor (5.5W Low-Profile)',
      ],
      locations: ['Cabinet A - Bin 1', 'Cabinet A - Bin 2', 'Cabinet A - Bin 3', 'Cart 1 - Motor Rack'],
      sampleNotes: [
        'Blue cartridge installed - Drive base left',
        'Red cartridge - Lift mechanism',
        'Green cartridge - Flywheel intake',
        'Smooth bearings, tested on dyno',
        'Competition primary drive unit',
      ],
    },
    {
      category: 'Brain',
      prefix: 'BRN',
      total: 18,
      checkedOutCount: 4,
      names: [
        'V5 Robot Brain (v1.1.2)',
        'V5 Robot Brain (v1.1.0)',
      ],
      locations: ['Cabinet B - Electronics Bay', 'Secure Locker 1'],
      sampleNotes: [
        'Firmware v1.1.2 installed, ports 1-21 tested',
        'Screen protector applied, backup battery clips intact',
        'Assigned for official tournament chassis',
      ],
    },
    {
      category: 'Radio',
      prefix: 'RAD',
      total: 22,
      checkedOutCount: 4,
      names: [
        'V5 Robot Radio (VEXnet 3.0 / Bluetooth)',
      ],
      locations: ['Cabinet B - Shelf 2', 'Cart 2 - Radios'],
      sampleNotes: [
        'Smart cable connected, paired with Field Controller',
        'Field tested at practice scrimmage',
        'Antenna clip intact, low noise',
      ],
    },
    {
      category: 'Optical',
      prefix: 'OPT',
      total: 25,
      checkedOutCount: 3,
      names: [
        'V5 Optical Sensor (Color & Proximity)',
      ],
      locations: ['Cabinet C - Sensors Drawer 1', 'Sensor Kit Case A'],
      sampleNotes: [
        'Calibrated for Red/Blue alliance tribal triballs',
        'White balance calibrated, clean optic window',
        'Used for autonomous ring sorting',
      ],
    },
    {
      category: 'Distance',
      prefix: 'DST',
      total: 28,
      checkedOutCount: 4,
      names: [
        'V5 Distance Sensor (Laser Time-of-Flight)',
      ],
      locations: ['Cabinet C - Sensors Drawer 2', 'Sensor Kit Case B'],
      sampleNotes: [
        'Range 20mm-2000mm calibrated for goal alignment',
        'Laser eye protective bezel attached',
        'Autonomous wall alignment sensor',
      ],
    },
    {
      category: 'Inertial',
      prefix: 'INR',
      total: 24,
      checkedOutCount: 3,
      names: [
        'V5 Inertial Sensor (3-Axis Gyro & Accel)',
      ],
      locations: ['Cabinet C - Sensors Drawer 3', 'Sensor Kit Case C'],
      sampleNotes: [
        'Low gyro drift < 1 deg/min tested',
        'Shock isolation mount included',
        'Essential for odometry & turn tracking',
      ],
    },
    {
      category: 'Rotational',
      prefix: 'ROT',
      total: 32,
      checkedOutCount: 3,
      names: [
        'V5 Rotation Sensor (Absolute & Relative 0.088°)',
      ],
      locations: ['Cabinet C - Sensors Drawer 4', 'Odometry Kit Box'],
      sampleNotes: [
        'Mounted on unpowered tracking wheel pod',
        'High precision dead-wheel tracking',
        '0.088° resolution, verified zero backlash',
      ],
    },
    {
      category: 'Solenoids',
      prefix: 'SOL',
      total: 30,
      checkedOutCount: 3,
      names: [
        'V5 Pneumatics Double Solenoid Driver',
        'V5 Pneumatics Single Solenoid Driver',
        'SMC Pneumatics Cylinder 50mm Stroke',
      ],
      locations: ['Cabinet D - Pneumatics Bin 1', 'Cabinet D - Pneumatics Bin 2'],
      sampleNotes: [
        'Fittings sealed with Teflon tape, 100 PSI tested',
        'Dual acting cylinder for endgame expander',
        'Quick exhaust valve fitted, zero leakage',
      ],
    },
  ];

  const teams = [...CLUB_TEAMS];
  let teamCheckoutCounter = 0;

  for (const config of categoryConfigs) {
    for (let i = 1; i <= config.total; i++) {
      const isCheckedOut = i <= config.checkedOutCount;
      const assignedTeam = isCheckedOut ? teams[teamCheckoutCounter % teams.length] : '';
      if (isCheckedOut) teamCheckoutCounter++;

      const idNumber = String(i).padStart(3, '0');
      const itemId = `${config.prefix}-${idNumber}`;
      const itemName = config.names[(i - 1) % config.names.length];
      const location = config.locations[(i - 1) % config.locations.length];

      // Realistic checkout dates from 1 to 12 days ago
      const daysAgo = (i % 12) + 1;
      const checkoutDate = isCheckedOut
        ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : '';

      const notes = isCheckedOut
        ? config.sampleNotes[i % config.sampleNotes.length]
        : 'In storage, verified good condition';

      items.push({
        itemId,
        itemName,
        category: config.category,
        status: isCheckedOut ? 'Checked Out' : 'Available',
        currentUser: assignedTeam,
        dateOut: checkoutDate,
        notes,
        timesCheckedOut: isCheckedOut ? (i % 5) + 1 : i % 4,
        location,
      });
    }
  }

  return items;
}

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    itemId: 'MOT-014',
    itemName: 'V5 Smart Motor (11W, 600 RPM High-Speed)',
    action: 'Check Out',
    team: '654V',
    notes: 'Flywheel dual-motor test for autonomous tuning',
    userEmail: 'yln2k20trishanth@gmail.com',
    category: 'Motors',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    itemId: 'INR-002',
    itemName: 'V5 Inertial Sensor (3-Axis Gyro & Accel)',
    action: 'Check Out',
    team: '654T',
    notes: 'Mounted to center chassis for IMU yaw calibration',
    userEmail: 'team654t@vexrobotics.org',
    category: 'Inertial',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    itemId: 'BRN-001',
    itemName: 'V5 Robot Brain (v1.1.2)',
    action: 'Check Out',
    team: '654B',
    notes: 'Primary competition brain for robot rebuild',
    userEmail: 'team654b@vexrobotics.org',
    category: 'Brain',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    itemId: 'SOL-003',
    itemName: 'V5 Pneumatics Double Solenoid Driver',
    action: 'Check In',
    team: '654V',
    notes: 'Returned after clamp test, all fittings intact',
    userEmail: 'yln2k20trishanth@gmail.com',
    category: 'Solenoids',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 500 * 60 * 1000).toISOString(),
    itemId: 'ROT-001',
    itemName: 'V5 Rotation Sensor (Absolute & Relative 0.088°)',
    action: 'Check Out',
    team: '654V',
    notes: 'Installed on left tracking wheel pod',
    userEmail: 'yln2k20trishanth@gmail.com',
    category: 'Rotational',
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 840 * 60 * 1000).toISOString(),
    itemId: 'DST-004',
    itemName: 'V5 Distance Sensor (Laser Time-of-Flight)',
    action: 'Check Out',
    team: '654T',
    notes: 'Goal detection sensor for skills routine',
    userEmail: 'team654t@vexrobotics.org',
    category: 'Distance',
  },
  {
    id: 'log-7',
    timestamp: new Date(Date.now() - 1440 * 60 * 1000).toISOString(),
    itemId: 'RAD-002',
    itemName: 'V5 Robot Radio (VEXnet 3.0 / Bluetooth)',
    action: 'Check In',
    team: '654B',
    notes: 'Returned to Cabinet B after scrimmage',
    userEmail: 'team654b@vexrobotics.org',
    category: 'Radio',
  },
];

export const INITIAL_PACK_LIST: CompetitionPackItem[] = [
  {
    id: 'pack-1',
    category: 'Motors',
    name: 'V5 Smart Motors (11W & 5.5W)',
    targetCount: 16,
    packedCount: 12,
    isPacked: false,
    priority: 'Critical',
    description: '8 on robot, 4 pre-geared spares (600 RPM blue), 4 torque spares (200 RPM green)',
  },
  {
    id: 'pack-2',
    category: 'Brain',
    name: 'V5 Robot Brain with Screen Shield',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Critical',
    description: '1 primary on robot, 1 flashing backup loaded with competition code slots',
  },
  {
    id: 'pack-3',
    category: 'Radio',
    name: 'V5 Robot Radio + Smart Cables',
    targetCount: 3,
    packedCount: 3,
    isPacked: true,
    priority: 'Critical',
    description: '1 mounted on radio tower, 2 spares in pit bag with varying cable lengths',
  },
  {
    id: 'pack-4',
    category: 'Inertial',
    name: 'V5 Inertial Sensor with Isolation Pod',
    targetCount: 2,
    packedCount: 1,
    isPacked: false,
    priority: 'Critical',
    description: '1 calibrated on chassis center of mass, 1 backup pre-tested for autonomous',
  },
  {
    id: 'pack-5',
    category: 'Rotational',
    name: 'V5 Rotation Sensors (Odometry)',
    targetCount: 3,
    packedCount: 3,
    isPacked: true,
    priority: 'Standard',
    description: 'Parallel and perpendicular tracking wheel odometry encoders',
  },
  {
    id: 'pack-6',
    category: 'Optical',
    name: 'V5 Optical Sensors',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Standard',
    description: 'Alliance colored ring/triball optical sensor + pit spare',
  },
  {
    id: 'pack-7',
    category: 'Distance',
    name: 'V5 Distance Sensors (Laser ToF)',
    targetCount: 2,
    packedCount: 1,
    isPacked: false,
    priority: 'Standard',
    description: 'Front and rear field perimeter distance alignment',
  },
  {
    id: 'pack-8',
    category: 'Solenoids',
    name: 'Pneumatics Solenoid Drivers & Tanks',
    targetCount: 4,
    packedCount: 4,
    isPacked: true,
    priority: 'Critical',
    description: 'Dual solenoid drivers, pneumatic air reservoir, regulator, and hand pump',
  },
];
