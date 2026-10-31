export type VexCategory =
  | 'Brain'
  | 'Radio'
  | 'Sensors'
  | 'Optical'
  | 'Distance'
  | 'Inertial'
  | 'Rotational'
  | 'Solenoids';

export const CLUB_TEAMS = [
  '654K',
  '654J',
  '654A',
  '654B',
  '654G',
  '654T',
  '654V',
  '654Y',
  '654X',
  '654Z',
  'RECF',
] as const;

export type ClubTeam = (typeof CLUB_TEAMS)[number];

export const SENSOR_CATEGORIES: VexCategory[] = ['Optical', 'Distance', 'Inertial', 'Rotational'];

export const CATEGORY_PREFIX_MAP: Record<VexCategory, string> = {
  Brain: 'VEXB',
  Radio: 'VEXR',
  Sensors: 'VEXS',
  Optical: 'VEXS-O',
  Distance: 'VEXS-DIST',
  Inertial: 'VEXS-INER',
  Rotational: 'VEXS-ROT',
  Solenoids: 'VEXSOL',
};

export function normalizeItemId(rawId: string, categoryHint?: VexCategory | string): string {
  if (!rawId) return '';
  let s = String(rawId).trim().toUpperCase().replace(/\s+/g, '');
  // Strip leading symbols (e.g. #, quotes)
  s = s.replace(/^[#"'`]+/, '');

  // 1. Collapse accidental double prefixes (e.g. VEXS-DIST-DIST-4, VEXSOL-SOL-1)
  s = s.replace(/^VEXS?-DIST-DIST-/i, 'VEXS-DIST-');
  s = s.replace(/^VEXS?-ROT-ROT-/i, 'VEXS-ROT-');
  s = s.replace(/^VEXS?-INER-INER-/i, 'VEXS-INER-');
  s = s.replace(/^VEXS?-O-O-/i, 'VEXS-O-');
  s = s.replace(/^VEXSOL-SOL-/i, 'VEXSOL-');
  s = s.replace(/^VEXB-B-/i, 'VEXB-');
  s = s.replace(/^VEXR-R-/i, 'VEXR-');
  s = s.replace(/^VEXM-M-/i, 'VEXM-');

  // 2. Standardize VEX- prefixed variations
  s = s.replace(/^VEX-O-/i, 'VEXS-O-');
  s = s.replace(/^VEX-DIST-/i, 'VEXS-DIST-');
  s = s.replace(/^VEX-ROT-/i, 'VEXS-ROT-');
  s = s.replace(/^VEX-INER-/i, 'VEXS-INER-');
  s = s.replace(/^VEX-SOL-/i, 'VEXSOL-');
  s = s.replace(/^VEX-B-/i, 'VEXB-');
  s = s.replace(/^VEX-R-/i, 'VEXR-');
  s = s.replace(/^VEX-M-/i, 'VEXM-');

  s = s.replace(/^VEXBRN-/i, 'VEXB-');
  s = s.replace(/^VEXRAD-/i, 'VEXR-');
  s = s.replace(/^VEXMOT-/i, 'VEXM-');

  s = s.replace(/^VEXSDIST-/i, 'VEXS-DIST-');
  s = s.replace(/^VEXSROT-/i, 'VEXS-ROT-');
  s = s.replace(/^VEXSINER-/i, 'VEXS-INER-');
  s = s.replace(/^VEXSO-/i, 'VEXS-O-');

  // 3. Short aliases without VEX prefix
  s = s.replace(/^DIST(ANCE)?-/i, 'VEXS-DIST-');
  s = s.replace(/^ROT(ATIONAL)?-/i, 'VEXS-ROT-');
  s = s.replace(/^INER(TIAL)?-/i, 'VEXS-INER-');
  s = s.replace(/^(OPT(ICAL)?|O)-/i, 'VEXS-O-');
  s = s.replace(/^SOL(ENOID(S)?)?-/i, 'VEXSOL-');
  s = s.replace(/^(BRAIN|BRN|B)-/i, 'VEXB-');
  s = s.replace(/^(RADIO|RAD|R)-/i, 'VEXR-');
  s = s.replace(/^(MOTOR|MOT|M)-/i, 'VEXM-');

  // 4. If only digits were passed and we have a category hint
  if (/^\d+$/.test(s) && categoryHint) {
    const hintCat = String(categoryHint).toLowerCase();
    if (hintCat.includes('optical') || hintCat === 'optical') s = `VEXS-O-${parseInt(s, 10)}`;
    else if (hintCat.includes('dist') || hintCat === 'distance') s = `VEXS-DIST-${parseInt(s, 10)}`;
    else if (hintCat.includes('inert') || hintCat === 'inertial') s = `VEXS-INER-${parseInt(s, 10)}`;
    else if (hintCat.includes('rotat') || hintCat === 'rotational') s = `VEXS-ROT-${parseInt(s, 10)}`;
    else if (hintCat.includes('sol') || hintCat === 'solenoids') s = `VEXSOL-${parseInt(s, 10)}`;
    else if (hintCat.includes('brain') || hintCat === 'brain') s = `VEXB-${parseInt(s, 10)}`;
    else if (hintCat.includes('radio') || hintCat === 'radio') s = `VEXR-${parseInt(s, 10)}`;
  }

  // 5. Clean up leading zeros in the trailing numeric component (e.g. VEXS-DIST-004 -> VEXS-DIST-4)
  s = s.replace(/-0+(\d+)$/, '-$1');

  return s;
}

export function isValidVexId(rawId: string): boolean {
  if (!rawId) return false;
  const clean = normalizeItemId(rawId);
  return (
    /^VEX(S-(O|DIST|INER|ROT)|SOL|B|R|M)-[A-Z0-9]+$/i.test(clean) ||
    /^VEX(S-[A-Z0-9]+|SOL|B|R|M)-[A-Z0-9]+$/i.test(clean) ||
    /^VEX-O-\d+$/i.test(clean) ||
    /^VEX(BRN|RAD|SOL)-\d+$/i.test(clean)
  );
}

export function classifyVexCategory(category?: string, itemName?: string, itemId?: string): VexCategory {
  const c = String(category || '').toLowerCase();
  const n = String(itemName || '').toLowerCase();
  const id = String(itemId || '').toUpperCase();

  // Solenoid / Pneumatics
  if (c.includes('solenoid') || c.includes('solonoid') || c.includes('pneumatic') || id.startsWith('VEXSOL')) {
    return 'Solenoids';
  }
  // Optical Sensor
  if (c.includes('optical') || n.includes('optical') || id.includes('VEXS-O') || id.includes('-O-') || id.startsWith('VEX-O-')) {
    return 'Optical';
  }
  // Distance Sensor
  if (c.includes('dist') || n.includes('dist') || id.includes('VEXS-DIST') || id.includes('-DIST-')) {
    return 'Distance';
  }
  // Inertial Sensor
  if (c.includes('inert') || n.includes('inert') || id.includes('VEXS-INER') || id.includes('-INER-')) {
    return 'Inertial';
  }
  // Rotational Sensor
  if (c.includes('rotat') || n.includes('rotat') || id.includes('VEXS-ROT') || id.includes('-ROT-')) {
    return 'Rotational';
  }
  // Brain
  if (c.includes('brain') || n.includes('brain') || id.startsWith('VEXB') || id.startsWith('VEXBRN')) {
    return 'Brain';
  }
  // Radio
  if (c.includes('radio') || n.includes('radio') || id.startsWith('VEXR') || id.startsWith('VEXRAD')) {
    return 'Radio';
  }

  // Fallback for generic sensors
  if (id.startsWith('VEXS-O')) return 'Optical';
  if (id.startsWith('VEXS-DIST')) return 'Distance';
  if (id.startsWith('VEXS-INER')) return 'Inertial';
  if (id.startsWith('VEXS-ROT')) return 'Rotational';
  if (c.includes('sensor') || n.includes('sensor')) {
    return 'Distance';
  }

  return 'Distance';
}

export function getCategoryDefaultLocation(category: VexCategory | string): string {
  const normalized = (category || '').toLowerCase();
  if (
    normalized.includes('sensor') ||
    normalized.includes('optical') ||
    normalized.includes('distance') ||
    normalized.includes('inert') ||
    normalized.includes('rotat')
  ) {
    return 'Sensor Cabinet';
  }
  if (
    normalized.includes('solenoid') ||
    normalized.includes('solonoid') ||
    normalized.includes('pneumatic')
  ) {
    return 'Pneumatics Cabinet';
  }
  // Brain, Radio, and Motors are in Cabinet 1
  return 'Cabinet 1';
}

export type ItemStatus = 'Available' | 'Checked Out';

export interface InventoryItem {
  itemId: string;
  itemName: string;
  category: VexCategory;
  status: ItemStatus;
  currentUser: string; // e.g. "654V", "654T", "654B"
  dateOut: string;
  notes: string;
  timesCheckedOut: number;
  location?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  itemId: string;
  itemName?: string;
  action: 'Check Out' | 'Check In';
  team: string;
  notes: string;
  userEmail: string;
  category?: string;
}

export interface CompetitionPackItem {
  id: string;
  category: VexCategory;
  name: string;
  targetCount: number;
  packedCount: number;
  isPacked: boolean;
  priority: 'Critical' | 'Standard' | 'Spare';
  description: string;
}

export interface SyncStatus {
  lastSynced: Date | null;
  isSyncing: boolean;
  error: string | null;
  mode: 'live' | 'mock';
  url: string;
}

export type ActiveTab = 'dashboard' | 'inventory' | 'teams' | 'packlist' | 'logs';

export type UserRole = 'member' | 'admin';

export interface AdminSettings {
  adminEmails: string[];
  adminPin: string;
  isUnlocked: boolean;
  kioskOnly: boolean;
}

export const DEFAULT_ADMIN_EMAILS = [
  'yln2k20trishanth@gmail.com',
];

export const DEFAULT_ADMIN_PIN = '654';
