const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const RAILWAY_VOLUME_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const DATA_DIR = process.env.DATA_DIR || (RAILWAY_VOLUME_DIR ? path.join(RAILWAY_VOLUME_DIR, 'cargas-online') : path.join(ROOT, 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BUNDLED_DB_FILE = path.join(ROOT, 'data', 'db.json');
const BUNDLE_DATA_VERSION = '2026-06-23-03';
const sessions = new Map();
const defaultFunctionPermissions = { home: [], create: [], stats: [], delete: [], events: [], bingo: [], raffle: [], virtual: [], sheets: [], balance: [], accounting: [], settings: [] };
const BINGO_SERIES_SIZE = 6;
const BINGO_COLUMN_RANGES = [
  { start: 1, end: 9 },
  { start: 10, end: 19 },
  { start: 20, end: 29 },
  { start: 30, end: 39 },
  { start: 40, end: 49 },
  { start: 50, end: 59 },
  { start: 60, end: 69 },
  { start: 70, end: 79 },
  { start: 80, end: 90 }
];

const defaultDb = {
  events: [],
  users: [],
  settings: {
    font: 'Arial, Helvetica, sans-serif',
    size: 15,
    buttonSize: 15,
    totalSize: 22,
    accountingFontSize: 14,
    eventFormLabelSize: 13,
    eventFormInputSize: 14,
    eventSalesTableSize: 12,
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
    adminPassword: 'admin123',
    recoveryPassword: '',
    functionPermissions: defaultFunctionPermissions,
    balanceTemplates: { prizesList: null, expenses: null }
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
    if (changed) writeDb(next);
    return next;
  } catch {
    return db;
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8').replace(/^\uFEFF/, '');
    return ensureRecoveryPassword(mergeBundledDb({ ...defaultDb, ...JSON.parse(raw) }));
  } catch {
    const backupFile = `${DB_FILE}.bak`;
    if (fs.existsSync(backupFile)) {
      try {
        const raw = fs.readFileSync(backupFile, 'utf8').replace(/^\uFEFF/, '');
        const restored = { ...defaultDb, ...JSON.parse(raw) };
        writeDb(restored);
        return ensureRecoveryPassword(mergeBundledDb(restored));
      } catch {
        return ensureRecoveryPassword(structuredClone(defaultDb));
      }
    }
    return ensureRecoveryPassword(structuredClone(defaultDb));
  }
}

function ensureRecoveryPassword(db) {
  db.settings = { ...defaultDb.settings, ...(db.settings || {}) };
  if (!String(db.settings.recoveryPassword || '').trim()) {
    db.settings.recoveryPassword = `REC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    writeDb(db);
  }
  return db;
}

function writeDb(db) {
  ensureDb();
  const body = JSON.stringify({ ...db, savedAt: new Date().toISOString() }, null, 2);
  const tempFile = `${DB_FILE}.${process.pid}.tmp`;
  if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, `${DB_FILE}.bak`);
  fs.writeFileSync(tempFile, body);
  fs.renameSync(tempFile, DB_FILE);
}

function readDbFile(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  return { ...defaultDb, ...JSON.parse(raw) };
}

function eventMatches(event, { id, name }) {
  if (!event) return false;
  if (id && String(event.id) === String(id)) return true;
  const cleanName = normalize(name);
  if (!cleanName) return false;
  return normalize(event.name).includes(cleanName) || cleanName.includes(normalize(event.name));
}

function rangeCount(item) {
  const desde = Number(item?.desde) || 0;
  const hasta = Number(item?.hasta) || 0;
  return hasta >= desde ? hasta - desde + 1 : 0;
}

function salesSummary(sales = []) {
  const list = Array.isArray(sales) ? sales : [];
  const sellers = new Set(list.map(sale => String(sale.seller || '').trim()).filter(Boolean));
  const batches = new Set(list.map(sale => String(sale.batchId || sale.id || '').trim()).filter(Boolean));
  return {
    rows: list.length,
    loads: batches.size || list.length,
    sellers: sellers.size,
    units: list.reduce((total, sale) => total + rangeCount(sale), 0),
    sellerNames: [...sellers].sort((a, b) => a.localeCompare(b, 'es')).slice(0, 20)
  };
}

function shouldBackupSales(previousSales = [], nextSales = []) {
  const previous = salesSummary(previousSales);
  const next = salesSummary(nextSales);
  if (!previous.rows) return false;
  return (
    next.rows < previous.rows
    || next.loads < previous.loads
    || next.sellers < previous.sellers
    || next.units < previous.units
  );
}

function appendSalesBackup(event, sales, { by = 'Sistema', reason = 'auto' } = {}) {
  if (!event || !Array.isArray(sales) || !sales.length) return event;
  const backups = Array.isArray(event.deletedSalesBackups) ? event.deletedSalesBackups : [];
  return {
    ...event,
    deletedSalesBackups: [...backups, {
      id: crypto.randomUUID(),
      deletedAt: new Date().toISOString(),
      deletedBy: by,
      reason,
      summary: salesSummary(sales),
      sales: JSON.parse(JSON.stringify(sales))
    }].slice(-30)
  };
}

function restoreCandidatesFromEvent(event) {
  if (!event) return [];
  const candidates = [];
  const pushCandidate = (source, sales, extra = {}) => {
    if (!Array.isArray(sales) || !sales.length) return;
    candidates.push({ source, sales, summary: salesSummary(sales), ...extra });
  };
  pushCandidate('event.sales', event.sales || []);
  pushCandidate('event.bingoClosure.snapshotSales', event.bingoClosure?.snapshotSales || []);
  (Array.isArray(event.bingoClosureHistory) ? event.bingoClosureHistory : []).forEach((entry, index) => {
    pushCandidate(`event.bingoClosureHistory.${index}`, entry.snapshotSales || [], { confirmedAt: entry.confirmedAt || '' });
  });
  (Array.isArray(event.deletedSalesBackups) ? event.deletedSalesBackups : []).forEach((entry, index) => {
    pushCandidate(`event.deletedSalesBackups.${index}`, entry.sales || [], { deletedAt: entry.deletedAt || '' });
  });
  return candidates.sort((a, b) => (
    (b.summary.sellers - a.summary.sellers)
    || (b.summary.loads - a.summary.loads)
    || (b.summary.rows - a.summary.rows)
    || (b.summary.units - a.summary.units)
  ));
}

function storageInfo(db) {
  const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID);
  const events = Array.isArray(db.events) ? db.events : [];
  return {
    isRailway,
    usingRailwayVolume: Boolean(RAILWAY_VOLUME_DIR),
    usingCustomDataDir: Boolean(process.env.DATA_DIR),
    eventCount: events.length,
    salesCount: events.reduce((total, event) => total + (Array.isArray(event.sales) ? event.sales.length : 0), 0),
    dbUpdatedAt: db.savedAt || null
  };
}

function numberRange(start, end) {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}

function shuffleValues(values, random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function weightedPick(candidates, weights, random) {
  const total = candidates.reduce((sum, column) => sum + weights[column], 0);
  let pick = random() * total;
  for (const column of candidates) {
    pick -= weights[column];
    if (pick <= 0) return column;
  }
  return candidates.at(-1);
}

function createSeededRandom(seedText) {
  let seed = 2166136261;
  for (const character of String(seedText || '')) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeriesPattern(random) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const columnQuotas = BINGO_COLUMN_RANGES.map(({ start, end }) => end - start + 1);
    const rows = [];
    let failed = false;

    for (let rowIndex = 0; rowIndex < 18; rowIndex += 1) {
      const row = Array(9).fill(false);
      const rowsLeftAfter = 17 - rowIndex;
      const requiredColumns = numberRange(0, 8).filter(column => columnQuotas[column] > rowsLeftAfter);

      if (requiredColumns.length > 5) {
        failed = true;
        break;
      }

      requiredColumns.forEach(column => {
        row[column] = true;
        columnQuotas[column] -= 1;
      });

      while (row.filter(Boolean).length < 5) {
        const candidates = numberRange(0, 8).filter(column => !row[column] && columnQuotas[column] > 0);
        if (!candidates.length) {
          failed = true;
          break;
        }
        const column = weightedPick(candidates, columnQuotas, random);
        row[column] = true;
        columnQuotas[column] -= 1;
      }

      if (failed) break;
      rows.push(row);
    }

    if (!failed && columnQuotas.every(quota => quota === 0)) return rows;
  }

  return Array.from({ length: 18 }, (_, rowIndex) => {
    const row = Array(9).fill(false);
    for (let offset = 0; offset < 5; offset += 1) row[(rowIndex * 5 + offset) % 9] = true;
    return row;
  });
}

function createBingoSeriesCards(eventSeed, seriesNumber) {
  const random = createSeededRandom(`${eventSeed}:series:${seriesNumber}:v0`);
  const pattern = createSeriesPattern(random);
  const columns = BINGO_COLUMN_RANGES.map(({ start, end }) => shuffleValues(numberRange(start, end), random));
  const firstCardNumber = ((Number(seriesNumber) || 1) - 1) * BINGO_SERIES_SIZE + 1;
  return numberRange(0, BINGO_SERIES_SIZE - 1).map(cardIndex => {
    const rows = numberRange(0, 2).map(rowIndex => {
      const sourceRow = pattern[cardIndex * 3 + rowIndex];
      return sourceRow.map((hasNumber, column) => (hasNumber ? columns[column].shift() : null));
    });
    return {
      series: Number(seriesNumber),
      cardNumber: firstCardNumber + cardIndex,
      rows
    };
  });
}

function pdfEscape(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, ' ');
}

function pdfNumber(value) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
}

function pdfText(text, x, y, size = 10, font = 'F1') {
  return `0 0 0 rg BT /${font} ${pdfNumber(size)} Tf ${pdfNumber(x)} ${pdfNumber(y)} Td (${pdfEscape(text)}) Tj ET\n`;
}

function pdfTextRight(text, rightX, y, size = 10, font = 'F1') {
  const estimatedWidth = String(text ?? '').length * size * 0.52;
  return pdfText(text, rightX - estimatedWidth, y, size, font);
}

function pdfTextCenter(text, centerX, y, size = 10, font = 'F1') {
  const estimatedWidth = String(text ?? '').length * size * 0.52;
  return pdfText(text, centerX - estimatedWidth / 2, y, size, font);
}

function pdfRect(x, y, width, height, mode = 'S') {
  return `${pdfNumber(x)} ${pdfNumber(y)} ${pdfNumber(width)} ${pdfNumber(height)} re ${mode}\n`;
}

function pdfRoundedRect(x, y, width, height, radius, mode = 'S') {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (!r) return pdfRect(x, y, width, height, mode);
  const c = r * 0.5522847498;
  return [
    `${pdfNumber(x + r)} ${pdfNumber(y)} m`,
    `${pdfNumber(x + width - r)} ${pdfNumber(y)} l`,
    `${pdfNumber(x + width - r + c)} ${pdfNumber(y)} ${pdfNumber(x + width)} ${pdfNumber(y + r - c)} ${pdfNumber(x + width)} ${pdfNumber(y + r)} c`,
    `${pdfNumber(x + width)} ${pdfNumber(y + height - r)} l`,
    `${pdfNumber(x + width)} ${pdfNumber(y + height - r + c)} ${pdfNumber(x + width - r + c)} ${pdfNumber(y + height)} ${pdfNumber(x + width - r)} ${pdfNumber(y + height)} c`,
    `${pdfNumber(x + r)} ${pdfNumber(y + height)} l`,
    `${pdfNumber(x + r - c)} ${pdfNumber(y + height)} ${pdfNumber(x)} ${pdfNumber(y + height - r + c)} ${pdfNumber(x)} ${pdfNumber(y + height - r)} c`,
    `${pdfNumber(x)} ${pdfNumber(y + r)} l`,
    `${pdfNumber(x)} ${pdfNumber(y + r - c)} ${pdfNumber(x + r - c)} ${pdfNumber(y)} ${pdfNumber(x + r)} ${pdfNumber(y)} c`,
    `${mode}`
  ].join('\n') + '\n';
}

function parseDataImage(value) {
  const match = String(value || '').match(/^data:(image\/jpe?g);base64,(.+)$/i);
  if (!match) return null;
  const buffer = Buffer.from(match[2], 'base64');
  const size = jpegSize(buffer);
  if (!size) return null;
  return { type: 'jpeg', buffer, width: size.width, height: size.height, components: size.components || 3 };
}

function jpegSize(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
        components: buffer[offset + 9]
      };
    }
    offset += 2 + length;
  }
  return null;
}

function pdfImageFill(imageName, x, y, width, height) {
  return `q ${pdfNumber(width)} 0 0 ${pdfNumber(height)} ${pdfNumber(x)} ${pdfNumber(y)} cm /${imageName} Do Q\n`;
}

function pdfImageCover(imageName, image, x, y, width, height) {
  if (!image?.width || !image?.height) return pdfImageFill(imageName, x, y, width, height);
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let drawW = width;
  let drawH = height;
  let drawX = x;
  let drawY = y;
  if (imageRatio > boxRatio) {
    drawW = height * imageRatio;
    drawX = x - ((drawW - width) / 2);
  } else {
    drawH = width / imageRatio;
    drawY = y - ((drawH - height) / 2);
  }
  return `q ${pdfNumber(drawW)} 0 0 ${pdfNumber(drawH)} ${pdfNumber(drawX)} ${pdfNumber(drawY)} cm /${imageName} Do Q\n`;
}

function slugifyFileName(value) {
  return String(value || 'cartones-bingo-90')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase() || 'cartones-bingo-90';
}

function buildPdf(objects, rootId) {
  const header = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary');
  const chunks = [header];
  const offsets = [0];
  let offset = header.length;
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = offset;
    const body = Buffer.isBuffer(objects[index]) ? objects[index] : Buffer.from(String(objects[index]), 'binary');
    const prefix = Buffer.from(`${index} 0 obj\n`, 'binary');
    const suffix = Buffer.from('\nendobj\n', 'binary');
    chunks.push(prefix, body, suffix);
    offset += prefix.length + body.length + suffix.length;
  }
  const xrefOffset = offset;
  const xrefRows = ['xref', `0 ${objects.length}`, '0000000000 65535 f '];
  for (let index = 1; index < objects.length; index += 1) {
    xrefRows.push(`${String(offsets[index]).padStart(10, '0')} 00000 n `);
  }
  const trailer = `${xrefRows.join('\n')}\ntrailer\n<< /Size ${objects.length} /Root ${rootId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(trailer, 'binary'));
  return Buffer.concat(chunks);
}

function createPdfBuilder() {
  const objects = [null];
  const reserve = () => {
    objects.push('');
    return objects.length - 1;
  };
  const set = (id, body) => { objects[id] = body; };
  return { objects, reserve, set };
}

function stripPdfPageSize(design = {}) {
  const sizes = {
    a4: { width: 595.28, height: 841.89 },
    a5: { width: 419.53, height: 595.28 },
    legal: { width: 612, height: 1008 }
  };
  const base = sizes[String(design.paperSize || 'a4').toLowerCase()] || sizes.a4;
  return design.orientation === 'portrait' ? base : { width: base.height, height: base.width };
}

function drawBingoCard(card, x, y, width, height, fontSize) {
  const cellW = width / 9;
  const headerH = Math.min(13, height * 0.16);
  const gridH = height - headerH;
  const cellH = gridH / 3;
  let out = '';
  out += '0.85 0.05 0.12 RG 1.1 w\n';
  out += pdfRoundedRect(x, y, width, height, 4.5);
  out += pdfTextRight(`Carton N° ${card.cardNumber}`, x + width - 4, y + height - 10, Math.max(6, fontSize * 0.45), 'F2');
  out += '0.05 0.05 0.05 RG 0.45 w\n';
  card.rows.forEach((row, rowIndex) => {
    row.forEach((number, column) => {
      const cellX = x + column * cellW;
      const cellY = y + gridH - ((rowIndex + 1) * cellH);
      out += pdfRect(cellX, cellY, cellW, cellH);
      if (number) {
        out += pdfTextCenter(number, cellX + cellW / 2, cellY + cellH * 0.28, fontSize, 'F2');
      }
    });
  });
  return out;
}

function drawSeriesStrip({ eventName, eventDetail, seriesLabel, seriesNumber, cards, x, y, width, height, fontSize, seriesFontSize, headerHeight, rowGap, hasPageBackground }) {
  const gap = 6;
  const paddingX = 7;
  const paddingBottom = 8;
  const headerH = Math.max(26, Math.min(height * 0.32, Number(headerHeight) || height * 0.1));
  const cardAreaH = height - headerH - paddingBottom;
  const cardW = width - paddingX * 2;
  const cardGap = Math.max(3, Math.min(14, Number(rowGap) || gap));
  const cardH = (cardAreaH - cardGap * 5) / 6;
  let out = '';
  out += '0 0 0 RG 0.7 w\n';
  out += pdfTextCenter(`${seriesLabel || 'Serie N°'} ${seriesNumber}`, x + width / 2, y + height - headerH + 8, Math.max(9, seriesFontSize), 'F2');
  if (!hasPageBackground) {
    out += pdfTextCenter(eventName, x + width / 2, y + height - 24, Math.max(11, fontSize + 1), 'F2');
    if (eventDetail) out += pdfTextCenter(eventDetail, x + width / 2, y + height - 39, Math.max(7, fontSize * 0.58), 'F1');
  }
  cards.forEach((card, index) => {
    const cardX = x + paddingX;
    const cardY = y + paddingBottom + cardAreaH - ((index + 1) * cardH) - index * cardGap;
    out += drawBingoCard(card, cardX, cardY, cardW, cardH, Math.max(8, fontSize));
  });
  return out;
}

function drawBingoCardKit(doc, card, x, y, width, height, options = {}) {
  const fontSize = Math.max(8, Number(options.fontSize) || 12);
  const accent = options.accentColor || '#d1223b';
  const numberColor = options.numberColor || '#111827';
  const cellBorder = options.cellBorderColor || '#111827';
  const cellBg = options.cellBgEnabled ? (options.cellBgColor || '#ffffff') : null;
  const smallGap = Math.max(1, Math.min(5, Number(options.smallGap) || 2));
  const padX = Math.max(2, Math.min(8, Number(options.padX) || 5));
  const padY = Math.max(1, Math.min(6, Number(options.padY) || 3));
  const headerH = Math.max(8, Math.min(15, Number(options.headerHeight) || 12));
  const configuredCell = Math.max(10, Math.min(42, Number(options.cellSize) || 18));
  const availableCellW = (width - padX * 2 - smallGap * 8) / 9;
  const availableCellH = (height - headerH - padY * 2 - smallGap * 2) / 3;
  const cellSize = Math.max(8, Math.min(configuredCell, availableCellW, availableCellH));
  const gridW = cellSize * 9 + smallGap * 8;
  const gridH = cellSize * 3 + smallGap * 2;
  const gridX = x + (width - gridW) / 2;
  const gridY = y + headerH + padY;
  const radius = options.cellShape === 'circle'
    ? cellSize / 2
    : options.cellShape === 'rounded'
      ? Math.min(6, cellSize / 3)
      : 0;

  doc.lineWidth(1.1).strokeColor(accent).roundedRect(x, y, width, height, 4.5).stroke();
  doc.font('Helvetica-Bold')
    .fontSize(Math.max(6, fontSize * 0.45))
    .fillColor(numberColor)
    .text(`Carton N° ${card.cardNumber}`, x + 2, y + 2, { width: width - 5, align: 'right', lineBreak: false });

  doc.lineWidth(0.45).strokeColor(cellBorder);
  card.rows.forEach((row, rowIndex) => {
    row.forEach((number, column) => {
      const cellX = gridX + column * (cellSize + smallGap);
      const cellY = gridY + rowIndex * (cellSize + smallGap);
      if (cellBg) {
        doc.fillColor(cellBg).roundedRect(cellX, cellY, cellSize, cellSize, radius).fill();
      }
      doc.strokeColor(cellBorder).roundedRect(cellX, cellY, cellSize, cellSize, radius).stroke();
      if (number) {
        const textSize = Math.min(fontSize, cellSize * 0.82);
        doc.font('Helvetica-Bold')
          .fontSize(textSize)
          .fillColor(numberColor)
          .text(String(number), cellX, cellY + (cellSize - textSize) * 0.42, {
            width: cellSize,
            height: cellSize,
            align: 'center',
            lineBreak: false
          });
      }
    });
  });
}

function drawSeriesStripKit(doc, { eventName, eventDetail, seriesLabel, seriesNumber, cards, x, y, width, height, design, hasPageBackground }) {
  const fontSize = Math.max(8, Math.min(28, Number(design.fontSize) || 15));
  const seriesFontSize = Math.max(9, Math.min(34, Number(design.seriesFontSize) || 13));
  const headerH = Math.max(26, Math.min(height * 0.32, (Number(design.headerHeight) || 68) * 0.75));
  const paddingX = 7;
  const paddingBottom = 8;
  const cardGap = Math.max(3, Math.min(14, Number(design.rowGap) || 6));
  const smallGap = 2;
  const cardScale = Math.max(0.6, Math.min(1.6, (Number(design.cardScale) || 100) / 100));
  const cellSize = Math.max(10, Math.min(42, Number(design.cellSize) || 18));
  const cardPadX = 5;
  const cardPadY = 3;
  const cardHeaderH = 12;
  const naturalCardW = (cellSize * 9 + smallGap * 8 + cardPadX * 2) * cardScale;
  const naturalCardH = cardHeaderH + cardPadY * 2 + cellSize * 3 + smallGap * 2;
  const cardAreaH = height - headerH - paddingBottom;
  const cardW = Math.min(width - paddingX * 2, naturalCardW);
  const maxCardH = (cardAreaH - cardGap * 5) / 6;
  const cardH = Math.min(maxCardH, naturalCardH);
  const cardsHeight = cardH * cards.length + cardGap * Math.max(0, cards.length - 1);
  const cardsStartY = y + headerH + Math.max(0, (cardAreaH - cardsHeight) / 2);

  doc.font('Helvetica-Bold')
    .fontSize(seriesFontSize)
    .fillColor(design.seriesColor || '#111827')
    .text(`${seriesLabel || 'Serie N°'} ${seriesNumber}`, x, y + headerH - seriesFontSize - 2, {
      width,
      align: 'center',
      lineBreak: false
    });

  if (!hasPageBackground) {
    doc.font('Helvetica-Bold')
      .fontSize(Math.max(11, fontSize + 1))
      .fillColor('#111827')
      .text(eventName, x, y + 18, { width, align: 'center', lineBreak: false });
    if (eventDetail) {
      doc.font('Helvetica')
        .fontSize(Math.max(7, fontSize * 0.58))
        .fillColor('#374151')
        .text(eventDetail, x, y + 34, { width, align: 'center', lineBreak: false });
    }
  }

  cards.forEach((card, index) => {
    const cardX = x + (width - cardW) / 2;
    const cardY = cardsStartY + index * (cardH + cardGap);
    drawBingoCardKit(doc, card, cardX, cardY, cardW, cardH, {
      fontSize,
      accentColor: design.accentColor,
      numberColor: design.numberColor,
      cellBorderColor: design.cellBorderColor,
      cellBgEnabled: design.cellBgEnabled,
      cellBgColor: design.cellBgColor,
      cellSize,
      cellShape: design.cellShape,
      smallGap,
      padX: cardPadX,
      padY: cardPadY,
      headerHeight: cardHeaderH
    });
  });
}

function drawCoverImageKit(doc, image, pageWidth, pageHeight) {
  if (!image) return;
  const imageRatio = image.width / image.height;
  const boxRatio = pageWidth / pageHeight;
  let drawW = pageWidth;
  let drawH = pageHeight;
  let drawX = 0;
  let drawY = 0;
  if (imageRatio > boxRatio) {
    drawW = pageHeight * imageRatio;
    drawX = -((drawW - pageWidth) / 2);
  } else {
    drawH = pageWidth / imageRatio;
    drawY = -((drawH - pageHeight) / 2);
  }
  doc.image(image, drawX, drawY, { width: drawW, height: drawH });
}

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

async function buildSeriesPdf({ event, from, to, stripDesignOverride = null }) {
  const panel = event.bingoPanelSettings || {};
  const design = { ...(panel.stripDesign || {}), ...(stripDesignOverride || {}) };
  const eventSeed = panel.eventSeed || event.bingoSeed || event.id;
  const eventName = panel.name || event.name || 'Cartones Bingo 90';
  const eventDetail = panel.eventDetail || [event.date, event.town, event.province].filter(Boolean).join(' - ');
  const seriesLabel = design.seriesLabel || 'Serie N°';
  const itemsPerPage = Math.max(1, Math.min(6, Number(design.itemsPerPage) || 1));
  const columns = Math.max(1, Math.min(itemsPerPage, Number(design.columns) || 1));
  const orderMode = design.orderMode || (columns > 1 ? 'columnar' : 'consecutive');
  const rowsPerPage = Math.ceil(itemsPerPage / columns);
  const page = stripPdfPageSize(design);
  const margin = 18;
  const gap = 12;
  const stripW = (page.width - margin * 2 - gap * (columns - 1)) / columns;
  const stripH = (page.height - margin * 2 - gap * (rowsPerPage - 1)) / rowsPerPage;
  const series = numberRange(from, to);
  const pageCount = Math.max(1, Math.ceil(series.length / itemsPerPage));
  const backgroundImage = parseDataImage(design.backgroundImageData);
  const doc = new PDFDocument({
    autoFirstPage: false,
    compress: true,
    info: { Title: eventName, Creator: 'Cargas Online' },
    bufferPages: false
  });
  const bufferPromise = collectPdfBuffer(doc);
  const backgroundPdfImage = backgroundImage ? doc.openImage(backgroundImage.buffer) : null;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    doc.addPage({ size: [page.width, page.height], margin: 0 });
    doc.rect(0, 0, page.width, page.height).fill(design.backgroundColor || '#ffffff');
    if (backgroundPdfImage) drawCoverImageKit(doc, backgroundPdfImage, page.width, page.height);
    const pageSeries = orderMode === 'columnar'
      ? numberRange(0, itemsPerPage - 1).map(columnIndex => series[pageIndex + (columnIndex * pageCount)]).filter(value => value !== undefined)
      : series.slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage);
    pageSeries.forEach((seriesNumber, position) => {
      const col = position % columns;
      const row = Math.floor(position / columns);
      const x = margin + col * (stripW + gap);
      const y = margin + row * (stripH + gap);
      drawSeriesStripKit(doc, {
        eventName,
        eventDetail,
        seriesLabel,
        seriesNumber,
        cards: createBingoSeriesCards(eventSeed, seriesNumber),
        x,
        y,
        width: stripW,
        height: stripH,
        design,
        hasPageBackground: Boolean(backgroundPdfImage)
      });
    });
  }

  doc.end();
  return {
    fileName: `${slugifyFileName(eventName)}-series-${from}-${to}.pdf`,
    buffer: await bufferPromise
  };
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

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeFunctionPermissions(value) {
  const permissions = Object.fromEntries(Object.keys(defaultFunctionPermissions).map(page => [page, []]));
  Object.keys(permissions).forEach(page => {
    permissions[page] = Array.isArray(value?.[page]) ? value[page].filter(Boolean) : [];
  });
  return permissions;
}

function hasFunctionPermission(session, settings, page) {
  if (session?.role === 'admin') return true;
  const permissions = normalizeFunctionPermissions(settings?.functionPermissions);
  return (permissions[page] || []).map(normalize).includes(normalize(session?.name));
}

function visibleEventsFor(session, events) {
  if (session.role === 'admin') return events;
  return events.filter(event => {
    if (event?.deletedAt) return false;
    const allowedUsers = event.allowedUsers || [];
    return allowedUsers.some(name => (
      normalize(name) === normalize(session.name)
    ));
  });
}

function isBingoLoadConfirmed(event) {
  return event?.bingoClosure?.status === 'confirmed';
}

function publicVirtualSheet(db, token) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) return null;
  for (const event of db.events || []) {
    if (event?.deletedAt) continue;
    const sheet = (event.virtualSheets || []).find(item => String(item.token) === cleanToken);
    if (sheet) return { event, sheet };
  }
  return null;
}

