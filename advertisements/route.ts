import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position");

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    let sql = `
      SELECT *
      FROM advertisements
      WHERE is_active = 1
        AND status = 'active'
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `;

    const params: any[] = [];

    if (position) {
      sql += " AND position = ?";
      params.push(position);
    }

    sql += " ORDER BY priority ASC, created_at DESC";

    const [rows] = await connection.execute(sql, params);

    await connection.end();

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Advertisements API error:", error);
    return NextResponse.json({ error: "Failed to load adverts" }, { status: 500 });
  }
}
