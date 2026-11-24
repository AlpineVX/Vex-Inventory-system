import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const validateGasProxyUrl = (rawUrl: unknown): { url?: string; error?: string } => {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return { error: 'Please provide a valid Google Apps Script Web App URL.' };
    }

    const trimmed = rawUrl.trim();

    if (trimmed.includes('docs.google.com/spreadsheets')) {
      return {
        error:
          "You entered the Google Sheet spreadsheet link instead of the Apps Script Web App URL. In your Google Sheet, click Extensions > Apps Script > Deploy > New deployment (or Manage deployments) > Select Web app > set 'Who has access' to 'Anyone' > Copy the URL ending in '/exec'.",
      };
    }

    if (trimmed.endsWith('/edit') || trimmed.includes('/edit?')) {
      return {
        error:
          "You entered the Apps Script Editor URL (/edit). Please click 'Deploy' (top right) > 'Manage deployments' > Copy the Web App URL that ends in '/exec'.",
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      return { error: 'Invalid Google Apps Script Web App URL format. Please copy the full https:// URL.' };
    }

    if (parsedUrl.protocol !== 'https:') {
      return { error: 'Google Apps Script Web App URL must use https://.' };
    }

    const host = parsedUrl.hostname.toLowerCase();
    const isBlockedHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '[::1]' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);

    if (isBlockedHost) {
      return { error: 'Private or local network URLs are not permitted.' };
    }

    const isAllowedGasHost =
      host === 'script.google.com' ||
      host === 'script.googleusercontent.com' ||
      host.endsWith('.script.google.com') ||
      host.endsWith('.script.googleusercontent.com');

    if (!isAllowedGasHost) {
      return {
        error: 'URL must be a valid Google Apps Script Web App endpoint (script.google.com).',
      };
    }

    return { url: parsedUrl.toString() };
  };

  // Google Apps Script Proxy GET endpoint (bypasses browser CORS & redirect limits)
  app.get('/api/sync', async (req: Request, res: Response) => {
    const validated = validateGasProxyUrl(req.query.url);
    if (validated.error || !validated.url) {
      res.status(400).json({ error: validated.error || 'Invalid Google Apps Script Web App URL.' });
      return;
    }

    const url = validated.url;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Vex-Inventory-Sync/1.0',
        },
      });

      clearTimeout(timeout);

      const finalUrl = response.url;
      // If redirected to Google login, it means 'Who has access' is NOT set to 'Anyone'
      if (
        finalUrl.includes('accounts.google.com') ||
        finalUrl.includes('ServiceLogin')
      ) {
        res.status(403).json({
          error:
            "Authentication required by Google: In Google Apps Script, click Deploy > Manage deployments > click the Edit icon (pencil) > change 'Who has access' from 'Only myself' to 'Anyone' > click Deploy. Then retry syncing.",
        });
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      // Check if response is HTML error from Google
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        if (text.includes('Script function not found') || text.includes('Script error')) {
          res.status(400).json({
            error:
              "Google Apps Script execution error: Please verify that doGet() is defined in your script and that the script is deployed as a Web App.",
          });
          return;
        }
        res.status(400).json({
          error:
            "Google Apps Script returned an HTML page instead of JSON. Ensure your deployment 'Who has access' is set to 'Anyone' and doGet() returns ContentService JSON output.",
        });
        return;
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch (parseErr) {
        res.status(502).json({
          error: `Failed to parse JSON response from Google Apps Script. Raw response: ${text.slice(0, 150)}...`,
        });
        return;
      }

      const itemsList = Array.isArray(parsedData.inventory)
        ? parsedData.inventory
        : Array.isArray(parsedData.items)
        ? parsedData.items
        : null;

      if (!itemsList) {
        res.status(422).json({
          error:
            "Received unexpected data structure from Google Apps Script. Expected { items: [...] } or { inventory: [...] }.",
          details: parsedData,
        });
        return;
      }

      const VALID_INVENTORY_SHEETS = new Set([
        'OPTICAL',
        'DISTANCE',
        'INERTIAL',
        'ROTATIONAL',
        'SOLENOIDS',
        'SOLENOID',
        'SOLONOIDS',
        'SOLONOID',
        'PNEUMATICS',
        'PNEUMATIC',
        'RADIO',
        'BRAIN',
      ]);

      function isValidVexId(rawId: string): boolean {
        if (!rawId) return false;
        let s = rawId.trim().toUpperCase().replace(/\s+/g, '');
        s = s.replace(/["'`]/g, '').replace(/#/g, '-').replace(/-+/g, '-').replace(/^-+/, '');
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
        s = s.replace(/^VEX-(B|BRN)-/i, 'VEXB-');
        s = s.replace(/^VEX-(R|RAD)-/i, 'VEXR-');
        s = s.replace(/^VEX-(M|MOT)-/i, 'VEXM-');
        return (
          /^VEX(S-(O|DIST|INER|ROT)|SOL|B|R|M)-[A-Z0-9]+$/i.test(s) ||
          /^VEX(S-[A-Z0-9]+|SOL|B|R|M)-[A-Z0-9]+$/i.test(s) ||
          /^VEX(BRN|RAD|SOL)-[A-Z0-9]+$/i.test(s)
        );
      }

      const cleanItemsMap = new Map<string, any>();

      // Pass 1: Genuine items from the active inventory sheets
      itemsList.forEach((item: any) => {
        if (!item) return;
        const src = String(item.sheetSource || '').trim().toUpperCase();
        const rawId = String(item.itemId || '').trim();
        if (VALID_INVENTORY_SHEETS.has(src) && isValidVexId(rawId)) {
          cleanItemsMap.set(rawId.toUpperCase(), item);
        }
      });

      // Pass 2: Rescue trapped genuine hardware items from Team Lookup / Team View
      itemsList.forEach((item: any) => {
        if (!item) return;
        const src = String(item.sheetSource || '').trim().toUpperCase();
        if (src.includes('DASHBOARD') || src.includes('WEEKLY') || src.includes('LISTS') || src.includes('AUDIT') || src.includes('MOTOR')) return;
        const rawId = String(item.itemId || '').trim();
        if (isValidVexId(rawId)) {
          const key = rawId.toUpperCase();
          if (!cleanItemsMap.has(key)) {
            cleanItemsMap.set(key, item);
          }
        }
      });

      const DEFAULT_NAMES: Record<string, string> = {
        'OPTICAL': 'Optical Sensor',
        'DISTANCE': 'Distance Sensor',
        'INERTIAL': 'Inertial Sensor',
        'ROTATIONAL': 'Rotational Sensor',
        'BRAIN': 'V5 Robot Brain',
        'RADIO': 'V5 Robot Radio',
        'SOLENOIDS': 'Pneumatic Solenoid',
        'SOLENOID': 'Pneumatic Solenoid',
      };

      const cleanItems = Array.from(cleanItemsMap.values()).map((item: any) => {
        const rawId = String(item.itemId || '').trim();
        const src = String(item.sheetSource || '').trim().toUpperCase();
        let itemName = String(item.itemName || '').trim();
        const isGarbagePhrase =
          !itemName ||
          itemName.includes('#') ||
          itemName.includes('=') ||
          itemName.includes('%') ||
          itemName.includes(',') ||
          itemName.includes('█') ||
          itemName.includes('░') ||
          /^\d+$/.test(itemName) ||
          /^\d{4}-\d{2}-\d{2}/.test(itemName) ||
          /^(DASHBOARD|TEAM|WEEKLY|COMPETITION|LIST|AUDIT|LOG|TOTAL|FASTEST|MOST|AVERAGE|OVERDUE|RESPONSIBLE|UTILIZATION|AVAILABLE|CHECKED|STATUS|BREAKDOWN|SUMMARY|SPEED|COUNT|HOURS|DAYS|FORMULA|NOTHING|REPORT|LIVE)/i.test(
            itemName
          );

        if (isGarbagePhrase) {
          itemName = DEFAULT_NAMES[src] || `VEX Component ${rawId}`;
        }

        let notes = String(item.notes || '').trim();
        if (
          notes.includes('█') ||
          notes.includes('░') ||
          notes.includes('#REF!') ||
          notes.includes('#N/A') ||
          notes.includes('#NAME?') ||
          notes.includes('#VALUE!') ||
          notes.includes('=') ||
          notes.length > 150
        ) {
          notes = '';
        }

        let status = String(item.status || '').trim();
        if (status !== 'Available' && status !== 'Checked Out') {
          status = 'Available';
        }

        let currentUser = String(item.currentUser || '').trim();
        if (currentUser && !/^654[A-Z]?$/i.test(currentUser) && currentUser !== 'RECF') {
          if (!/^[A-Z0-9-]{1,10}$/i.test(currentUser) || /^\d{4}-\d{2}/.test(currentUser)) {
            currentUser = '';
          }
        }

        let category = String(item.category || '').trim();
        const catUpper = category.toUpperCase();
        if (catUpper.includes('SOL') || catUpper.includes('PNEU') || rawId.startsWith('VEXSOL')) {
          category = 'Solenoids';
        } else if (catUpper.includes('OPT') || rawId.startsWith('VEXS-O')) {
          category = 'Optical';
        } else if (catUpper.includes('DIST') || rawId.startsWith('VEXS-DIST')) {
          category = 'Distance';
        } else if (catUpper.includes('INER') || rawId.startsWith('VEXS-INER')) {
          category = 'Inertial';
        } else if (catUpper.includes('ROT') || rawId.startsWith('VEXS-ROT')) {
          category = 'Rotational';
        } else if (catUpper.includes('BRAIN') || rawId.startsWith('VEXB')) {
          category = 'Brain';
        } else if (catUpper.includes('RADIO') || rawId.startsWith('VEXR')) {
          category = 'Radio';
        }

        const rawDateOut = item.dateOut !== undefined && item.dateOut !== null ? String(item.dateOut).trim() : '';
        const dateOut = status === 'Checked Out' && rawDateOut ? rawDateOut.split('T')[0] : '';
        const location = item.location !== undefined && item.location !== null ? String(item.location).trim() : '';
        const timesNum = Number(item.timesCheckedOut);
        const timesCheckedOut = Number.isFinite(timesNum) && timesNum >= 0 ? timesNum : 0;

        return {
          ...item,
          itemId: rawId,
          itemName,
          category,
          notes,
          status,
          currentUser,
          dateOut,
          location,
          timesCheckedOut,
        };
      });

      res.json({
        inventory: cleanItems,
        items: cleanItems,
        logs: Array.isArray(parsedData.logs) ? parsedData.logs : [],
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        res.status(504).json({
          error: 'Connection timed out connecting to Google Apps Script. Please verify your internet and script responsiveness.',
        });
        return;
      }
      res.status(500).json({
        error: `Proxy error fetching Google Apps Script: ${err.message || 'Unknown network error'}`,
      });
    }
  });

  // Google Apps Script Proxy POST action endpoint (Check In / Check Out)
  app.post('/api/action', async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { url: rawUrl, ...rawPayload } = body;
    const validated = validateGasProxyUrl(rawUrl);
    if (validated.error || !validated.url) {
      res.status(400).json({ error: validated.error || 'Missing or invalid Google Apps Script Web App URL.' });
      return;
    }

    const action = rawPayload.action === 'Check In' ? 'Check In' : 'Check Out';
    const itemId = String(rawPayload.itemId ?? '').trim();
    if (!itemId) {
      res.status(400).json({ error: 'Missing or invalid hardware Item ID.' });
      return;
    }

    const team = String(rawPayload.team ?? rawPayload.currentUser ?? '').trim();
    const notes = String(rawPayload.notes ?? '').trim();
    const userEmail = String(rawPayload.userEmail ?? rawPayload.email ?? '').trim();
    const category = String(rawPayload.category ?? rawPayload.sensorType ?? '').trim();

    // Coerce numeric part to integer (or empty string if none) to satisfy Google Sheets validations
    let number: number | '' = '';
    if (rawPayload.number !== undefined && rawPayload.number !== null && rawPayload.number !== '') {
      const parsedNum = parseInt(String(rawPayload.number).replace(/\D+/g, ''), 10);
      if (!isNaN(parsedNum)) {
        number = parsedNum;
      }
    }
    if (number === '' && itemId) {
      const trailingMatch = itemId.match(/(\d+)\s*$/) || itemId.match(/\d+/);
      if (trailingMatch) {
        const parsedFromId = parseInt(trailingMatch[1] || trailingMatch[0], 10);
        if (!isNaN(parsedFromId)) {
          number = parsedFromId;
        }
      }
    }

    const payload = {
      action,
      itemId,
      team,
      notes,
      email: userEmail,
      userEmail,
      currentUser: action === 'Check Out' ? team : '',
      category,
      sensorType: category,
      number,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(validated.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const finalUrl = response.url;
      if (
        finalUrl.includes('accounts.google.com') ||
        finalUrl.includes('ServiceLogin')
      ) {
        res.status(403).json({
          error:
            "Permission denied: Google Apps Script requires Google Login. Please set 'Who has access' to 'Anyone' in your Web App deployment settings.",
        });
        return;
      }

      const text = await response.text();
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        if (text.includes('Script function not found') || text.includes('Script error')) {
          res.status(400).json({
            error:
              'Google Apps Script execution error: Verify doPost() is defined in your script and deployed as a Web App.',
          });
          return;
        }
        res.status(400).json({
          error:
            "Google Apps Script returned an HTML page instead of JSON. Ensure 'Who has access' is set to 'Anyone' and redeploy.",
        });
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { status: 'success', raw: text };
      }

      if (parsed && (parsed.status === 'error' || parsed.error)) {
        res.status(422).json({
          error: String(parsed.message || parsed.error || 'Google Apps Script reported an error saving action.'),
          details: parsed,
        });
        return;
      }

      res.json(parsed);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        res.status(504).json({ error: 'Network timeout during Google Sheet action update.' });
        return;
      }
      res.status(500).json({ error: `Failed to post action to Google Sheet: ${err.message}` });
    }
  });

  // Mount Vite or static files
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VEX Inventory Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