function protectConfirmedEvent(existing, incoming, session) {
  if (session.role === 'admin' || !isBingoLoadConfirmed(existing)) return incoming;
  return {
    ...incoming,
    sales: Array.isArray(existing.sales) ? existing.sales : [],
    bingoSeed: existing.bingoSeed,
    bingoClosure: existing.bingoClosure
  };
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

  const virtualMatch = url.pathname.match(/^\/api\/virtual\/([^/]+)$/);
  if (virtualMatch && req.method === 'GET') {
    const found = publicVirtualSheet(db, virtualMatch[1]);
    if (!found) return sendJson(res, 404, { error: 'Planilla virtual no encontrada' });
    const { event, sheet } = found;
    return sendJson(res, 200, {
      sheet: {
        id: sheet.id,
        token: sheet.token,
        status: sheet.status || 'open',
        seller: sheet.seller || '',
        phone: sheet.phone || '',
        sheetFrom: Number(sheet.sheetFrom) || 0,
        sheetTo: Number(sheet.sheetTo) || 0,
        seriesPerSheet: Number(sheet.seriesPerSheet) || 10,
        validDate: sheet.validDate || event.date || '',
        desde: Number(sheet.desde) || 0,
        hasta: Number(sheet.hasta) || 0,
        town: sheet.town || event.town || '',
        province: sheet.province || event.province || '',
        entries: Array.isArray(sheet.entries) ? [...sheet.entries].sort((a, b) => Number(a.series) - Number(b.series)) : [],
        importedAt: sheet.importedAt || null
      },
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        town: event.town,
        province: event.province,
        price: Number(event.price) || 0,
        bingoSeed: event.bingoSeed || event.id,
        bingoPanelSettings: event.bingoPanelSettings || null
      }
    });
  }

  if (virtualMatch && req.method === 'PUT') {
    const found = publicVirtualSheet(db, virtualMatch[1]);
    if (!found) return sendJson(res, 404, { error: 'Planilla virtual no encontrada' });
    const body = await readBody(req);
    const { sheet } = found;
    if ((sheet.status || 'open') !== 'open') return sendJson(res, 409, { error: 'Esta planilla ya esta cerrada.' });
    const desde = Number(sheet.desde) || 0;
    const hasta = Number(sheet.hasta) || 0;
    const entries = Array.isArray(body.entries) ? body.entries : [];
    sheet.entries = entries.map(entry => {
      const series = Number(entry.series) || 0;
      return {
        id: String(entry.id || crypto.randomUUID()),
        series,
        buyer: String(entry.buyer || '').trim(),
        phone: String(entry.phone || '').trim(),
        payment: ['Efectivo', 'Transferencia', 'Pendiente'].includes(entry.payment) ? entry.payment : 'Pendiente',
        notes: String(entry.notes || '').trim(),
        createdAt: Number(entry.createdAt) || Date.now()
      };
    }).filter(entry => entry.series >= desde && entry.series <= hasta)
      .sort((a, b) => Number(a.series) - Number(b.series));
    sheet.updatedAt = new Date().toISOString();
    writeDb(db);
    return sendJson(res, 200, { ok: true, entries: sheet.entries });
  }

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

  if (url.pathname === '/api/recover-admin' && req.method === 'POST') {
    const body = await readBody(req);
    const recoveryPassword = String(body.recoveryPassword || '').trim();
    const newAdminPassword = String(body.newAdminPassword || '').trim();
    const savedRecoveryPassword = String(db.settings?.recoveryPassword || '').trim();
    if (!savedRecoveryPassword || recoveryPassword !== savedRecoveryPassword) {
      return sendJson(res, 401, { error: 'Clave de recuperacion incorrecta' });
    }
    if (!newAdminPassword) {
      return sendJson(res, 400, { error: 'La nueva clave no puede quedar vacia' });
    }
    db.settings = { ...defaultDb.settings, ...(db.settings || {}), adminPassword: newAdminPassword };
    writeDb(db);
    return sendJson(res, 200, { ok: true });
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
      users: hasFunctionPermission(session, db.settings, 'settings') ? (db.users || []) : [],
      settings: db.settings || defaultDb.settings,
      storage: storageInfo(db)
    });
  }

  if (url.pathname === '/api/bingo/confirmed' && req.method === 'GET') {
    const confirmedEvents = visibleEventsFor(session, db.events || [])
      .filter(event => !event?.deletedAt)
      .filter(isBingoLoadConfirmed)
      .map(event => ({
        id: event.id,
        name: event.name,
        date: event.date,
        town: event.town,
        province: event.province,
        bingoSeed: event.bingoSeed,
        closure: event.bingoClosure
      }));
    return sendJson(res, 200, { events: confirmedEvents });
  }

  if (url.pathname === '/api/export-strip-pdf' && (req.method === 'GET' || req.method === 'POST')) {
    const body = req.method === 'POST' ? await readBody(req) : {};
    const eventId = String(body.eventId || url.searchParams.get('eventId') || '');
    const event = visibleEventsFor(session, db.events || []).find(item => String(item.id) === eventId && !item?.deletedAt);
    if (!event) return sendJson(res, 404, { error: 'Evento no encontrado' });
    const panel = event.bingoPanelSettings || {};
    const rangeStart = Math.max(1, Number(panel.rangeStart) || 1);
    const rangeEnd = Math.max(rangeStart, Number(panel.rangeEnd) || Number(panel.configuredSeriesCount) || rangeStart);
    const requestedFrom = Number(body.from || url.searchParams.get('from')) || rangeStart;
    const requestedTo = Number(body.to || url.searchParams.get('to')) || rangeEnd;
    const from = Math.max(rangeStart, Math.min(requestedFrom, requestedTo));
    const to = Math.min(rangeEnd, Math.max(requestedFrom, requestedTo));
    if (to < from) return sendJson(res, 400, { error: 'Rango invalido' });
    const count = to - from + 1;
    if (count > 25000) return sendJson(res, 400, { error: 'El rango es demasiado grande para un solo PDF. Exporta menos series por vez.' });
    const stripDesignOverride = body.stripDesign && typeof body.stripDesign === 'object' ? body.stripDesign : null;
    const { fileName, buffer } = await buildSeriesPdf({ event, from, to, stripDesignOverride });
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store'
    });
    return res.end(buffer);
  }

  if (url.pathname === '/api/admin/backup-inspect' && req.method === 'GET') {
    if (session.role !== 'admin') return sendJson(res, 403, { error: 'Solo administrador' });
    const query = { id: url.searchParams.get('eventId') || '', name: url.searchParams.get('name') || '' };
    const backupFile = `${DB_FILE}.bak`;
    const currentEvent = (db.events || []).find(event => eventMatches(event, query));
    let backupEvent = null;
    let backupError = '';
    if (fs.existsSync(backupFile)) {
      try {
        const backupDb = readDbFile(backupFile);
        backupEvent = (backupDb.events || []).find(event => eventMatches(event, query));
      } catch (error) {
        backupError = error.message || 'No se pudo leer el backup';
      }
    }
    return sendJson(res, 200, {
      backupExists: fs.existsSync(backupFile),
      backupError,
      current: currentEvent ? {
        id: currentEvent.id,
        name: currentEvent.name,
        date: currentEvent.date,
        candidates: restoreCandidatesFromEvent(currentEvent).map(item => ({ source: item.source, summary: item.summary, confirmedAt: item.confirmedAt || '', deletedAt: item.deletedAt || '' }))
      } : null,
      backup: backupEvent ? {
        id: backupEvent.id,
        name: backupEvent.name,
        date: backupEvent.date,
        candidates: restoreCandidatesFromEvent(backupEvent).map(item => ({ source: item.source, summary: item.summary, confirmedAt: item.confirmedAt || '', deletedAt: item.deletedAt || '' }))
      } : null
    });
  }

  if (url.pathname === '/api/admin/restore-sales-backup' && req.method === 'POST') {
    if (session.role !== 'admin') return sendJson(res, 403, { error: 'Solo administrador' });
    const body = await readBody(req);
    const query = { id: body.eventId || '', name: body.name || '' };
    const currentIndex = (db.events || []).findIndex(event => eventMatches(event, query));
    if (currentIndex < 0) return sendJson(res, 404, { error: 'Evento actual no encontrado' });
    const backupFile = `${DB_FILE}.bak`;
    const sourceEvents = [{ label: 'current', event: db.events[currentIndex] }];
    if (fs.existsSync(backupFile)) {
      try {
        const backupDb = readDbFile(backupFile);
        const backupEvent = (backupDb.events || []).find(event => eventMatches(event, query));
        if (backupEvent) sourceEvents.push({ label: 'backup', event: backupEvent });
      } catch {}
    }
    const candidates = sourceEvents.flatMap(entry => restoreCandidatesFromEvent(entry.event).map(candidate => ({ ...candidate, sourceDb: entry.label })));
    if (!candidates.length) return sendJson(res, 404, { error: 'No se encontraron ventas para restaurar' });
    const selectedSource = String(body.source || '').trim();
    const selected = selectedSource
      ? candidates.find(candidate => `${candidate.sourceDb}:${candidate.source}` === selectedSource)
      : candidates[0];
    if (!selected) return sendJson(res, 404, { error: 'Origen de restauracion no encontrado' });
    const target = db.events[currentIndex];
    target.deletedSalesBackups = Array.isArray(target.deletedSalesBackups) ? target.deletedSalesBackups : [];
    if (Array.isArray(target.sales) && target.sales.length) {
      target.deletedSalesBackups.push({
        id: crypto.randomUUID(),
        deletedAt: new Date().toISOString(),
        deletedBy: session.name || 'Administrador',
        reason: 'pre-restore',
        sales: target.sales
      });
    }
    target.sales = JSON.parse(JSON.stringify(selected.sales));
    target.bingoClosure = {
      ...(target.bingoClosure || {}),
      status: 'open',
      restoredAt: new Date().toISOString(),
      restoredBy: session.name || 'Administrador'
    };
    delete target.bingoClosure.activeLoadClearedAt;
    delete target.bingoClosure.activeLoadClearedBy;
    writeDb(db);
    return sendJson(res, 200, {
      ok: true,
      restoredFrom: `${selected.sourceDb}:${selected.source}`,
      summary: selected.summary
    });
  }

  if (url.pathname === '/api/events' && req.method === 'PUT') {
    const body = await readBody(req);
    if (session.role === 'admin') {
      const incomingEvents = Array.isArray(body.events) ? body.events : [];
      const previousById = new Map((db.events || []).map(event => [String(event.id), event]));
      db.events = incomingEvents.map(event => {
        const previous = previousById.get(String(event.id));
        if (!previous) return event;
        if (shouldBackupSales(previous.sales || [], event.sales || [])) {
          return appendSalesBackup(event, previous.sales || [], { by: session.name || 'Administrador', reason: 'auto-before-replace' });
        }
        return event;
      });
    } else {
      const incoming = Array.isArray(body.events) ? body.events : [];
      const incomingById = new Map(incoming.map(event => [event.id, event]));
      const allowedIds = new Set(visibleEventsFor(session, db.events || []).map(event => event.id));
      const canCreate = hasFunctionPermission(session, db.settings, 'create');
      const canDelete = hasFunctionPermission(session, db.settings, 'delete');
      const currentIds = new Set((db.events || []).map(event => event.id));
      db.events = (db.events || []).map(event => {
        if (!allowedIds.has(event.id)) return event;
        if (incomingById.has(event.id)) return protectConfirmedEvent(event, incomingById.get(event.id), session);
        return canDelete ? null : event;
      }).filter(Boolean);
      if (canCreate) {
        incoming.forEach(event => {
          if (!event?.id || currentIds.has(event.id)) return;
          const allowedUsers = Array.isArray(event.allowedUsers) ? event.allowedUsers : [];
          if (!allowedUsers.map(normalize).includes(normalize(session.name))) allowedUsers.push(session.name);
          db.events.push({ ...event, allowedUsers, sales: Array.isArray(event.sales) ? event.sales : [] });
        });
      }
    }
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/bingo-panel' && req.method === 'PUT') {
    const body = await readBody(req);
    const eventId = String(body.eventId || '');
    const eventIndex = (db.events || []).findIndex(event => String(event.id) === eventId);
    if (eventIndex < 0) return sendJson(res, 404, { error: 'Evento no encontrado' });
    const event = db.events[eventIndex];
    const canAccess = session.role === 'admin' || visibleEventsFor(session, [event]).length > 0;
    if (!canAccess) return sendJson(res, 403, { error: 'Sin permiso para este evento' });
    const panel = body.panel && typeof body.panel === 'object' ? body.panel : {};
    db.events[eventIndex] = {
      ...event,
      bingoPanelSettings: {
        ...panel,
        savedAt: new Date().toISOString(),
        savedBy: session.name || (session.role === 'admin' ? 'Administrador' : 'Usuario')
      }
    };
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/users' && req.method === 'PUT') {
    if (!hasFunctionPermission(session, db.settings, 'settings')) return sendJson(res, 403, { error: 'Sin permiso para configuraciones' });
    const body = await readBody(req);
    db.users = Array.isArray(body.users) ? body.users : db.users;
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/settings' && req.method === 'PUT') {
    if (!hasFunctionPermission(session, db.settings, 'settings')) return sendJson(res, 403, { error: 'Sin permiso para configuraciones' });
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
