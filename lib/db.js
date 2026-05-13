import { Pool } from "pg";

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

export default pool;
