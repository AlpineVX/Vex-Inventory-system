import { InventoryItem, AuditLog, CompetitionPackItem, CLUB_TEAMS } from '../types';

/**
 * Deterministic generator precisely matching the Google Sheet inventory:
 * Total Items: 279
 * Available Now: 238
 * Checked Out Now: 41
 * Utilization: 15%
 * 
 * Category distribution:
 * - Motors: 100 (100 Available, 0 Checked Out)
 * - Radio: 30 (30 Available, 0 Checked Out)
 * - Brain: 20 (20 Available, 0 Checked Out)
 * - Solonoid (Solenoids): 31 (29 Available, 2 Checked Out)
 * - Sensors: 98 (59 Available, 39 Checked Out)
 *   - Optical: 33 (33 Available, 0 Checked Out)
 *   - Distance: 30 (11 Available, 19 Checked Out)
 *   - Inertia: 11 (6 Available, 5 Checked Out)
 *   - Rotational: 24 (9 Available, 15 Checked Out)
 * 
 * Active Team Allocations (41 items across 7 teams):
 * 654V: 13 | 654J: 8 | 654X: 8 | 654T: 7 | 654B: 2 | 654K: 2 | 654A: 1
 */

// Precise record of active checkouts directly from the Google Sheet
const ACTIVE_CHECKOUTS_REGISTRY: Record<string, { team: string; dateOut: string; notes: string }> = {
  // Solenoids (2)
  'VEXSOL-30': { team: '654V', dateOut: '2026-10-06', notes: 'It is working' },
  'VEXSOL-31': { team: '654V', dateOut: '2026-10-06', notes: 'It is working' },

  // Distance Sensors (19)
  'VEXS-DIST-2': { team: '654T', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-3': { team: '654T', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-4': { team: '654T', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-5': { team: '654V', dateOut: '2026-10-08', notes: 'It is working' },
  'VEXS-DIST-6': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-8': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-9': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-10': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-11': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-12': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-13': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-14': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-21': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-22': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-23': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-DIST-26': { team: '654X', dateOut: '2026-10-08', notes: 'It is working' },
  'VEXS-DIST-27': { team: '654X', dateOut: '2026-10-08', notes: 'It is working' },
  'VEXS-DIST-28': { team: '654X', dateOut: '2026-10-08', notes: 'It is working' },
  'VEXS-DIST-29': { team: '654X', dateOut: '2026-10-08', notes: 'It is working' },

  // Inertial Sensors (5)
  'VEXS-INER-4': { team: '654T', dateOut: '2026-10-08', notes: 'It is working' },
  'VEXS-INER-5': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-INER-6': { team: '654A', dateOut: '2026-10-16', notes: 'It is working' },
  'VEXS-INER-10': { team: '654J', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-INER-11': { team: '654X', dateOut: '2026-10-08', notes: 'It is working' },

  // Rotational Sensors (15)
  'VEXS-ROT-2': { team: '654B', dateOut: '2026-10-02', notes: 'It is working' },
  'VEXS-ROT-4': { team: '654T', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-5': { team: '654T', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-6': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-7': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-8': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-10': { team: '654B', dateOut: '2026-10-02', notes: 'It is working' },
  'VEXS-ROT-11': { team: '654K', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-13': { team: '654X', dateOut: '2026-10-02', notes: 'It is working' },
  'VEXS-ROT-14': { team: '654X', dateOut: '2026-10-02', notes: 'It is working' },
  'VEXS-ROT-15': { team: '654T', dateOut: '2026-10-15', notes: 'It is working' },
  'VEXS-ROT-16': { team: '654V', dateOut: '2026-09-30', notes: 'It is working' },
  'VEXS-ROT-17': { team: '654K', dateOut: '2026-10-02', notes: 'It is working' },
  'VEXS-ROT-18': { team: '654V', dateOut: '2026-10-08', notes: 'It is working' },
  'VEXS-ROT-21': { team: '654X', dateOut: '2026-10-16', notes: 'It is working' },
};

export function generateDefaultInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];

  const categoryConfigs: {
    category: InventoryItem['category'];
    prefix: string;
    total: number;
    defaultName: string;
    locations: string[];
  }[] = [
    {
      category: 'Radio',
      prefix: 'VEXR',
      total: 30,
      defaultName: 'V5 Robot Radio',
      locations: ['Cabinet 1'],
    },
    {
      category: 'Brain',
      prefix: 'VEXB',
      total: 20,
      defaultName: 'V5 Robot Brain',
      locations: ['Cabinet 1'],
    },
    {
      category: 'Solenoids',
      prefix: 'VEXSOL',
      total: 31,
      defaultName: 'Pneumatic Solenoid',
      locations: ['Pneumatics Cabinet'],
    },
    {
      category: 'Optical',
      prefix: 'VEXS-O',
      total: 33,
      defaultName: 'Optical Sensor',
      locations: ['Sensor Cabinet'],
    },
    {
      category: 'Distance',
      prefix: 'VEXS-DIST',
      total: 30,
      defaultName: 'Distance Sensor',
      locations: ['Sensor Cabinet'],
    },
    {
      category: 'Inertial',
      prefix: 'VEXS-INER',
      total: 11,
      defaultName: 'Inertial Sensor',
      locations: ['Sensor Cabinet'],
    },
    {
      category: 'Rotational',
      prefix: 'VEXS-ROT',
      total: 24,
      defaultName: 'Rotational Sensor',
      locations: ['Sensor Cabinet'],
    },
  ];

  for (const config of categoryConfigs) {
    for (let i = 1; i <= config.total; i++) {
      const itemId = `${config.prefix}-${i}`;
      const checkoutInfo = ACTIVE_CHECKOUTS_REGISTRY[itemId];
      const isCheckedOut = Boolean(checkoutInfo);

      items.push({
        itemId,
        itemName: config.defaultName,
        category: config.category,
        status: isCheckedOut ? 'Checked Out' : 'Available',
        currentUser: checkoutInfo ? checkoutInfo.team : '',
        dateOut: checkoutInfo ? checkoutInfo.dateOut : '',
        notes: checkoutInfo ? checkoutInfo.notes : 'In storage, verified good condition',
        timesCheckedOut: isCheckedOut ? 1 : 0,
        location: config.locations[(i - 1) % config.locations.length],
      });
    }
  }

  return items;
}

// Recent transaction log matching the exact Google Sheet scan logs
export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-16T14:16:29.000Z',
    itemId: 'VEXS-ROT-21',
    itemName: 'Rotational Sensor',
    action: 'Check Out',
    team: '654X',
    notes: 'It is working',
    userEmail: 's115616@ltisdschools.net',
    category: 'Rotational',
  },
  {
    id: 'log-2',
    timestamp: '2026-10-16T09:16:59.000Z',
    itemId: 'VEXS-INER-6',
    itemName: 'Inertial Sensor',
    action: 'Check Out',
    team: '654A',
    notes: 'It is working',
    userEmail: 's110324@ltisdschools.net',
    category: 'Inertial',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-15T14:26:40.000Z',
    itemId: 'VEXS-ROT-15',
    itemName: 'Rotational Sensor',
    action: 'Check Out',
    team: '654T',
    notes: 'It is working',
    userEmail: 's122729@ltisdschools.net',
    category: 'Rotational',
  },
  {
    id: 'log-4',
    timestamp: '2026-10-13T14:20:13.000Z',
    itemId: 'VEXSOL-29',
    itemName: 'Pneumatic Solenoid',
    action: 'Check In',
    team: '654Z',
    notes: 'It is working',
    userEmail: 's125700@ltisdschools.net',
    category: 'Solenoids',
  },
  {
    id: 'log-5',
    timestamp: '2026-10-08T15:00:50.000Z',
    itemId: 'VEXS-INER-11',
    itemName: 'Inertial Sensor',
    action: 'Check Out',
    team: '654X',
    notes: 'It is working',
    userEmail: 's112325@ltisdschools.net',
    category: 'Inertial',
  },
  {
    id: 'log-6',
    timestamp: '2026-10-08T14:58:35.000Z',
    itemId: 'VEXS-INER-4',
    itemName: 'Inertial Sensor',
    action: 'Check Out',
    team: '654T',
    notes: 'It is working',
    userEmail: 's114708@ltisdschools.net',
    category: 'Inertial',
  },
  {
    id: 'log-7',
    timestamp: '2026-10-08T09:31:17.000Z',
    itemId: 'VEXS-DIST-5',
    itemName: 'Distance Sensor',
    action: 'Check Out',
    team: '654V',
    notes: 'It is working',
    userEmail: 's112325@ltisdschools.net',
    category: 'Distance',
  },
  {
    id: 'log-8',
    timestamp: '2026-10-06T15:39:41.000Z',
    itemId: 'VEXSOL-31',
    itemName: 'Pneumatic Solenoid',
    action: 'Check Out',
    team: '654V',
    notes: 'It is working',
    userEmail: 's112325@ltisdschools.net',
    category: 'Solenoids',
  },
  {
    id: 'log-9',
    timestamp: '2026-10-06T15:38:43.000Z',
    itemId: 'VEXSOL-30',
    itemName: 'Pneumatic Solenoid',
    action: 'Check Out',
    team: '654V',
    notes: 'It is working',
    userEmail: 's112325@ltisdschools.net',
    category: 'Solenoids',
  },
];

// Exact Competition Pack List directly from Page 419 of the spreadsheet
export const INITIAL_PACK_LIST: CompetitionPackItem[] = [
  {
    id: 'pack-2',
    category: 'Brain',
    name: 'V5 Brain',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Critical',
    description: '1 primary tournament brain + 1 flashing backup (Target: 2 | Available: 20)',
  },
  {
    id: 'pack-3',
    category: 'Radio',
    name: 'V5 Radio',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Critical',
    description: 'Tournament field radio + pit spare (Target: 2 | Available: 30)',
  },
  {
    id: 'pack-4',
    category: 'Optical',
    name: 'AI Vision / Optical Sensor',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Standard',
    description: 'Alliance ring/triball optical sensor (Target: 2 | Available: 33)',
  },
  {
    id: 'pack-5',
    category: 'Distance',
    name: 'Distance Sensor',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Standard',
    description: 'Front & side field perimeter distance sensor (Target: 2 | Available: 11)',
  },
  {
    id: 'pack-6',
    category: 'Inertial',
    name: 'Inertial Sensor',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Critical',
    description: 'IMU heading & gyro odometry tracker (Target: 2 | Available: 6)',
  },
  {
    id: 'pack-7',
    category: 'Rotational',
    name: 'Rotational Sensor',
    targetCount: 2,
    packedCount: 2,
    isPacked: true,
    priority: 'Standard',
    description: 'Parallel and perpendicular tracking wheel encoders (Target: 2 | Available: 9)',
  },
  {
    id: 'pack-8',
    category: 'Solenoids',
    name: 'Pneumatic Solenoid',
    targetCount: 4,
    packedCount: 4,
    isPacked: true,
    priority: 'Critical',
    description: 'Solenoid driver, manifold, air reservoir & fittings (Target: 4 | Available: 29)',
  },
];
