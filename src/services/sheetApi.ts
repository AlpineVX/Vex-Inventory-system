import { InventoryItem, AuditLog, VexCategory, getCategoryDefaultLocation, classifyVexCategory, normalizeItemId, isValidVexId } from '../types';

const STORAGE_KEY_URL = 'vex_inventory_gas_url';
const STORAGE_KEY_INVENTORY = 'vex_inventory_items_cache';
const STORAGE_KEY_LOGS = 'vex_inventory_logs_cache';
const STORAGE_KEY_LAST_SYNC = 'vex_inventory_last_sync';

export interface SheetApiResponse {
  inventory: InventoryItem[];
  logs: any[];
}

export interface PostActionPayload {
  action: 'Check Out' | 'Check In';
  itemId: string;
  team: string;
  notes: string;
  email: string;
  category?: string;
}

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwjICL8-PwBQO9uXkpvE9RjoAygAKiG5JTizLE5e6yGE2KPMKYlal1w0qCj-75pK63qpQ/exec';

export function getStoredApiUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_GAS_URL;
  const stored = localStorage.getItem(STORAGE_KEY_URL);
  if (stored && stored.trim() && stored.startsWith('http')) {
    // If the stored URL is the old deployment, automatically upgrade to the new one
    if (stored.includes('AKfycbydr8VCH0RMcfAWa4-rvip22cMkbnpXuKWH1I9mOhf3mJL-ZF9OYjKQStVkkaL0jdPjFw')) {
      localStorage.setItem(STORAGE_KEY_URL, DEFAULT_GAS_URL);
      return DEFAULT_GAS_URL;
    }
    return stored.trim();
  }
  return DEFAULT_GAS_URL;
}

export function saveStoredApiUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim();
  localStorage.setItem(STORAGE_KEY_URL, trimmed || DEFAULT_GAS_URL);
}

export function getCachedInventory(): InventoryItem[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 5000) {
      localStorage.removeItem(STORAGE_KEY_INVENTORY);
      return null;
    }
    // Reject contaminated caches containing formula errors, random words, or dashboard rows
    const isCorrupted = parsed.some(
      (item) =>
        !item ||
        !isValidVexId(item.itemId) ||
        String(item.itemId).includes('#') ||
        String(item.itemId).includes(',') ||
        String(item.itemId).includes(' ') ||
        String(item.itemName || '').includes('Dashboard #') ||
        String(item.itemName || '').includes('Team Lookup') ||
        String(item.itemName || '').includes('#N/A') ||
        String(item.itemName || '').includes('=') ||
        String(item.notes || '').includes('█')
    );
    if (isCorrupted) {
      localStorage.removeItem(STORAGE_KEY_INVENTORY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY_INVENTORY);
    return null;
  }
}

export function saveCachedInventory(items: InventoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error('Failed to cache inventory locally', e);
  }
}

export function getCachedLogs(): AuditLog[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY_LOGS);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedLogs(logs: AuditLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to cache logs locally', e);
  }
}

export function getLastSyncTime(): Date | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  return val ? new Date(val) : null;
}

/**
 * Validate URL to give instant helpful guidance before hitting network
 */
function validateAppScriptUrl(url: string): void {
  if (!url || !url.startsWith('http')) {
    throw new Error('Please configure a valid Google Apps Script Web App URL starting with https://');
  }

  if (url.includes('docs.google.com/spreadsheets')) {
    throw new Error(
      "You pasted the Google Sheet spreadsheet link instead of the Apps Script Web App URL. In Google Sheets: Click Extensions > Apps Script > Deploy > New deployment (or Manage deployments) > Select Web app > set 'Who has access' to 'Anyone' > Copy the URL ending in '/exec'."
    );
  }

  if (url.endsWith('/edit') || url.includes('/edit?')) {
    throw new Error(
      "You entered the Apps Script Editor URL (/edit). Please click 'Deploy' (top right) > 'Manage deployments' > Copy the Web App URL that ends in '/exec'."
    );
  }
}

/**
 * Fetch live inventory from Google Apps Script Web App
 * Uses server-side proxy route (/api/sync) to bypass browser CORS and redirect restrictions.
 */
