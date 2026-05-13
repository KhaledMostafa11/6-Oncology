import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "patients");

const sanitizeFileName = (name) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);

export async function GET(request) {
  try {
    const auth = requireRole(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    let query;
    const params = [Number(auth.user.id)];

    if (auth.user.role === "Patient") {
      query = `SELECT pu.upload_id AS id,
                       pu.patient_id,
                       pu.file_name AS fileName,
                       pu.file_type AS fileType,
                       pu.file_size AS fileSize,
                       pu.file_path AS filePath,
                       pu.uploaded_at AS uploadedAt,
                       p.full_name AS patientName
                FROM patient_uploads pu
                JOIN patients p ON p.patient_id = pu.patient_id
                WHERE p.user_id = $1
                ORDER BY pu.uploaded_at DESC`;
    } else if (auth.user.role === "Admin") {
      query = `SELECT pu.upload_id AS id,
                       pu.patient_id,
                       pu.file_name AS fileName,
                       pu.file_type AS fileType,
                       pu.file_size AS fileSize,
                       pu.file_path AS filePath,
                       pu.uploaded_at AS uploadedAt,
                       p.full_name AS patientName
                FROM patient_uploads pu
                JOIN patients p ON p.patient_id = pu.patient_id
                ORDER BY pu.uploaded_at DESC`;
    } else {
      query = `SELECT pu.upload_id AS id,
                       pu.patient_id,
                       pu.file_name AS fileName,
                       pu.file_type AS fileType,
                       pu.file_size AS fileSize,
                       pu.file_path AS filePath,
                       pu.uploaded_at AS uploadedAt,
                       p.full_name AS patientName
                FROM patient_uploads pu
                JOIN patients p ON p.patient_id = pu.patient_id
                WHERE pu.patient_id IN (
                  SELECT a.patient_id
                  FROM appointments a
                  JOIN appointment_staff ast ON ast.appointment_id = a.appointment_id
                  WHERE ast.user_id = $1
                )
                ORDER BY pu.uploaded_at DESC`;
    }

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, uploads: result.rows });
  } catch (error) {
    console.error("Patient uploads GET error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load patient uploads." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Patient"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const formData = await request.formData();
    const patientId = Number(formData.get("patientId"));
    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "patientId is required." },
        { status: 400 }
      );
    }

    const patientResult = await pool.query(
      `SELECT patient_id, full_name
       FROM patients
       WHERE patient_id = $1
         AND user_id = $2`,
      [patientId, Number(auth.user.id)]
    );

    if (patientResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Patient record not found or not authorized." },
        { status: 403 }
      );
    }

    const files = formData.getAll("files");
    if (!files.length) {
      return NextResponse.json(
        { success: false, message: "No files were provided." },
        { status: 400 }
      );
    }

    await fs.promises.mkdir(uploadDirectory, { recursive: true });

    const savedUploads = [];
    for (const file of files) {
      if (!file || typeof file === "string") continue;
      const originalName = file.name || "upload";
      const safeName = sanitizeFileName(originalName);
      const fileName = `${patientId}-${Date.now()}-${safeName}`;
      const absolutePath = path.join(uploadDirectory, fileName);
      const fileData = Buffer.from(await file.arrayBuffer());
      await fs.promises.writeFile(absolutePath, fileData);

      const filePath = `/uploads/patients/${fileName}`;
      const result = await pool.query(
        `INSERT INTO patient_uploads
          (patient_id, file_name, file_type, file_size, file_path)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING upload_id AS id,
                   patient_id,
                   file_name AS fileName,
                   file_type AS fileType,
                   file_size AS fileSize,
                   file_path AS filePath,
                   uploaded_at AS uploadedAt`,
        [patientId, originalName, file.type || "application/octet-stream", fileData.length, filePath]
      );

      savedUploads.push({
        ...result.rows[0],
        patientName: patientResult.rows[0].full_name,
      });
    }

    return NextResponse.json({ success: true, uploads: savedUploads });
  } catch (error) {
    console.error("Patient uploads POST error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save patient uploads." },
      { status: 500 }
    );
  }
}
