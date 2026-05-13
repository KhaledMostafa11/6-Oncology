const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
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
      }
);

async function main() {
  await pool.query("BEGIN");
  try {
    await pool.query(`
      TRUNCATE TABLE
        google_calendar_connections,
        communications,
        patient_uploads,
        prescriptions,
        appointment_staff,
        appointments,
        unit_resources,
        treatment_units,
        care_plans,
        patient_care_team,
        patients
      RESTART IDENTITY CASCADE
    `);
    await pool.query("COMMIT");
    console.log("Operational data cleared. User accounts and departments were kept.");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error("Failed to clear operational data:");
  console.error(error);
  process.exit(1);
});
