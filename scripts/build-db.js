import fs from "fs";
import initSqlJs from "sql.js";
import path from "path";

const WORDS_FILE = "words.txt";
const OUTPUT_DB = "public/english-dict.sqlite";

async function buildDatabase() {
  console.log("🏗️  Building dictionary database...");

  try {
    // 1. Initialize SQL.js
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // 2. Create the table
    db.run(`
      CREATE TABLE dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT UNIQUE,
        regular_used INTEGER DEFAULT 0
      );
      CREATE INDEX idx_word ON dictionary(word);
      CREATE INDEX idx_usage ON dictionary(regular_used);
    `);

    // 3. Read words.txt
    if (!fs.existsSync(WORDS_FILE)) {
      console.error(`❌ Error: ${WORDS_FILE} not found in root directory.`);
      return;
    }

    const data = fs.readFileSync(WORDS_FILE, "utf8");
    // Split by newlines and filter empty strings
    const words = data.split(/\r?\n/).filter((w) => w.trim().length > 0);

    console.log(`📖 Found ${words.length} words. Inserting...`);

    // 4. Insert words (using a transaction for speed)
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare(
      "INSERT OR IGNORE INTO dictionary (word) VALUES (?)"
    );

    for (const word of words) {
      // Clean the word: remove BOM if present and trim, but preserve original casing
      const cleaned = word.replace(/^\uFEFF/, "").trim();
      if (cleaned.length === 0) continue;
      stmt.run([cleaned]);
    }

    stmt.free();
    db.run("COMMIT");

    // 5. Save the file
    const dataArr = db.export();
    const buffer = Buffer.from(dataArr);

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_DB);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_DB, buffer);
    console.log(`✅ Database saved to ${OUTPUT_DB}`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

buildDatabase();