export async function fetchLiveInventory(apiUrl: string): Promise<{
  inventory: InventoryItem[];
  logs: AuditLog[];
}> {
  validateAppScriptUrl(apiUrl);

  let rawData: SheetApiResponse | null = null;
  let lastError = '';

  // 1. Try server-side proxy first (bypasses CORS & handles redirects cleanly)
  try {
    const proxyUrl = `/api/sync?url=${encodeURIComponent(apiUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    const proxyRes = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const proxyJson = await proxyRes.json();
    if (!proxyRes.ok) {
      throw new Error(proxyJson.error || `Server proxy error (HTTP ${proxyRes.status})`);
    }

    rawData = proxyJson as SheetApiResponse;
  } catch (proxyErr: any) {
    // If the proxy gave a specific actionable error message from Google Apps Script, rethrow it
    if (proxyErr.message && !proxyErr.message.includes('Failed to fetch') && !proxyErr.message.includes('Unexpected token')) {
      throw proxyErr;
    }
    lastError = proxyErr.message;
  }

  // 2. Direct fallback (if proxy is unavailable)
  if (!rawData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // NOTE: Do NOT send custom headers like Accept: application/json here to prevent CORS preflight
      const res = await fetch(apiUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Google Apps Script responded with HTTP ${res.status}: ${res.statusText}`);
      }

      rawData = await res.json();
    } catch (directErr: any) {
      clearTimeout(timeoutId);
      if (directErr.name === 'AbortError') {
        throw new Error('Sync timed out. Verify your Google Apps Script is published and accessible.');
      }
      if (directErr.message?.includes('Failed to fetch')) {
        throw new Error(
          "Sync failed ('Failed to fetch'). This occurs when Google Apps Script is not set to 'Who has access: Anyone' (causing an unauthorized redirect), or the Web App URL is invalid. In Google Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone' > Deploy."
        );
      }
      throw directErr;
    }
  }

  const rawItems = Array.isArray(rawData?.inventory)
    ? rawData.inventory
    : Array.isArray((rawData as any)?.items)
    ? (rawData as any).items
    : null;

  if (!rawData || !rawItems) {
    throw new Error('Received invalid data format from Google Apps Script. Expected { items: [...] } or { inventory: [...] }');
  }

  // 1. Map logs if present
  const mappedLogs: AuditLog[] = Array.isArray(rawData.logs)
    ? rawData.logs
        .filter((row) => row && (Array.isArray(row) ? row.length >= 2 : row.itemId))
        .map((row, index) => {
          if (Array.isArray(row)) {
            const rawId = String(row[1] || '').trim();
            const normId = normalizeItemId(rawId);
            return {
              id: `sheet-log-${index}-${Date.now()}`,
              timestamp: row[0] ? new Date(row[0]).toISOString() : new Date().toISOString(),
              itemId: normId || rawId,
              action: (String(row[2]).trim() === 'Check Out' ? 'Check Out' : 'Check In') as 'Check Out' | 'Check In',
              team: String(row[3] || '').trim(),
              notes: String(row[4] || '').trim(),
              userEmail: String(row[5] || '').trim(),
              category: String(row[6] || '').trim(),
            };
          }
          const rawId = String(row.itemId || '').trim();
          const normId = normalizeItemId(rawId);
          return {
            id: row.id || `sheet-log-${index}-${Date.now()}`,
            timestamp: row.timestamp || new Date().toISOString(),
            itemId: normId || rawId,
            itemName: row.itemName,
            action: (row.action === 'Check Out' ? 'Check Out' : 'Check In') as 'Check Out' | 'Check In',
            team: String(row.team || '').trim(),
            notes: String(row.notes || '').trim(),
            userEmail: String(row.userEmail || row.email || '').trim(),
            category: row.category,
          };
        })
    : [];

  // Track latest log per item ID and count total checkouts from complete LOGS (Fixes Bug 1 & Bug 9)
  const latestLogByItem = new Map<string, AuditLog>();
  const checkoutCountByItem = new Map<string, number>();

  const chronoSortedLogs = [...mappedLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  chronoSortedLogs.forEach((log) => {
    const key = normalizeItemId(log.itemId);
    latestLogByItem.set(key, log);
    if (log.action === 'Check Out') {
      checkoutCountByItem.set(key, (checkoutCountByItem.get(key) || 0) + 1);
    }
  });

  // The official VEX inventory category sheets (Motors hidden by user request)
  const VALID_INVENTORY_SHEETS = new Set([
    'OPTICAL',
    'DISTANCE',
    'INERTIAL',
    'ROTATIONAL',
    'SOLENOIDS',
    'SOLENOID',
    'RADIO',
    'BRAIN',
  ]);

  const cleanItemsMap = new Map<string, any>();

  // Pass 1: Accept genuine items from the active inventory sheets
  (rawItems || []).forEach((item: any) => {
    if (!item) return;
    const src = String(item.sheetSource || '').trim().toUpperCase();
    const rawId = String(item.itemId || '').trim();
    const normId = normalizeItemId(rawId);
    if (VALID_INVENTORY_SHEETS.has(src) && isValidVexId(normId)) {
      cleanItemsMap.set(normId.toUpperCase(), item);
    }
  });

  // Pass 2: Rescue any genuine hardware item that was trapped in Team Lookup / Team View
  // (e.g. VEXS-DIST-2, VEXS-INER-4, VEXSOL-29) if not already found in pass 1
  (rawItems || []).forEach((item: any) => {
    if (!item) return;
    const src = String(item.sheetSource || '').trim().toUpperCase();
    if (src.includes('DASHBOARD') || src.includes('WEEKLY') || src.includes('LISTS') || src.includes('AUDIT') || src.includes('MOTOR')) return;
    const rawId = String(item.itemId || '').trim();
    const normId = normalizeItemId(rawId);
    if (isValidVexId(normId)) {
      const key = normId.toUpperCase();
      if (!cleanItemsMap.has(key)) {
        cleanItemsMap.set(key, item);
      }
    }
  });

  // Default clean names for each category
  const DEFAULT_ITEM_NAMES: Record<VexCategory, string> = {
    Radio: 'V5 Robot Radio',
    Brain: 'V5 Robot Brain',
    Solenoids: 'Pneumatic Solenoid',
    Optical: 'Optical Sensor',
    Distance: 'Distance Sensor',
    Inertial: 'Inertial Sensor',
    Rotational: 'Rotational Sensor',
    Sensors: 'Sensor',
  };

  const mappedInventory: InventoryItem[] = [];

  cleanItemsMap.forEach((item) => {
    const rawId = String(item.itemId || '').trim();
    const normId = normalizeItemId(rawId);
    const cat = classifyVexCategory(item.category, item.itemName, normId);

    // Evaluate status: check latest log first
    const latestLog = latestLogByItem.get(normId);
    let status: 'Available' | 'Checked Out' = 'Available';
    let currentUser = '';
    let dateOut = '';
    let rawNotes = String(item.notes || '').trim();
    // Clean out formula visual progress bar, errors, and long text from notes
    if (
      rawNotes.includes('█') ||
      rawNotes.includes('░') ||
      rawNotes.includes('#REF!') ||
      rawNotes.includes('#N/A') ||
      rawNotes.includes('#NAME?') ||
      rawNotes.includes('#VALUE!') ||
      rawNotes.includes('=') ||
      rawNotes.length > 150
    ) {
      rawNotes = '';
    }

    if (latestLog) {
      if (latestLog.action === 'Check Out') {
        status = 'Checked Out';
        currentUser = latestLog.team || '';
        dateOut = latestLog.timestamp ? latestLog.timestamp.split('T')[0] : '';
        rawNotes = latestLog.notes || rawNotes;
      } else {
        status = 'Available';
        currentUser = '';
        dateOut = '';
      }
    } else if (item.status === 'Checked Out') {
      status = 'Checked Out';
      currentUser = String(item.currentUser || '').trim();
      dateOut = item.dateOut ? String(item.dateOut).split('T')[0] : '';
    }

    // Ensure status is strictly 'Available' or 'Checked Out', never a date, number, or random text
    if (status !== 'Available' && status !== 'Checked Out') {
      status = 'Available';
    }

    // Ensure currentUser is a valid team (e.g. 654V, 654K, etc.) and not a date or random phrase
    if (currentUser && !/^654[A-Z]?$/i.test(currentUser) && currentUser !== 'RECF') {
      if (!/^[A-Z0-9-]{1,10}$/i.test(currentUser) || /^\d{4}-\d{2}/.test(currentUser)) {
        currentUser = '';
      }
    }

    const timesOut =
      checkoutCountByItem.get(normId) ||
      Number(item.timesCheckedOut) ||
      (status === 'Checked Out' ? 1 : 0);

    // Strict part name sanitization: ensure it is ONLY a valid component name and never random words or phrases
    let cleanName = String(item.itemName || '').trim();
    const isGarbagePhrase =
      !cleanName ||
      cleanName.includes('#') ||
      cleanName.includes('=') ||
      cleanName.includes('%') ||
      cleanName.includes(',') ||
      cleanName.includes('█') ||
      cleanName.includes('░') ||
      /^\d+$/.test(cleanName) ||
      /^\d{4}-\d{2}-\d{2}/.test(cleanName) ||
      /^(DASHBOARD|TEAM|WEEKLY|COMPETITION|LIST|AUDIT|LOG|TOTAL|FASTEST|MOST|AVERAGE|OVERDUE|RESPONSIBLE|UTILIZATION|AVAILABLE|CHECKED|STATUS|BREAKDOWN|SUMMARY|SPEED|COUNT|HOURS|DAYS|FORMULA|NOTHING|REPORT|LIVE)/i.test(
        cleanName
      );

    if (isGarbagePhrase) {
      cleanName = DEFAULT_ITEM_NAMES[cat] || `VEX ${cat} Component`;
    }

    mappedInventory.push({
      itemId: normId,
      itemName: cleanName,
      category: cat,
      status,
      currentUser,
      dateOut,
      notes: rawNotes,
      timesCheckedOut: timesOut,
      location: item.location || getCategoryDefaultLocation(cat),
    });
  });

  return {
    inventory: mappedInventory,
    logs: mappedLogs,
  };
}

