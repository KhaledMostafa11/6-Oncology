import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const auth = requireRole(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const uploadId = Number(params.id);
    if (!uploadId) {
      return NextResponse.json(
        { success: false, message: "Upload ID is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT pu.file_data, pu.file_type, pu.patient_id, p.user_id AS patient_user_id,
              EXISTS(
                SELECT 1
                FROM appointments a
                JOIN appointment_staff ast ON ast.appointment_id = a.appointment_id
                WHERE a.patient_id = pu.patient_id
                  AND ast.user_id = $1
              ) AS has_access
       FROM patient_uploads pu
       JOIN patients p ON p.patient_id = pu.patient_id
       WHERE pu.upload_id = $2`,
      [Number(auth.user.id), uploadId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Upload not found." },
        { status: 404 }
      );
    }

    const upload = result.rows[0];
    if (auth.user.role === "Patient" && upload.patient_user_id !== Number(auth.user.id)) {
      return NextResponse.json(
        { success: false, message: "You do not have permission to view this upload." },
        { status: 403 }
      );
    }

    if (auth.user.role !== "Admin" && auth.user.role !== "Patient" && !upload.has_access) {
      return NextResponse.json(
        { success: false, message: "You do not have permission to view this upload." },
        { status: 403 }
      );
    }

    if (!upload.file_data) {
      return NextResponse.json(
        { success: false, message: "Upload binary data is not available." },
        { status: 404 }
      );
    }

    return new Response(upload.file_data, {
      status: 200,
      headers: {
        "Content-Type": upload.file_type || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Patient upload binary GET error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load upload data." },
      { status: 500 }
    );
  }
}
