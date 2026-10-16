import { InventoryItem, AuditLog } from '../types';

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

export function getStoredApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_URL) || '';
}

export function saveStoredApiUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim();
  localStorage.setItem(STORAGE_KEY_URL, trimmed);
}

export function getCachedInventory(): InventoryItem[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
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
 * Fetch live inventory from Google Apps Script Web App
 */
export async function fetchLiveInventory(apiUrl: string): Promise<{
  inventory: InventoryItem[];
  logs: AuditLog[];
}> {
  if (!apiUrl || !apiUrl.startsWith('http')) {
    throw new Error('Please configure a valid Google Apps Script Web App URL.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 14000);

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google Apps Script responded with HTTP ${res.status}: ${res.statusText}`);
    }

    const data: SheetApiResponse = await res.json();

    if (!data || !Array.isArray(data.inventory)) {
      throw new Error('Received invalid data format from Google Apps Script. Expected { inventory: [...] }');
    }

    // Map logs if present
    const mappedLogs: AuditLog[] = Array.isArray(data.logs)
      ? data.logs
          .filter((row) => row && row.length >= 2)
          .map((row, index) => ({
            id: `sheet-log-${index}-${Date.now()}`,
            timestamp: row[0] ? new Date(row[0]).toISOString() : new Date().toISOString(),
            itemId: String(row[1] || ''),
            action: (row[2] === 'Check Out' ? 'Check Out' : 'Check In') as 'Check Out' | 'Check In',
            team: String(row[3] || ''),
            notes: String(row[4] || ''),
            userEmail: String(row[5] || ''),
            category: String(row[6] || ''),
          }))
      : [];

    return {
      inventory: data.inventory,
      logs: mappedLogs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check if your Google Apps Script is accessible.');
    }
    throw err;
  }
}

/**
 * Send Check In or Check Out POST request to Google Apps Script
 */
export async function postInventoryAction(
  apiUrl: string,
  payload: PostActionPayload
): Promise<{ status: string; message: string }> {
  if (!apiUrl || !apiUrl.startsWith('http')) {
    throw new Error('No Google Apps Script URL configured. Action saved in local session.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Note: We use 'text/plain;charset=utf-8' so browsers execute a simple POST without
    // CORS preflight OPTIONS request, which Google Apps Script endpoints do not respond to.
    // Apps Script doPost receives the body in e.postData.contents and parses JSON seamlessly.
    const res = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
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

    const json = await res.json();
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Network timeout contacting Google Apps Script.');
    }
    throw err;
  }
}

export const APPS_SCRIPT_SOURCE = `// Paste this code into Extensions > Apps Script in your Google Sheet

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logsSheet = ss.getSheetByName("LOGS");
  var logsData = logsSheet ? logsSheet.getDataRange().getValues() : [];
  
  // Collect all category sheets
  var categories = ["Motors", "Brain", "Radio", "Optical", "Distance", "Inertial", "Rotational", "Solenoids"];
  var inventory = [];
  
  categories.forEach(function(catName) {
    var sheet = ss.getSheetByName(catName);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (row[0] || row[1]) { // If row has content
            inventory.push({
              itemName: row[0],
              itemId: row[1],
              category: row[2] || catName,
              status: row[3] || "Available",
              currentUser: row[4] || "",
              dateOut: row[5] ? row[5].toString() : "",
              notes: row[6] || "",
              timesCheckedOut: row[8] || 0
            });
          }
        }
      }
    }
  });

  var response = {
    inventory: inventory,
    logs: logsData.slice(1) // Return logs without headers
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action; // "Check Out" or "Check In"
    var itemId = requestData.itemId;
    var team = requestData.team || "";
    var notes = requestData.notes || "";
    var userEmail = requestData.email || "";

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Append entry to LOGS sheet
    var logsSheet = ss.getSheetByName("LOGS");
    if (logsSheet) {
      logsSheet.appendRow([
        new Date(),
        itemId,
        action,
        team,
        notes,
        userEmail,
        requestData.category || "",
        "",
        ""
      ]);
    }

    // 2. Update status in category sheet
    var categories = ["Motors", "Brain", "Radio", "Optical", "Distance", "Inertial", "Rotational", "Solenoids"];
    var itemFound = false;

    for (var c = 0; c < categories.length; c++) {
      var sheet = ss.getSheetByName(categories[c]);
      if (!sheet) continue;
      
      var data = sheet.getDataRange().getValues();
      for (var r = 1; r < data.length; r++) {
        if (data[r][1] === itemId) { // Matching Item ID
          if (action === "Check Out") {
            sheet.getRange(r + 1, 4).setValue("Checked Out"); // Status
            sheet.getRange(r + 1, 5).setValue(team);          // Current User
            sheet.getRange(r + 1, 6).setValue(new Date());    // Date Out
            sheet.getRange(r + 1, 7).setValue(notes);         // Notes
            var count = sheet.getRange(r + 1, 9).getValue() || 0;
            sheet.getRange(r + 1, 9).setValue(count + 1);     // Increment checkouts
          } else if (action === "Check In") {
            sheet.getRange(r + 1, 4).setValue("Available");   // Status
            sheet.getRange(r + 1, 5).setValue("");            // Clear user
            sheet.getRange(r + 1, 6).setValue("");            // Clear date out
            sheet.getRange(r + 1, 7).setValue(notes);         // Update notes
          }
          itemFound = true;
          break;
        }
      }
      if (itemFound) break;
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Inventory updated" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
