import initSqlJs, { Database } from "sql.js";

let db: Database | null = null;

export async function initDatabase() {
  // Resolve paths relative to this module. In the built plugin the JS lives in
  // `dist/assets/` while runtime assets were copied to `dist/`, so we point to
  // the parent folder (`..`) from the assets bundle.
  const wasmUrl = new URL(`../sql-wasm.wasm`, import.meta.url).toString();
  const sqliteUrl = new URL(
    `../english-dict.sqlite`,
    import.meta.url
  ).toString();

  const SQL = await initSqlJs({
    // Ignore the `file` argument and return the explicit wasm URL so sql.js
    // always fetches the shipped `sql-wasm.wasm` from the dist root.
    locateFile: () => wasmUrl,
  });

  // Load the database from the dist root (works when code is bundled to dist/assets)
  try {
    console.log("Fetching sqlite from", sqliteUrl);
    const response = await fetch(sqliteUrl);
    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
    console.log("Smart-Type Database Loaded from english-dict.sqlite");
  } catch (e) {
    console.error("Failed to load database, creating new one", e);
    db = new SQL.Database();
    // Create the table if it doesn't exist (fallback)
    const sqlstr = `
      CREATE TABLE IF NOT EXISTS dictionary (
        word TEXT PRIMARY KEY,
        regular_used INTEGER DEFAULT 1
      );
    `;
    db.run(sqlstr);
  }
}

export function getSuggestions(input: string): string[] {
  if (!db) return [];

  const stmt = db.prepare(`
    SELECT word 
    FROM dictionary 
    WHERE word LIKE $input COLLATE NOCASE
    ORDER BY regular_used DESC, word ASC 
    LIMIT 5
  `);

  const result: string[] = [];
  stmt.bind({ $input: `${input}%` });

  while (stmt.step()) {
    const row = stmt.getAsObject();
    result.push(row.word as string);
  }
  stmt.free();
  return result;
}

export function learnWord(word: string) {
  if (!db) return;

  // Upsert logic: insert or increment count
  const stmt = db.prepare(`
    INSERT INTO dictionary (word, regular_used) VALUES ($word, 1)
    ON CONFLICT(word) DO UPDATE SET regular_used = regular_used + 1
  `);
  stmt.run({ $word: word });
  stmt.free();
}
