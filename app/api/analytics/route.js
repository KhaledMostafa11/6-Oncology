import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getBearerUser } from "@/lib/auth";

const getDepartmentAnalytics = async () => {
  const result = await pool.query(
    `SELECT
      (SELECT COUNT(*)::int FROM patients WHERE is_active = TRUE) AS "totalPatients",
      (SELECT COUNT(*)::int FROM care_plans WHERE is_current = TRUE) AS "activeTreatments",
      (SELECT COALESCE(SUM(completed_sessions), 0)::int FROM care_plans) AS "completedCycles",
      (SELECT COUNT(*)::int FROM appointments WHERE appointment_date = CURRENT_DATE AND status = 'scheduled') AS "scheduledToday",
      (SELECT COUNT(*)::int FROM appointments WHERE appointment_type = 'follow_up' AND status = 'scheduled') AS "scheduledFollowUps",
      (SELECT COUNT(*)::int FROM users WHERE role <> 'Patient' AND is_active = TRUE) AS "totalClinicians",
      (SELECT COUNT(*)::int FROM treatment_units WHERE status <> 'maintenance' AND is_active = TRUE) AS "activeUnits",
      (SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))::int, 0)
       FROM appointments
       WHERE status <> 'canceled' AND end_time > start_time) AS "avgSessionMinutes"`
  );

  const analytics = result.rows[0];
  const dailyUnitCapacity = analytics.activeUnits * 8;
  const unitUtilization =
    dailyUnitCapacity > 0
      ? Math.min(100, Math.round((analytics.scheduledToday / dailyUnitCapacity) * 100))
      : 0;

  return {
    ...analytics,
    avgSessionTime: `${analytics.avgSessionMinutes} minutes`,
    unitUtilization,
  };
};

const getPatientAnalytics = async (userId) => {
  const result = await pool.query(
    `WITH current_patient AS (
       SELECT patient_id
       FROM patients
       WHERE user_id = $1 AND is_active = TRUE
       LIMIT 1
     )
     SELECT
       COALESCE((SELECT SUM(total_sessions)::int FROM care_plans WHERE patient_id = cp.patient_id AND is_current = TRUE), 0) AS "totalSessions",
       COALESCE((SELECT SUM(completed_sessions)::int FROM care_plans WHERE patient_id = cp.patient_id AND is_current = TRUE), 0) AS "completedCycles",
       COALESCE((SELECT SUM(remaining_sessions)::int FROM care_plans WHERE patient_id = cp.patient_id AND is_current = TRUE), 0) AS "remainingSessions",
       COALESCE((SELECT COUNT(*)::int FROM appointments WHERE patient_id = cp.patient_id AND appointment_type = 'follow_up' AND status = 'scheduled'), 0) AS "scheduledFollowUps",
       COALESCE((SELECT COUNT(DISTINCT user_id)::int FROM patient_care_team WHERE patient_id = cp.patient_id AND (assigned_to IS NULL OR assigned_to >= CURRENT_DATE)), 0) AS "totalClinicians",
       COALESCE((SELECT ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))::int FROM appointments WHERE patient_id = cp.patient_id AND status <> 'canceled' AND end_time > start_time), 0) AS "avgSessionMinutes",
       COALESCE((SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE attendance_status = 'attended') / NULLIF(COUNT(*), 0))::int FROM appointments WHERE patient_id = cp.patient_id AND status <> 'canceled'), 0) AS "onTimeAttendance",
       COALESCE((SELECT TO_CHAR(MIN(appointment_date), 'Mon DD, YYYY') FROM appointments WHERE patient_id = cp.patient_id AND status = 'scheduled' AND appointment_date >= CURRENT_DATE), 'Not scheduled') AS "nextAppointment"
     FROM current_patient cp`,
    [Number(userId)]
  );

  const analytics =
    result.rows[0] || {
      totalSessions: 0,
      completedCycles: 0,
      remainingSessions: 0,
      scheduledFollowUps: 0,
      totalClinicians: 0,
      avgSessionMinutes: 0,
      onTimeAttendance: 0,
      nextAppointment: "Not scheduled",
    };

  const treatmentProgress =
    analytics.totalSessions > 0
      ? Math.round((analytics.completedCycles / analytics.totalSessions) * 100)
      : 0;

  return {
    ...analytics,
    avgSessionTime: `${analytics.avgSessionMinutes} minutes`,
    treatmentProgress,
  };
};

export async function GET(request) {
  try {
    const user = getBearerUser(request);
    const analytics =
      user?.role === "Patient"
        ? await getPatientAnalytics(user.id)
        : await getDepartmentAnalytics();

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { success: false, message: "Analytics database is not available." },
      { status: 500 }
    );
  }
}
