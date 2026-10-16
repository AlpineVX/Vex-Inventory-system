export type VexCategory =
  | 'Motors'
  | 'Brain'
  | 'Radio'
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

export const CATEGORY_PREFIX_MAP: Record<VexCategory, string> = {
  Motors: 'MOT',
  Brain: 'BRN',
  Radio: 'RAD',
  Optical: 'OPT',
  Distance: 'DST',
  Inertial: 'INR',
  Rotational: 'ROT',
  Solenoids: 'SOL',
};

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
