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

  // Google Apps Script Proxy GET endpoint (bypasses browser CORS & redirect limits)
  app.get('/api/sync', async (req: Request, res: Response) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl || typeof rawUrl !== 'string') {
      res.status(400).json({ error: 'Please provide a valid Google Apps Script Web App URL.' });
      return;
    }

    const url = rawUrl.trim();

    // Check for common URL mistakes
    if (url.includes('docs.google.com/spreadsheets')) {
      res.status(400).json({
        error:
          "You entered the Google Sheet spreadsheet link instead of the Apps Script Web App URL. In your Google Sheet, click Extensions > Apps Script > Deploy > New deployment (or Manage deployments) > Select Web app > set 'Who has access' to 'Anyone' > Copy the URL ending in '/exec'.",
      });
      return;
    }

    if (url.endsWith('/edit') || url.includes('/edit?')) {
      res.status(400).json({
        error:
          "You entered the Apps Script Editor URL (/edit). Please click 'Deploy' (top right) > 'Manage deployments' > Copy the Web App URL that ends in '/exec'.",
      });
      return;
    }

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
        'RADIO',
        'BRAIN',
      ]);

      function isValidVexId(rawId: string): boolean {
        if (!rawId) return false;
        const clean = rawId.trim().toUpperCase().replace(/\s+/g, '');
        return (
          /^VEX(S-(O|DIST|INER|ROT)|SOL|B|R)-\d+$/i.test(clean) ||
          /^VEX-O-\d+$/i.test(clean) ||
          /^VEX(BRN|RAD|SOL)-\d+$/i.test(clean)
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

        return {
          ...item,
          itemId: rawId,
          itemName,
          notes,
          status,
          currentUser,
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
    const { url, ...payload } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid Google Apps Script Web App URL.' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url.trim(), {
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
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { status: 'success', raw: text };
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