/**
 * Send Check In or Check Out POST request to Google Apps Script
 * Uses server-side proxy route (/api/action) to eliminate CORS and redirect blocks.
 */
export async function postInventoryAction(
  apiUrl: string,
  payload: PostActionPayload
): Promise<{ status: string; message: string }> {
  validateAppScriptUrl(apiUrl);

  // 1. Try server proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    const normalizedId = normalizeItemId(payload.itemId, payload.category);
    const numDigits = normalizedId.match(/\d+/)?.[0] || '';
    const numericNumber = numDigits ? parseInt(numDigits, 10) : '';
    const determinedCategory = payload.category || classifyVexCategory(undefined, undefined, normalizedId);

    const enhancedPayload = {
      ...payload,
      itemId: normalizedId,
      userEmail: payload.email,
      currentUser: payload.action === 'Check Out' ? payload.team : '',
      category: determinedCategory,
      sensorType: determinedCategory,
      number: numericNumber,
    };

    const proxyRes = await fetch('/api/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: apiUrl,
        ...enhancedPayload,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await proxyRes.json();

    if (!proxyRes.ok) {
      throw new Error(json.error || `Proxy error (HTTP ${proxyRes.status})`);
    }

    if (json && (json.status === 'error' || json.error)) {
      throw new Error(json.message || json.error || 'Google Apps Script reported an error');
    }

    return json;
  } catch (proxyErr: any) {
    if (proxyErr.message && !proxyErr.message.includes('Failed to fetch')) {
      throw proxyErr;
    }
  }

  // 2. Direct fallback
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const normalizedId = normalizeItemId(payload.itemId, payload.category);
    const numDigits = normalizedId.match(/\d+/)?.[0] || '';
    const numericNumber = numDigits ? parseInt(numDigits, 10) : '';
    const determinedCategory = payload.category || classifyVexCategory(undefined, undefined, normalizedId);

    const enhancedPayload = {
      ...payload,
      itemId: normalizedId,
      userEmail: payload.email,
      currentUser: payload.action === 'Check Out' ? payload.team : '',
      category: determinedCategory,
      sensorType: determinedCategory,
      number: numericNumber,
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(enhancedPayload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google Apps Script POST failed with HTTP ${res.status}`);
    }

    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed && (parsed.status === 'error' || parsed.error)) {
        throw new Error(parsed.message || parsed.error || 'Google Apps Script returned an error');
      }
      return parsed;
    } catch (parseErr: any) {
      if (parseErr.message && !parseErr.message.includes('JSON')) {
        throw parseErr;
      }
      return { status: 'success', message: 'Action saved' };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Network timeout contacting Google Apps Script.');
    }
    if (err.message?.includes('Failed to fetch')) {
      throw new Error(
        "Action POST failed ('Failed to fetch'). In Google Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone' > Deploy."
      );
    }
    throw err;
  }
}

export const APPS_SCRIPT_SOURCE = `// ============================================================================
// VEX ROBOTICS INVENTORY CONTROL - GOOGLE APPS SCRIPT
// Paste this code into Extensions > Apps Script in your Google Spreadsheet.
// Then click 'Deploy' > 'New deployment' (or 'Manage deployments') > Select 'Web app'
// Set 'Execute as': 'Me'
// Set 'Who has access': 'Anyone'  <-- CRITICAL to allow web checkouts!
// ============================================================================
// NOTE: 
// 1. doGet reads from ALL pages/sheets in your spreadsheet and reads live formula results!
// 2. doPost ONLY affects and appends to LOGS, so all your ARRAYFORMULA / MAP / XLOOKUP 
//    formulas in your category sheets remain 100% intact and compute statuses automatically!
// ============================================================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Read all logs from LOGS sheet
  var logsSheet = ss.getSheetByName("LOGS");
  var logsData = [];
  if (logsSheet) {
    var raw = logsSheet.getDataRange().getValues();
    if (raw.length > 1) {
      logsData = raw.slice(1); // Exclude header row
    }
  }
  
  // 2. ONLY scan genuine inventory category sheets (exclude Dashboard, reports, lookups, pack list, logs, motors)
  var validInventorySheets = {
    "OPTICAL": true,
    "DISTANCE": true,
    "INERTIAL": true,
    "ROTATIONAL": true,
    "SOLENOIDS": true,
    "SOLENOID": true,
    "RADIO": true,
    "BRAIN": true
  };

  var allSheets = ss.getSheets();
  var inventory = [];
  var seenIds = {};
  
  for (var s = 0; s < allSheets.length; s++) {
    var sheet = allSheets[s];
    var sheetName = sheet.getName().trim();
    if (!validInventorySheets[sheetName.toUpperCase()]) continue;
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var col0 = String(row[0] || "").trim(); // Item Name
      var col1 = String(row[1] || "").trim(); // Item ID
      
      var itemId = col1 || col0;
      var itemName = col0 || (sheetName + " #" + itemId);
      
      if (!itemId && !col0) continue;

      // Validate Item ID: must strictly be a genuine VEX hardware ID, never a formula, date, or word phrase
      var cleanId = itemId.replace(/\s+/g, "").toUpperCase();
      if (!/^VEX(S-[A-Z0-9]+|SOL|B|R)-\d+$/.test(cleanId) && !/^VEX-O-\d+$/.test(cleanId)) continue;
      
      var key = cleanId;
      if (seenIds[key]) continue;
      seenIds[key] = true;

      // Sanitize Item Name against formulas, errors, or random words
      if (!itemName || itemName.indexOf("#") !== -1 || itemName.indexOf("=") !== -1 || /^(DASHBOARD|TEAM|WEEKLY|COMPETITION|LIST|AUDIT|LOG|TOTAL|FASTEST|MOST|AVERAGE|OVERDUE|RESPONSIBLE|UTILIZATION|AVAILABLE|CHECKED|STATUS|BREAKDOWN|SUMMARY|SPEED|COUNT|HOURS|DAYS|FORMULA|NOTHING|REPORT|LIVE)/i.test(itemName)) {
        itemName = sheetName + " " + cleanId;
      }

      // Status evaluated directly from your ARRAYFORMULA/XLOOKUP formulas in Google Sheets
      var status = row[3] ? String(row[3]).trim() : "Available";
      var currentUser = row[4] ? String(row[4]).trim() : "";
      var dateOut = row[5] ? row[5].toString() : "";
      var notes = row[6] ? String(row[6]).trim() : "";
      var timesCheckedOut = row[8] ? Number(row[8]) || 0 : 0;

      inventory.push({
        itemName: itemName,
        itemId: itemId,
        category: row[2] ? String(row[2]).trim() : sheetName,
        status: status,
        currentUser: currentUser,
        dateOut: dateOut,
        notes: notes,
        timesCheckedOut: timesCheckedOut,
        sheetSource: sheetName
      });
    }
  }

  var response = {
    status: "success",
    count: inventory.length,
    inventory: inventory,
    items: inventory,
    logs: logsData
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var requestData = JSON.parse(contents);
    var action = requestData.action || "Check Out";
    var itemId = String(requestData.itemId || "").trim();
    var team = String(requestData.team || "").trim();
    var notes = String(requestData.notes || "").trim();
    var rawNum = requestData.number;
    var number = "";
    if (typeof rawNum === "number") {
      number = rawNum;
    } else if (typeof rawNum === "string" && /^\d+$/.test(rawNum.trim())) {
      number = parseInt(rawNum.trim(), 10);
    } else {
      var digits = itemId.replace(/\D+/g, "");
      number = digits ? parseInt(digits, 10) : "";
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure LOGS sheet exists and append record ONLY to LOGS
    // Leaves all category sheets and formulas 100% untouched!
    var logsSheet = ss.getSheetByName("LOGS");
    if (!logsSheet) {
      logsSheet = ss.insertSheet("LOGS");
      logsSheet.appendRow(["Timestamp", "Item ID", "Action", "Team", "Notes", "Borrower Email", "Category", "Number"]);
      logsSheet.setFrozenRows(1);
    }
    
    logsSheet.appendRow([
      new Date().toISOString(),
      itemId,
      action,
      team,
      notes,
      userEmail,
      category,
      number,
      ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Recorded " + action + " for " + itemId + " in LOGS sheet",
      itemId: itemId,
      action: action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
