import initSqlJs, { Database } from "sql.js";

let db: Database | null = null;

export async function initDatabase() {
  const SQL = await initSqlJs({
    // We need to point to the wasm file. In a real build, this needs to be handled carefully.
    // For now, we'll assume it's available or loaded from a CDN for simplicity in this setup,
    // or handled by the build process copying the wasm file.
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  db = new SQL.Database();

  // Create the table if it doesn't exist
  const sqlstr = `
    CREATE TABLE IF NOT EXISTS dictionary (
      word TEXT PRIMARY KEY,
      regular_used INTEGER DEFAULT 1
    );
  `;
  db.run(sqlstr);
  console.log("Smart-Type Database Initialized");
}

export function getSuggestions(input: string): string[] {
  if (!db) return [];

  const stmt = db.prepare(`
    SELECT word 
    FROM dictionary 
    WHERE word LIKE $input 
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
