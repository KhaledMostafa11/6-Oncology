import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash,
              u.role, COALESCE(d.department_name, 'General Oncology Department') AS department
       FROM users u
       LEFT JOIN departments d ON d.department_id = u.department_id
       WHERE u.email = $1 AND u.is_active = TRUE
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const tokenUser = {
      id: user.user_id,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    return NextResponse.json({
      success: true,
      token: signToken(tokenUser),
      user: {
        _id: String(user.user_id),
        firstname: user.first_name,
        lastname: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Database login is not available." },
      { status: 500 }
    );
  }
}
