import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

const ensureCommunicationsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS communications (
      communication_id SERIAL PRIMARY KEY,
      patient_id INT REFERENCES patients(patient_id) ON DELETE SET NULL,
      sender_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
      channel VARCHAR(30) NOT NULL CHECK (channel IN ('email', 'portal_message')),
      subject VARCHAR(180) NOT NULL,
      body TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'prepared',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
};

export async function GET(request) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist", "Oncology Nurse", "Patient"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await ensureCommunicationsTable();

    const isPatient = auth.user.role === "Patient";
    const result = await pool.query(
      `SELECT c.communication_id AS id, c.patient_id, c.sender_user_id,
              c.channel, c.subject, c.body, c.status, c.created_at,
              CONCAT(u.first_name, ' ', u.last_name) AS sender_name
       FROM communications c
       LEFT JOIN users u ON u.user_id = c.sender_user_id
       LEFT JOIN patients p ON p.patient_id = c.patient_id
       WHERE ($1::boolean = FALSE OR p.user_id = $2)
       ORDER BY c.created_at DESC`,
      [isPatient, Number(auth.user.id)]
    );

    return NextResponse.json({
      success: true,
      communications: result.rows,
    });
  } catch (error) {
    console.error("Communications API error:", error);
    return NextResponse.json(
      { success: false, message: "Communications database is not available." },
      { status: 500 }
    );
  }
}
