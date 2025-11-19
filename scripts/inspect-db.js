import fs from "fs";
import initSqlJs from "sql.js";

(async () => {
  try {
    const dbPath = "public/english-dict.sqlite";
    if (!fs.existsSync(dbPath)) {
      console.error("Database not found at", dbPath);
      process.exit(1);
    }

    const buffer = fs.readFileSync(dbPath);
    const SQL = await initSqlJs();
    const db = new SQL.Database(new Uint8Array(buffer));

    const countRes = db.exec("SELECT COUNT(*) AS cnt FROM dictionary");
    const count =
      (countRes[0] &&
        countRes[0].values &&
        countRes[0].values[0] &&
        countRes[0].values[0][0]) ||
      0;
    console.log("Row count:", count);

    // Show first 30 rows by rowid
    const res = db.exec(
      "SELECT rowid, word, regular_used FROM dictionary ORDER BY rowid LIMIT 30"
    );
    if (res && res[0] && res[0].values) {
      console.log("First 30 rows (rowid, word, regular_used):");
      for (const row of res[0].values) {
        console.log(row.map((v) => String(v)).join(" | "));
      }
    } else {
      console.log("No rows returned.");
    }

    // Also sample a few words that might demonstrate issues (e.g. those starting with numbers or punctuation)
    const sample = db.exec(
      "SELECT word FROM dictionary WHERE word LIKE 'a%' ORDER BY word LIMIT 20"
    );
    if (sample && sample[0] && sample[0].values) {
      console.log('\nSample words starting with "a":');
      for (const r of sample[0].values) console.log(r[0]);
    }

    db.close();
  } catch (e) {
    console.error("Error inspecting DB:", e);
    process.exit(1);
  }
})();
