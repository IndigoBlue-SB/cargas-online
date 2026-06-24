const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BUNDLED_DB_FILE = path.join(ROOT, 'data', 'db.json');
const BUNDLE_DATA_VERSION = '2026-06-23-03';
const sessions = new Map();

const defaultDb = {
  events: [],
  users: [],
  settings: {
    font: 'Arial, Helvetica, sans-serif',
    size: 15,
    buttonSize: 15,
    totalSize: 22,
    brand: '#0f766e',
    buttonBg: '#0f766e',
    navButtonBg: '#2b7bbb',
    navButtonActiveBg: '#0f766e',
    navButtonColor: '#ffffff',
    membreteColor: '#202426',
    eventInfoColor: '#667078',
    eventInfoFont: 'Arial, Helvetica, sans-serif',
    bg: '#f4f6f2',
    panel: '#ffffff',
    splash: '#123f8c',
    side: '#18312d',
    radius: '8px',
    mainLogo: '',
    mainLogoSize: 180,
    eventLogoLeft: '',
    eventLogoRight: '',
    eventLogoLeftSize: 86,
    eventLogoRightSize: 86,
    adminPassword: 'admin123'
  }
};

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const bundledDb = path.resolve(BUNDLED_DB_FILE) !== path.resolve(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)
      ? fs.readFileSync(BUNDLED_DB_FILE, 'utf8')
      : JSON.stringify(defaultDb, null, 2);
    fs.writeFileSync(DB_FILE, bundledDb);
  }
}

function mergeBundledDb(db) {
  if (path.resolve(BUNDLED_DB_FILE) === path.resolve(DB_FILE) || !fs.existsSync(BUNDLED_DB_FILE)) return db;
  if (db._bundleDataVersion === BUNDLE_DATA_VERSION) return db;
  try {
    const bundled = JSON.parse(fs.readFileSync(BUNDLED_DB_FILE, 'utf8'));
    let changed = false;
    const next = {
      ...db,
      events: Array.isArray(db.events) ? db.events : [],
      users: Array.isArray(db.users) ? db.users : [],
      settings: { ...defaultDb.settings, ...(db.settings || {}), ...(bundled.settings || {}) }
    };

    (bundled.users || []).forEach(user => {
      const index = next.users.findIndex(item => (
        String(item.id) === String(user.id) ||
        String(item.name).trim().toLowerCase() === String(user.name).trim().toLowerCase()
      ));
      if (index >= 0) {
        next.users[index] = { ...next.users[index], ...user };
      } else {
        next.users.push(user);
      }
      changed = true;
    });

    (bundled.events || []).forEach(event => {
      const index = next.events.findIndex(item => String(item.id) === String(event.id));
      if (index >= 0) {
        next.events[index] = { ...next.events[index], ...event, sales: next.events[index].sales || event.sales || [] };
      } else {
        next.events.push(event);
      }
      changed = true;
    });

    next._bundleDataVersion = BUNDLE_DATA_VERSION;
    changed = true;
    if (changed) fs.writeFileSync(DB_FILE, JSON.stringify(next, null, 2));
    return next;
  } catch {
    return db;
  }
}

function readDb() {
  ensureDb();
  try {
    return mergeBundledDb({ ...defaultDb, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) });
  } catch {
    return structuredClone(defaultDb);
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const [key, ...value] = part.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25_000_000) reject(new Error('Payload demasiado grande'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getSession(req) {
  const token = parseCookies(req).cargas_session;
  return token ? sessions.get(token) : null;
}

function requireSession(req, res) {
  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Sesion requerida' });
    return null;
  }
  return session;
}

function requireAdmin(req, res) {
  const session = requireSession(req, res);
  if (!session) return null;
  if (session.role !== 'admin') {
    sendJson(res, 403, { error: 'Solo administrador' });
    return null;
  }
  return session;
}

function visibleEventsFor(session, events) {
  if (session.role === 'admin') return events;
  return events.filter(event => {
    const allowedUsers = event.allowedUsers || [];
    return allowedUsers.some(name => (
      String(name).trim().toLowerCase() === String(session.name).trim().toLowerCase()
    ));
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  }[ext] || 'application/octet-stream';
}

function serveStatic(req, res) {
  const rawPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relative = rawPath === '/' ? '/index.html' : rawPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, relative));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType(filePath),
      'Cache-Control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=3600'
    });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const db = readDb();

  if (url.pathname === '/api/login' && req.method === 'POST') {
    const body = await readBody(req);
    const role = body.role;
    const name = String(body.name || '').trim();
    const password = String(body.password || '').trim();
    if (role === 'admin') {
      const adminPassword = String(db.settings?.adminPassword || 'admin123').trim();
      if (password !== adminPassword) {
        return sendJson(res, 401, { error: 'Clave de administrador incorrecta' });
      }
    } else {
      const user = db.users.find(item => (
        String(item.name).trim().toLowerCase() === name.toLowerCase() &&
        String(item.password) === password
      ));
      if (!user) return sendJson(res, 401, { error: 'Usuario o clave incorrectos' });
    }
    const token = crypto.randomUUID();
    const session = { role, name: role === 'admin' ? (name || 'Administrador') : name };
    sessions.set(token, session);
    res.setHeader('Set-Cookie', `cargas_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
    return sendJson(res, 200, { session });
  }

  if (url.pathname === '/api/logout' && req.method === 'POST') {
    const token = parseCookies(req).cargas_session;
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'cargas_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/session' && req.method === 'GET') {
    return sendJson(res, 200, { session: getSession(req) });
  }

  if (url.pathname === '/api/accounts' && req.method === 'GET') {
    return sendJson(res, 200, {
      users: (db.users || []).map(user => ({ id: user.id, name: user.name }))
    });
  }

  const session = requireSession(req, res);
  if (!session) return;

  if (url.pathname === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, {
      events: visibleEventsFor(session, db.events || []),
      users: session.role === 'admin' ? (db.users || []) : [],
      settings: db.settings || defaultDb.settings
    });
  }

  if (url.pathname === '/api/events' && req.method === 'PUT') {
    const body = await readBody(req);
    if (session.role === 'admin') {
      db.events = Array.isArray(body.events) ? body.events : [];
    } else {
      const incoming = Array.isArray(body.events) ? body.events : [];
      const allowedIds = new Set(visibleEventsFor(session, db.events || []).map(event => event.id));
      db.events = (db.events || []).map(event => {
        if (!allowedIds.has(event.id)) return event;
        return incoming.find(item => item.id === event.id) || event;
      });
    }
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/users' && req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    db.users = Array.isArray(body.users) ? body.users : db.users;
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/settings' && req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    db.settings = { ...defaultDb.settings, ...(body.settings || {}) };
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  sendJson(res, 404, { error: 'No encontrado' });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    handleApi(req, res).catch(error => sendJson(res, 500, { error: error.message || 'Error interno' }));
    return;
  }
  serveStatic(req, res);
});

ensureDb();

function startServer(port = PORT, host = process.env.HOST || '0.0.0.0') {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      console.log(`Cargas online en http://${host}:${actualPort}`);
      resolve({ server, port: actualPort });
    });
  });
}

if (require.main === module) {
  startServer().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { startServer };
