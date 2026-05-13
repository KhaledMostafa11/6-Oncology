import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const auth = requireRole(request, ["Admin"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const { name, type, floor_number, status } = await request.json();

    const result = await pool.query(
      `UPDATE treatment_units
       SET unit_name = COALESCE($1, unit_name),
           unit_type = COALESCE($2, unit_type),
           floor_number = COALESCE($3, floor_number),
           status = COALESCE($4, status)
       WHERE unit_id = $5
       RETURNING unit_id AS id, unit_name AS name, unit_type AS type,
                 floor_number, status`,
      [
        name || null,
        type || null,
        floor_number ? Number(floor_number) : null,
        status || null,
        Number(id),
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Treatment unit not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, treatmentUnit: result.rows[0] });
  } catch (error) {
    console.error("Update treatment unit API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update treatment unit." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = requireRole(request, ["Admin"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const result = await pool.query(
      `UPDATE treatment_units
       SET is_active = FALSE
       WHERE unit_id = $1
       RETURNING unit_id AS id`,
      [Number(id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Treatment unit not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete treatment unit API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not delete treatment unit." },
      { status: 500 }
    );
  }
}
