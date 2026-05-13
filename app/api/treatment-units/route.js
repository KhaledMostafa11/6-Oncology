import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const units = await pool.query(
      `SELECT unit_id AS id, unit_name AS name, unit_type AS type,
              floor_number, status
       FROM treatment_units
       WHERE is_active = TRUE
       ORDER BY unit_id`
    );

    const resources = await pool.query(
      `SELECT resource_id AS id, unit_id, resource_name, resource_type,
              quantity, resource_status
       FROM unit_resources
       ORDER BY resource_id`
    );

    return NextResponse.json({
      success: true,
      treatmentUnits: units.rows,
      resources: resources.rows,
    });
  } catch (error) {
    console.error("Treatment units API error:", error);
    return NextResponse.json(
      { success: false, message: "Treatment units database is not available." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Admin"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { name, type, floor_number } = await request.json();

    if (!name || !type || !floor_number) {
      return NextResponse.json(
        { success: false, message: "Missing treatment unit fields." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO treatment_units (unit_name, unit_type, floor_number, status)
       VALUES ($1, $2, $3, 'available')
       RETURNING unit_id AS id, unit_name AS name, unit_type AS type,
                 floor_number, status`,
      [name, type, Number(floor_number)]
    );

    return NextResponse.json({ success: true, treatmentUnit: result.rows[0] });
  } catch (error) {
    console.error("Create treatment unit API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save treatment unit." },
      { status: 500 }
    );
  }
}
