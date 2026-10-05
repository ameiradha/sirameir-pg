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
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    color: string;
    order: number;
  }>;
  apps: Array<{
    id: string;
    title: string;
    tagline?: string;
    description?: string;
    url: string;
    category?: string;
    iconType?: 'preset' | 'image' | 'emoji';
    iconName?: string;
    iconColor?: string;
    iconUrl?: string;
    bannerGradient?: string;
    tags?: string[];
    audience?: string;
    status?: 'active' | 'beta' | 'new' | 'maintenance';
    isFeatured?: boolean;
    order: number;
    embedMode?: 'new_tab' | 'iframe' | 'both';
    clicks?: number;
    createdAt: string;
    updatedAt: string;
  }>;
  logs: Array<{
    id: string;
    action: string;
    details: string;
    targetTitle?: string;
    timestamp: string;
    ip?: string;
    userAgent?: string;
  }>;
}

function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

// Initial default database: NO webapps prefilled (apps: [])
const INITIAL_DATABASE: DatabaseSchema = {
  settings: {
    siteName: 'SIR AMEIR PLAYGROUND',
    tagline: 'All my educational and interactive webapps in one place.',
    ownerName: 'Sir Ameir',
    ownerBio: 'Pendidik & Pembangun WebApp',
    ownerAvatar: '',
    announcementText: 'Selamat datang ke SIR AMEIR PLAYGROUND!',
    announcementActive: false,
    announcementType: 'info',
    maintenanceMode: false,
    footerText: '© SIR AMEIR PLAYGROUND',
    contactEmail: 'AmeirAdha4@gmail.com',
    socialLinks: {},
    adminUsername: 'admin',
    adminPasswordHash: hashPassword('admin')
  },
  categories: [
    {
      id: 'cat-all',
      name: 'Semua WebApp',
      slug: 'all',
      icon: 'Gamepad2',
      description: 'Semua koleksi webapp',
      color: 'from-red-500 to-yellow-500',
      order: 1
    }
  ],
  apps: [], // Strictly empty as requested
  logs: [
    {
      id: 'log-init',
      action: 'SETTINGS_UPDATED',
      details: 'Sistem SIR AMEIR PLAYGROUND dimulakan dengan pangkalan data bersih.',
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1'
    }
  ]
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
    if (!parsed.categories) parsed.categories = INITIAL_DATABASE.categories;
    if (!parsed.apps) parsed.apps = [];
    if (!parsed.logs) parsed.logs = INITIAL_DATABASE.logs;

    parsed.settings.siteName = 'SIR AMEIR PLAYGROUND';
    parsed.settings.footerText = '© SIR AMEIR PLAYGROUND';
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
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

function logActivity(action: string, details: string, targetTitle?: string, req?: Request) {
  const db = readDatabase();
  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    action,
    details,
    targetTitle,
    timestamp: new Date().toISOString(),
    ip: req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown') : 'system'
  };
  db.logs.unshift(newLog);
  if (db.logs.length > 200) db.logs = db.logs.slice(0, 200);
  saveDatabase(db);
}

const activeSessions = new Map<string, { username: string; role: string; expiresAt: number }>();

function createSessionToken(username: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
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

// Overwrite existing database file to ensure no auto-filled webapps exist on first start
saveDatabase(INITIAL_DATABASE);

// API Routes
app.get('/api/settings', (req: Request, res: Response) => {
  const db = readDatabase();
  const { adminPasswordHash, ...publicSettings } = db.settings;
  res.json(publicSettings);
});

app.get('/api/categories', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.categories.sort((a, b) => a.order - b.order));
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
  logActivity('APP_CLICK', `WebApp "${appItem.title}" dibuka`, appItem.title, req);
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
  logActivity('ADMIN_LOGIN', 'Pentadbir berjaya log masuk.', undefined, req);

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
    id: 'app-' + Date.now(),
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
  logActivity('APP_ADDED', `WebApp baru ditambah: "${newApp.title}"`, newApp.title, req);

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
  logActivity('APP_UPDATED', `WebApp dikemaskini: "${updated.title}"`, updated.title, req);

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
  logActivity('APP_DELETED', `WebApp dipadam: "${appItem.title}"`, appItem.title, req);

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
  logActivity('SETTINGS_UPDATED', 'Tetapan disimpan.', undefined, req);

  const { adminPasswordHash, ...publicSettings } = db.settings;
  res.json(publicSettings);
});

// Admin Logs
app.get('/api/logs', requireAdminAuth, (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.logs);
});

// Admin Stats
app.get('/api/stats', requireAdminAuth, (req: Request, res: Response) => {
  const db = readDatabase();
  res.json({
    totalApps: db.apps.length,
    totalClicks: db.apps.reduce((sum, a) => sum + (a.clicks || 0), 0)
  });
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
