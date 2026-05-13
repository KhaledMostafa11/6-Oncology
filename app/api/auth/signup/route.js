import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstname,
      lastname,
      email,
      password,
      phone,
      age,
      sex,
      bloodType,
      diagnosis,
      city,
      emergencyContact,
    } = body;
    const role = "Patient";
    const department = "Patient Services";

    if (!firstname || !lastname || !email || !password || !phone || !age || !sex) {
      return NextResponse.json(
        { success: false, message: "All required fields must be completed." },
        { status: 400 }
      );
    }

    const departmentResult = await pool.query(
      `INSERT INTO departments (department_name)
       VALUES ($1)
       ON CONFLICT (department_name) DO UPDATE
       SET department_name = EXCLUDED.department_name
       RETURNING department_id`,
      [department]
    );

    const userResult = await pool.query(
      `INSERT INTO users
        (department_id, first_name, last_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id`,
      [
        departmentResult.rows[0].department_id,
        firstname,
        lastname,
        email,
        hashPassword(password),
        role,
        phone,
      ]
    );

    const rsn = `ONC-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO patients
        (user_id, rsn, full_name, phone_no, sex, age, blood_type, diagnosis,
         cancer_stage, next_visit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Review', NULL)`,
      [
        userResult.rows[0].user_id,
        rsn,
        `${firstname} ${lastname}`,
        phone,
        sex,
        Number(age),
        bloodType || null,
        diagnosis ||
          `New patient from ${city || "unspecified city"}; emergency contact: ${
            emergencyContact || "not provided"
          }`,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Patient registration submitted for ${firstname} ${lastname}.`,
    });
  } catch (error) {
    console.error("Signup API error:", error);
    const isDuplicate = error?.code === "23505";
    return NextResponse.json(
      {
        success: false,
        message: isDuplicate
          ? "This email is already registered."
          : "Database registration is not available.",
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
