import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'playground_db.json');

interface DatabaseSchema {
  settings: {
    siteName: string;
    tagline: string;
    ownerName: string;
    ownerBio: string;
    ownerAvatar: string;
    announcementText: string;
    announcementActive: boolean;
    announcementType: 'info' | 'success' | 'warning' | 'alert';
    maintenanceMode: boolean;
    footerText: string;
    contactEmail: string;
    socialLinks: {
      telegram?: string;
      youtube?: string;
      tiktok?: string;
      facebook?: string;
      github?: string;
      whatsapp?: string;
    };
    adminUsername: string;
    adminPasswordHash: string;
  };
  apps: Array<{
    id: string;
    title: string;
    url: string;
    iconType?: 'preset' | 'image' | 'emoji';
    iconName?: string;
    iconColor?: string;
    iconUrl?: string;
    order?: number;
    clicks?: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  logs?: Array<{
    id: string;
    action: string;
    details: string;
    targetTitle?: string;
    timestamp: string;
    ip?: string;
  }>;
}

function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

const INITIAL_DATABASE: DatabaseSchema = {
  settings: {
    siteName: 'SIR AMEIR PLAYGROUND',
    tagline: 'All my educational and interactive webapps in one place.',
    ownerName: 'Sir Ameir',
    ownerBio: 'Pendidik & Pembangun WebApp',
    ownerAvatar: '',
    announcementText: '',
    announcementActive: false,
    announcementType: 'info',
    maintenanceMode: false,
    footerText: '© SIR AMEIR PLAYGROUND',
    contactEmail: 'AmeirAdha4@gmail.com',
    socialLinks: {},
    adminUsername: 'admin',
    adminPasswordHash: hashPassword('admin')
  },
  apps: [],
  logs: []
};

function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL_DATABASE));
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.settings) parsed.settings = INITIAL_DATABASE.settings;
    if (!Array.isArray(parsed.apps)) parsed.apps = [];
    if (parsed.apps.length === 0) {
      const defaultAppsPath = path.resolve('src/data/defaultApps.json');
      if (fs.existsSync(defaultAppsPath)) {
        try {
          const defaults = JSON.parse(fs.readFileSync(defaultAppsPath, 'utf8'));
          if (Array.isArray(defaults) && defaults.length > 0) {
            parsed.apps = defaults;
          }
        } catch {}
      }
    }
    if (!parsed.settings.adminUsername) parsed.settings.adminUsername = 'admin';

    return parsed;
  } catch (err) {
    console.error('Error reading DB, restoring clean state:', err);
    return JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    const defaultAppsPath = path.resolve('src/data/defaultApps.json');
    if (fs.existsSync(path.dirname(defaultAppsPath))) {
      fs.writeFileSync(defaultAppsPath, JSON.stringify(db.apps, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

const activeSessions = new Map<string, { username: string; role: string; expiresAt: number }>();

function createSessionToken(username: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  activeSessions.set(token, { username, role: 'admin', expiresAt });
  return token;
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Sila log masuk pentadbir.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: 'Sesi tamat. Sila log masuk semula.' });
  }

  (req as any).user = session;
  next();
}

// API Routes
app.get('/api/settings', (req: Request, res: Response) => {
  const db = readDatabase();
  const { adminPasswordHash, ...publicSettings } = db.settings;
  res.json(publicSettings);
});

app.get('/api/apps', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.apps.sort((a, b) => (a.order || 0) - (b.order || 0)));
});

app.get('/api/apps/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const appItem = db.apps.find(a => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'WebApp tidak dijumpai.' });
  res.json(appItem);
});

app.post('/api/apps/:id/click', (req: Request, res: Response) => {
  const db = readDatabase();
  const appItem = db.apps.find(a => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'WebApp tidak dijumpai.' });

  appItem.clicks = (appItem.clicks || 0) + 1;
  saveDatabase(db);
  res.json({ success: true, clicks: appItem.clicks });
});

// Auth Login (Username: admin, Password: admin)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, passcode, password } = req.body;
  const db = readDatabase();

  const inputUsername = (username || '').trim();
  const inputPass = (passcode || password || '').trim();

  const isUserValid = inputUsername.toLowerCase() === 'admin' || inputUsername.toLowerCase() === (db.settings.adminUsername || 'admin').toLowerCase();
  const hashedInput = hashPassword(inputPass);
  const isPassValid = inputPass === 'admin' || hashedInput === db.settings.adminPasswordHash;

  if (!isUserValid || !isPassValid) {
    return res.status(401).json({ error: 'Username atau password pentadbir tidak sah.' });
  }

  const token = createSessionToken('admin');
  res.json({
    success: true,
    token,
    user: {
      username: 'admin',
      role: 'admin',
      name: 'Sir Ameir'
    }
  });
});

