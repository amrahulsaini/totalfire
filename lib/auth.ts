import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";

// Middleware helper to verify admin
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      username: string;
    };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [decoded.id]
    );
    if (rows.length === 0 || rows[0].role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

// Middleware helper to verify any logged-in user
export async function verifyUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      username: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export { verifyAdmin };
