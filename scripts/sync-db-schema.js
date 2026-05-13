const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const sqlFile = path.join(__dirname, "..", "db.sql");
const sqlText = fs.readFileSync(sqlFile, "utf8");

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.PGSSLMODE === "disable"
          ? false
          : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "oncology_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    };

const pool = new Pool(connectionConfig);

const parseCreateTableDefinitions = (text) => {
  const tableDefs = [];
  const regex = /CREATE TABLE IF NOT EXISTS\s+([\w_]+)\s*\(([^;]+?)\);/gims;
  let match;

  while ((match = regex.exec(text))) {
    const tableName = match[1].trim();
    const body = match[2].trim();
    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("--"));

    const columns = [];
    for (let line of lines) {
      if (line.endsWith(",")) {
        line = line.slice(0, -1).trim();
      }

      if (!line) continue;
      const skipPrefixes = [
        "CONSTRAINT",
        "PRIMARY KEY",
        "UNIQUE",
        "CHECK",
        "FOREIGN KEY",
        "EXCLUDE",
      ];
      if (skipPrefixes.some((prefix) => line.toUpperCase().startsWith(prefix))) {
        continue;
      }

      columns.push(line);
    }

    tableDefs.push({ tableName, columns });
  }

  return tableDefs;
};

const run = async () => {
  const client = await pool.connect();
  try {
    console.log("Starting schema sync from db.sql...");
    await client.query("BEGIN");

    const statements = sqlText
      .split(/;\s*\n/)
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      console.log("Applying statement:", statement.split("\n")[0]);
      await client.query(statement);
    }

    const tableDefs = parseCreateTableDefinitions(sqlText);
    for (const { tableName, columns } of tableDefs) {
      for (const columnDefinition of columns) {
        const columnName = columnDefinition.split(/\s+/)[0];
        if (!columnName) continue;
        const alterSql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnDefinition};`;
        console.log(`Ensuring column: ${tableName}.${columnName}`);
        await client.query(alterSql);
      }
    }

    await client.query("COMMIT");
    console.log("Schema sync complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Schema sync failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
