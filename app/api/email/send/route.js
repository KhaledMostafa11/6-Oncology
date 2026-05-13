import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

const emailConfigured = () =>
  Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const cleanSecret = (value = "") => value.replace(/\s+/g, "");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { patientId, patientEmail, patientName, subject, message } =
      await request.json();

    if (!patientEmail || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Patient email, subject, and message are required." },
        { status: 400 }
      );
    }

    if (!emailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email service is not configured. Add SMTP variables to Railway.",
        },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 465),
      secure: String(process.env.EMAIL_PORT || "465") === "465",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: cleanSecret(process.env.EMAIL_PASS),
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: patientEmail,
      subject,
      text: message,
      html: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
    });

    let communication = null;
    if (patientId) {
      try {
        await pool.query(
          `CREATE TABLE IF NOT EXISTS communications (
            communication_id SERIAL PRIMARY KEY,
            patient_id INT REFERENCES patients(patient_id) ON DELETE SET NULL,
            sender_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
            channel VARCHAR(30) NOT NULL,
            subject VARCHAR(180) NOT NULL,
            body TEXT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'prepared',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`
        );
        const logResult = await pool.query(
          `INSERT INTO communications
            (patient_id, sender_user_id, channel, subject, body, status)
           VALUES ($1, $2, 'email', $3, $4, 'sent')
           RETURNING communication_id AS id`,
          [Number(patientId), Number(auth.user.id), subject, message]
        );
        const communicationResult = await pool.query(
          `SELECT c.communication_id AS id, c.patient_id, c.sender_user_id,
                  c.channel, c.subject, c.body, c.status, c.created_at,
                  CONCAT(u.first_name, ' ', u.last_name) AS sender_name
           FROM communications c
           LEFT JOIN users u ON u.user_id = c.sender_user_id
           WHERE c.communication_id = $1`,
          [logResult.rows?.[0]?.id]
        );
        communication = communicationResult.rows[0] || null;
      } catch (logError) {
        console.warn("Email sent but communication log was not saved.", logError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${patientName || patientEmail}.`,
      communication,
    });
  } catch (error) {
    console.error("Email API error:", error);
    const message =
      error.code === "EAUTH"
        ? "Email login failed. Check EMAIL_USER and Gmail App Password."
        : error.code === "ETIMEDOUT" || error.code === "ESOCKET"
        ? "Email service timed out. Check SMTP host, port, and Railway network settings."
        : "Could not send email right now.";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
