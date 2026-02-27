import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query("SELECT 1 + 1 AS result");

    return Response.json({ success: true, result: rows[0] });
  } catch (error) {
    console.error("Database connection error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