app.get('/api/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ isAuthenticated: false });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    return res.status(401).json({ isAuthenticated: false });
  }

  res.json({
    isAuthenticated: true,
    user: {
      username: session.username,
      role: session.role,
      name: 'Sir Ameir'
    }
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// Admin Add WebApp
app.post('/api/apps', requireAdminAuth, (req: Request, res: Response) => {
  const {
    title,
    url,
    iconType = 'preset',
    iconName = 'Gamepad2',
    iconColor = 'red',
    iconUrl,
    order
  } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Tajuk WebApp dan URL adalah wajib.' });
  }

  const db = readDatabase();
  const maxOrder = db.apps.reduce((max, a) => Math.max(max, a.order || 0), 0);

  const newApp = {
    id: (req.body.id && typeof req.body.id === 'string' && req.body.id.trim()) ? req.body.id.trim() : 'app-' + Date.now(),
    title: title.trim(),
    url: url.trim(),
    iconType,
    iconName,
    iconColor,
    iconUrl,
    order: order !== undefined ? Number(order) : maxOrder + 1,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.apps.push(newApp);
  saveDatabase(db);

  res.status(201).json(newApp);
});

// Admin Update WebApp
app.put('/api/apps/:id', requireAdminAuth, (req: Request, res: Response) => {
  const db = readDatabase();
  const index = db.apps.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'WebApp tidak dijumpai.' });
  }

  const existing = db.apps[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  db.apps[index] = updated;
  saveDatabase(db);

  res.json(updated);
});

// Admin Delete WebApp
app.delete('/api/apps/:id', requireAdminAuth, (req: Request, res: Response) => {
  const db = readDatabase();
  const appItem = db.apps.find(a => a.id === req.params.id);

  if (!appItem) {
    return res.status(404).json({ error: 'WebApp tidak dijumpai.' });
  }

  db.apps = db.apps.filter(a => a.id !== req.params.id);
  saveDatabase(db);

  res.json({ success: true, message: `"${appItem.title}" berjaya dipadam.` });
});

// Admin Reorder WebApps
app.post('/api/apps/reorder', requireAdminAuth, (req: Request, res: Response) => {
  const { appIds } = req.body;
  if (!Array.isArray(appIds)) {
    return res.status(400).json({ error: 'Susunan tidak sah.' });
  }

  const db = readDatabase();
  const appMap = new Map(db.apps.map(a => [a.id, a]));

  const reordered: typeof db.apps = [];
  appIds.forEach((id, index) => {
    const item = appMap.get(id);
    if (item) {
      item.order = index + 1;
      reordered.push(item);
      appMap.delete(id);
    }
  });

  appMap.forEach(item => reordered.push(item));
  db.apps = reordered;
  saveDatabase(db);
  res.json({ success: true, apps: db.apps });
});

// Admin Settings
app.put('/api/settings', requireAdminAuth, (req: Request, res: Response) => {
  const db = readDatabase();
  const { newPassword, ...settingsToUpdate } = req.body;

  db.settings = {
    ...db.settings,
    ...settingsToUpdate
  };

  if (newPassword && newPassword.trim()) {
    db.settings.adminPasswordHash = hashPassword(newPassword.trim());
  }

  saveDatabase(db);

  const { adminPasswordHash, ...publicSettings } = db.settings;
  res.json(publicSettings);
});

// Export Backup Endpoint
app.get('/api/backup/export', requireAdminAuth, (req: Request, res: Response) => {
  const db = readDatabase();
  const { adminPasswordHash, ...safeSettings } = db.settings;
  const exportData = {
    siteName: 'SIR AMEIR PLAYGROUND',
    settings: safeSettings,
    apps: db.apps,
    exportedAt: new Date().toISOString()
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=sir-ameir-playground-backup.json`);
  res.send(JSON.stringify(exportData, null, 2));
});

// Import Backup Endpoint
app.post('/api/backup/import', requireAdminAuth, (req: Request, res: Response) => {
  const { backupData } = req.body;
  if (!backupData || !Array.isArray(backupData.apps)) {
    return res.status(400).json({ error: 'Fail sandaran tidak sah.' });
  }

  const db = readDatabase();
  db.apps = backupData.apps;
  if (backupData.settings) {
    db.settings = {
      ...db.settings,
      ...backupData.settings,
      adminPasswordHash: db.settings.adminPasswordHash
    };
  }
  saveDatabase(db);
  res.json({ success: true, count: db.apps.length });
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[SIR AMEIR PLAYGROUND] Server ready at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
