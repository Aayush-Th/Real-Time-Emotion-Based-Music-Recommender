// import initSqlJs from 'sql.js';

// const STORAGE_KEY = 'moodtunes_sql_db_v1';
// const TRACK_LIMIT = 25;

// let SQL;
// let db;

// const toBase64 = (buffer) => {
//   const bytes = new Uint8Array(buffer);
//   const chunkSize = 0x8000;
//   let binary = '';
//   for (let i = 0; i < bytes.length; i += chunkSize) {
//     const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
//     binary += String.fromCharCode(...chunk);
//   }
//   return btoa(binary);
// };

// const fromBase64 = (base64) => {
//   const raw = atob(base64);
//   const bytes = new Uint8Array(raw.length);
//   for (let i = 0; i < raw.length; i += 1) {
//     bytes[i] = raw.charCodeAt(i);
//   }
//   return bytes;
// };

// const persistDatabase = () => {
//   if (!db) return;
//   const data = db.export();
//   const payload = toBase64(data);
//   localStorage.setItem(STORAGE_KEY, payload);
// };

// const ensureDb = async () => {
//   if (db) return db;
//   SQL = await initSqlJs({
//     locateFile: (file) => `${process.env.PUBLIC_URL || ''}/sql-wasm.wasm`,
//   });
//   const saved = localStorage.getItem(STORAGE_KEY);
//   db = saved ? new SQL.Database(fromBase64(saved)) : new SQL.Database();
//   db.run(`
//     CREATE TABLE IF NOT EXISTS sessions (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       email TEXT,
//       name TEXT,
//       mood TEXT,
//       region TEXT,
//       language TEXT,
//       detected_emotion TEXT,
//       confidence REAL,
//       tracks TEXT,
//       created_at TEXT
//     );
//   `);
//   return db;
// };

// export const logSession = async ({
//   email,
//   name,
//   mood,
//   region,
//   language,
//   detectedEmotion,
//   confidence,
//   tracks,
// }) => {
//   const database = await ensureDb();
//   const stmt = database.prepare(`
//     INSERT INTO sessions (
//       email,
//       name,
//       mood,
//       region,
//       language,
//       detected_emotion,
//       confidence,
//       tracks,
//       created_at
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
//   `);
//   const now = new Date().toISOString();
//   stmt.bind([
//     email || null,
//     name || null,
//     mood || null,
//     region || null,
//     language || null,
//     detectedEmotion || null,
//     confidence ?? null,
//     JSON.stringify((tracks || []).slice(0, TRACK_LIMIT)),
//     now,
//   ]);
//   stmt.step();
//   stmt.free();
//   persistDatabase();
// };

// export const getSessions = async (limit = 5) => {
//   const database = await ensureDb();
//   const stmt = database.prepare(`
//     SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?;
//   `);
//   stmt.bind([limit]);
//   const rows = [];
//   while (stmt.step()) {
//     const row = stmt.getAsObject();
//     try {
//       row.tracks = JSON.parse(row.tracks || '[]');
//     } catch (error) {
//       row.tracks = [];
//     }
//     rows.push(row);
//   }
//   stmt.free();
//   return rows;
// };

