import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT u.user_id AS id,
              u.role,
              CONCAT(u.first_name, ' ', u.last_name) AS name,
              COALESCE(sp.specialization, u.role) AS specialty
       FROM users u
       LEFT JOIN staff_profiles sp ON sp.user_id = u.user_id
       WHERE u.is_active = TRUE
         AND u.role IN ('Oncologist', 'Oncology Nurse')
       ORDER BY u.role, u.user_id`
    );

    return NextResponse.json({ success: true, staff: result.rows });
  } catch (error) {
    console.error("Staff API error:", error);
    return NextResponse.json(
      { success: false, message: "Staff database is not available." },
      { status: 500 }
    );
  }
}
