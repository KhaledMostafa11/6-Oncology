import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");

    const result = await pool.query(
      `SELECT care_plan_id AS id, patient_id, treatment_goal AS "treatmentGoal",
              active_protocol AS "activeProtocol", treatment_type AS "treatmentType",
              treatment_frequency AS "treatmentFrequency",
              total_sessions AS "totalSessions",
              completed_sessions AS "completedSessions",
              remaining_sessions AS "remainingSessions",
              next_treatment_at AS "nextTreatment",
              lab_monitoring AS "labMonitoring",
              supportive_care AS "supportiveCare",
              care_instructions AS notes,
              is_current
       FROM care_plans
       WHERE ($1::int IS NULL OR patient_id = $1::int)
       ORDER BY is_current DESC, care_plan_id DESC`,
      [patientId ? Number(patientId) : null]
    );

    return NextResponse.json({ success: true, carePlans: result.rows });
  } catch (error) {
    console.error("Care plans API error:", error);
    return NextResponse.json(
      { success: false, message: "Care plans are not available." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const {
      patient_id,
      treatmentGoal,
      activeProtocol,
      treatmentType,
      treatmentFrequency,
      totalSessions,
      completedSessions,
      nextTreatment,
      labMonitoring,
      supportiveCare,
      notes,
    } = body;

    if (!patient_id || !activeProtocol) {
      return NextResponse.json(
        { success: false, message: "Patient and protocol are required." },
        { status: 400 }
      );
    }

    const total = Number(totalSessions || 0);
    const completed = Number(completedSessions || 0);

    const result = await pool.query(
      `INSERT INTO care_plans
        (patient_id, treatment_goal, active_protocol, treatment_type,
         treatment_frequency, total_sessions, completed_sessions,
         remaining_sessions, next_treatment_at, lab_monitoring,
         supportive_care, care_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, GREATEST($6 - $7, 0), $8, $9, $10, $11)
       RETURNING care_plan_id AS id, patient_id, treatment_goal AS "treatmentGoal",
                 active_protocol AS "activeProtocol", treatment_type AS "treatmentType",
                 treatment_frequency AS "treatmentFrequency",
                 total_sessions AS "totalSessions",
                 completed_sessions AS "completedSessions",
                 remaining_sessions AS "remainingSessions",
                 next_treatment_at AS "nextTreatment",
                 lab_monitoring AS "labMonitoring",
                 supportive_care AS "supportiveCare",
                 care_instructions AS notes`,
      [
        Number(patient_id),
        treatmentGoal || null,
        activeProtocol,
        treatmentType || null,
        treatmentFrequency || null,
        total,
        completed,
        nextTreatment || null,
        labMonitoring || null,
        supportiveCare || null,
        notes || null,
      ]
    );

    return NextResponse.json({ success: true, carePlan: result.rows[0] });
  } catch (error) {
    console.error("Create care plan API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save care plan." },
      { status: 500 }
    );
  }
}
