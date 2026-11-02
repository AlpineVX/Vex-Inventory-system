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
  // Strip quotes and convert hash symbols anywhere to hyphen (e.g. Brain #1 -> BRAIN-1, #VEXB-1 -> VEXB-1)
  s = s.replace(/["'`]/g, '').replace(/#/g, '-').replace(/-+/g, '-');
  // Strip leading hyphen if hash was at start
  s = s.replace(/^-+/, '');

  // 1. Collapse accidental double prefixes (e.g. VEXS-DIST-DIST-4, VEXSOL-SOL-1)
  s = s.replace(/^VEXS?-DIST-DIST-/i, 'VEXS-DIST-');
  s = s.replace(/^VEXS?-ROT-ROT-/i, 'VEXS-ROT-');
  s = s.replace(/^VEXS?-INER-INER-/i, 'VEXS-INER-');
  s = s.replace(/^VEXS?-O-O-/i, 'VEXS-O-');
  s = s.replace(/^VEXSOL-SOL-/i, 'VEXSOL-');
  s = s.replace(/^VEXB-B-/i, 'VEXB-');
  s = s.replace(/^VEXR-R-/i, 'VEXR-');
  s = s.replace(/^VEXM-M-/i, 'VEXM-');

  // 2. Standardize VEX- prefixed variations and VEX-S- to VEXS-
  s = s.replace(/^VEX[-_]S[-_]O[-_]/i, 'VEXS-O-');
  s = s.replace(/^VEX[-_]S[-_]DIST[-_]/i, 'VEXS-DIST-');
  s = s.replace(/^VEX[-_]S[-_]ROT[-_]/i, 'VEXS-ROT-');
  s = s.replace(/^VEX[-_]S[-_]INER[-_]/i, 'VEXS-INER-');
  s = s.replace(/^VEX[-_]S[-_]/i, 'VEXS-');

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

  // 3. Short aliases without VEX prefix (with or without hyphen/space)
  // Supports: SOLENOID / SOLONOID, INERTIA / INERTIAL, ROTATION / ROTATIONAL, OPTICAL / OPTIC, PNEUMATIC(S)
  s = s.replace(/^DIST(ANCE)?[-_]?(\d+)$/i, 'VEXS-DIST-$2');
  s = s.replace(/^ROT(ATION(AL)?)?[-_]?(\d+)$/i, 'VEXS-ROT-$3');
  s = s.replace(/^INER(TIA(L)?)?[-_]?(\d+)$/i, 'VEXS-INER-$3');
  s = s.replace(/^(OPT(IC(AL)?)?|O)[-_]?(\d+)$/i, 'VEXS-O-$4');
  s = s.replace(/^(SOL([EO]NOID(S)?)?|PNEU(MATIC(S)?)?)[-_]?(\d+)$/i, 'VEXSOL-$6');
  s = s.replace(/^(BRAIN|BRN|B)[-_]?(\d+)$/i, 'VEXB-$2');
  s = s.replace(/^(RADIO|RAD|R)[-_]?(\d+)$/i, 'VEXR-$2');
  s = s.replace(/^(MOTOR|MOT|M)[-_]?(\d+)$/i, 'VEXM-$2');

  // Short aliases with hyphen prefix
  s = s.replace(/^DIST(ANCE)?-/i, 'VEXS-DIST-');
  s = s.replace(/^ROT(ATION(AL)?)?-/i, 'VEXS-ROT-');
  s = s.replace(/^INER(TIA(L)?)?-/i, 'VEXS-INER-');
  s = s.replace(/^(OPT(IC(AL)?)?|O)-/i, 'VEXS-O-');
  s = s.replace(/^(SOL([EO]NOID(S)?)?|PNEU(MATIC(S)?)?)-/i, 'VEXSOL-');
  s = s.replace(/^(BRAIN|BRN|B)-/i, 'VEXB-');
  s = s.replace(/^(RADIO|RAD|R)-/i, 'VEXR-');
  s = s.replace(/^(MOTOR|MOT|M)-/i, 'VEXM-');

  // 3b. VEX-prefixed without hyphen to digits (e.g. VEXDIST4 -> VEXS-DIST-4, VEXSOL1 -> VEXSOL-1)
  s = s.replace(/^VEX[-_]?DIST(ANCE)?[-_]?(\d+)$/i, 'VEXS-DIST-$2');
  s = s.replace(/^VEX[-_]?ROT(ATION(AL)?)?[-_]?(\d+)$/i, 'VEXS-ROT-$3');
  s = s.replace(/^VEX[-_]?INER(TIA(L)?)?[-_]?(\d+)$/i, 'VEXS-INER-$3');
  s = s.replace(/^VEX[-_]?(OPT(IC(AL)?)?|O)[-_]?(\d+)$/i, 'VEXS-O-$4');
  s = s.replace(/^VEX[-_]?(SOL([EO]NOID(S)?)?|PNEU(MATIC(S)?)?)[-_]?(\d+)$/i, 'VEXSOL-$5');
  s = s.replace(/^VEX[-_]?(BRAIN|BRN|B)[-_]?(\d+)$/i, 'VEXB-$2');
  s = s.replace(/^VEX[-_]?(RADIO|RAD|R)[-_]?(\d+)$/i, 'VEXR-$2');
  s = s.replace(/^VEX[-_]?(MOTOR|MOT|M)[-_]?(\d+)$/i, 'VEXM-$2');

  // 4. Single-letter shorthands or digits when a category hint is provided
  if (categoryHint) {
    const hintCat = String(categoryHint).toLowerCase();
    const trailingDigits = s.match(/(\d+)$/)?.[1];
    if (trailingDigits) {
      const num = parseInt(trailingDigits, 10);
      // Check if s is just digits or single letter like D4, R4, I4, O4, S4, B4
      if (/^\d+$/.test(s) || /^[A-Z][-_]?\d+$/i.test(s)) {
        if (hintCat.includes('optical') || hintCat === 'optical') s = `VEXS-O-${num}`;
        else if (hintCat.includes('dist') || hintCat === 'distance') s = `VEXS-DIST-${num}`;
        else if (hintCat.includes('inert') || hintCat === 'inertial' || hintCat.includes('inertia')) s = `VEXS-INER-${num}`;
        else if (hintCat.includes('rotat') || hintCat === 'rotational' || hintCat.includes('rotation')) s = `VEXS-ROT-${num}`;
        else if (hintCat.includes('sol') || hintCat === 'solenoids' || hintCat.includes('pneumat')) s = `VEXSOL-${num}`;
        else if (hintCat.includes('brain')) s = `VEXB-${num}`;
        else if (hintCat.includes('radio')) s = `VEXR-${num}`;
      }
    }
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
