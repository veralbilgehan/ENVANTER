import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_DATABASE_RECORDS } from './src/data/initialData';
import { InventoryRecord, User } from './src/types';
import { INITIAL_DEFAULT_USERS } from './src/services/authService';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'kvkk_database.json');

interface ServerDatabaseSchema {
  version: string;
  updatedAt: string;
  users: User[];
  records: InventoryRecord[];
}

function ensureDatabaseFile(): ServerDatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData: ServerDatabaseSchema = {
      version: '2.0',
      updatedAt: new Date().toISOString(),
      users: INITIAL_DEFAULT_USERS,
      records: SAMPLE_DATABASE_RECORDS
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as ServerDatabaseSchema;
    if (!Array.isArray(parsed.users)) parsed.users = INITIAL_DEFAULT_USERS;
    if (!Array.isArray(parsed.records)) parsed.records = SAMPLE_DATABASE_RECORDS;
    return parsed;
  } catch (err) {
    console.error('Error reading server database file, re-initializing:', err);
    const fallback: ServerDatabaseSchema = {
      version: '2.0',
      updatedAt: new Date().toISOString(),
      users: INITIAL_DEFAULT_USERS,
      records: SAMPLE_DATABASE_RECORDS
    };
    return fallback;
  }
}

function writeDatabaseFile(data: ServerDatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Ensure DB exists on startup
  ensureDatabaseFile();

  // ---------------------------------------------------------------------------
  // API 1: Health & Backend Status
  // ---------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    const db = ensureDatabaseFile();
    const companies = new Set<string>();
    db.users.forEach(u => { if (u.companyName) companies.add(u.companyName.trim()); });
    db.records.forEach(r => { if (r.companyName || r.unvan) companies.add((r.companyName || r.unvan).trim()); });

    res.json({
      status: 'ok',
      engine: 'Express + Cloud Firestore + Persistent JSON Storage',
      totalUsers: db.users.length,
      totalCompanies: companies.size,
      totalRecords: db.records.length,
      updatedAt: db.updatedAt
    });
  });

  // ---------------------------------------------------------------------------
  // API 2: Workspaces (People & Companies) Management
  // ---------------------------------------------------------------------------
  app.get('/api/workspaces', (_req, res) => {
    const db = ensureDatabaseFile();
    const safeUsers = db.users.map(({ password, ...rest }) => rest);

    // Group stats per company/person
    const companyStats: Record<string, { companyName: string; recordCount: number; users: string[]; lastUpdated: string }> = {};

    db.users.forEach(u => {
      const comp = (u.companyName || 'Genel Çalışma Alanı').trim();
      if (!companyStats[comp]) {
        companyStats[comp] = {
          companyName: comp,
          recordCount: 0,
          users: [],
          lastUpdated: db.updatedAt
        };
      }
      if (!companyStats[comp].users.includes(u.fullName || u.username)) {
        companyStats[comp].users.push(u.fullName || u.username);
      }
    });

    db.records.forEach(r => {
      const comp = (r.companyName || r.unvan || 'Genel Çalışma Alanı').trim();
      if (!companyStats[comp]) {
        companyStats[comp] = {
          companyName: comp,
          recordCount: 0,
          users: r.ownerUsername ? [r.ownerUsername] : [],
          lastUpdated: r.updatedAt || r.createdAt
        };
      }
      companyStats[comp].recordCount += 1;
      if (r.updatedAt && r.updatedAt > companyStats[comp].lastUpdated) {
        companyStats[comp].lastUpdated = r.updatedAt;
      }
    });

    res.json({
      users: safeUsers,
      workspaces: Object.values(companyStats)
    });
  });

  // Create or register a new person / company workspace
  app.post('/api/workspaces', (req, res) => {
    const { fullName, username, email, password, companyName, role, phone, id } = req.body;
    if (!companyName || !companyName.trim()) {
      res.status(400).json({ error: 'Şirket veya çalışma alanı adı zorunludur.' });
      return;
    }

    const db = ensureDatabaseFile();
    const cleanUsername = (username || fullName || 'yetkili').trim().toLowerCase();
    const cleanCompany = companyName.trim();

    let existingUser = db.users.find(
      u => u.username.toLowerCase() === cleanUsername && u.companyName.toLowerCase() === cleanCompany.toLowerCase()
    );

    if (!existingUser) {
      const newUser: User = {
        id: id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        email: (email || `${cleanUsername}@sirket.com`).trim(),
        fullName: (fullName || cleanUsername).trim(),
        companyName: cleanCompany,
        role: role || 'admin',
        password: password || '123456',
        phone: phone || ''
      };
      db.users.push(newUser);
      writeDatabaseFile(db);
      existingUser = newUser;
    }

    const { password: _p, ...safeUser } = existingUser;
    res.json({ success: true, user: safeUser });
  });

  // Authenticate a person / company workspace
  app.post('/api/auth/login', (req, res) => {
    const { usernameOrEmail, password, targetCompanyName } = req.body;
    const db = ensureDatabaseFile();
    const input = (usernameOrEmail || '').trim().toLowerCase();
    const targetComp = (targetCompanyName || '').trim().toLowerCase();

    const user = db.users.find(
      u => u.username.toLowerCase() === input || u.email.toLowerCase() === input
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
      return;
    }

    if (user.password && password && user.password !== password) {
      res.status(401).json({ success: false, error: 'Girilen şifre hatalı.' });
      return;
    }

    const userComp = user.companyName.trim().toLowerCase();
    if (targetComp && userComp !== targetComp && !userComp.includes(targetComp) && !targetComp.includes(userComp)) {
      res.status(403).json({
        success: false,
        error: `Yetkisiz Şirket Erişimi: "${user.fullName}" yalnızca "${user.companyName}" alanına erişebilir.`
      });
      return;
    }

    const { password: _p, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // ---------------------------------------------------------------------------
  // API 3: Inventory Form Records CRUD
  // ---------------------------------------------------------------------------
  app.get('/api/records', (req, res) => {
    const db = ensureDatabaseFile();
    const companyFilter = typeof req.query.company === 'string' ? req.query.company.trim().toLowerCase() : '';
    const ownerFilter = typeof req.query.owner === 'string' ? req.query.owner.trim().toLowerCase() : '';

    let results = db.records;
    if (companyFilter) {
      results = results.filter(r => {
        const comp = (r.companyName || r.unvan || '').trim().toLowerCase();
        return comp.includes(companyFilter) || companyFilter.includes(comp);
      });
    }
    if (ownerFilter) {
      results = results.filter(r => (r.ownerUsername || '').toLowerCase() === ownerFilter);
    }

    res.json({ records: results, total: results.length });
  });

  app.post('/api/records', (req, res) => {
    const record = req.body as InventoryRecord;
    if (!record || !record.id) {
      res.status(400).json({ error: 'Geçersiz kayıt verisi.' });
      return;
    }

    const db = ensureDatabaseFile();
    const idx = db.records.findIndex(r => r.id === record.id);
    const updatedRecord: InventoryRecord = {
      ...record,
      title: record.unvan ? record.unvan : (record.title || 'İsimsiz Envanter Kaydı'),
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      db.records[idx] = updatedRecord;
    } else {
      db.records.unshift(updatedRecord);
    }

    writeDatabaseFile(db);
    res.json({ success: true, record: updatedRecord });
  });

  app.delete('/api/records/:id', (req, res) => {
    const { id } = req.params;
    const db = ensureDatabaseFile();
    const initialLen = db.records.length;
    db.records = db.records.filter(r => r.id !== id);
    writeDatabaseFile(db);
    res.json({ success: db.records.length < initialLen });
  });

  // Bulk Import / Sync endpoint
  app.post('/api/records/bulk', (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      res.status(400).json({ error: 'Kayıt dizisi gerekli.' });
      return;
    }

    const db = ensureDatabaseFile();
    const map = new Map<string, InventoryRecord>(db.records.map(r => [r.id, r]));
    records.forEach((rec: InventoryRecord) => {
      if (rec && rec.id) {
        map.set(rec.id, rec);
      }
    });

    db.records = Array.from(map.values());
    writeDatabaseFile(db);
    res.json({ success: true, count: records.length, total: db.records.length });
  });

  // Download single record or full database directly from backend as local file attachment
  app.get('/api/records/:id/download', (req, res) => {
    const { id } = req.params;
    const db = ensureDatabaseFile();
    const record = db.records.find(r => r.id === id);
    if (!record) {
      res.status(404).json({ error: 'Kayıt bulunamadı.' });
      return;
    }
    const safeName = (record.unvan || record.title || 'Kayit').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="KVKK_Form_${safeName}_${record.projectCode || id}.json"`);
    res.send(JSON.stringify(record, null, 2));
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KVKK Backend & Database Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
