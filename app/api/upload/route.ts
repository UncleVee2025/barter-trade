import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { execute, generateId } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"]

// Upload directories
const UPLOAD_BASE = process.env.UPLOAD_DIR || join(process.cwd(), "public", "uploads")

async function ensureUploadDir(subDir: string): Promise<string> {
  const dir = join(UPLOAD_BASE, subDir)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  return dir
}

async function saveFile(file: File, subDir: string, prefix: string): Promise<string> {
  const dir = await ensureUploadDir(subDir)
  const timestamp = Date.now()
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const filename = `${prefix}-${timestamp}.${extension}`
  const filepath = join(dir, filename)
  
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)
  
  // Return the public URL path
  return `/uploads/${subDir}/${filename}`
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    // Default to "listing" if type not provided (for backward compatibility with listing image uploads)
    const type = (formData.get("type") as string) || "listing"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type based on upload type
    const allowedTypes = type.startsWith("id_") ? ALLOWED_DOC_TYPES : ALLOWED_IMAGE_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    let url: string
    let subDir: string

    switch (type) {
      case "listing":
        subDir = `listings/${auth.userId}`
        url = await saveFile(file, subDir, "listing")
        break
        
      case "avatar":
        subDir = `avatars`
        url = await saveFile(file, subDir, auth.userId)
        
        // Update user avatar in database
        await execute(
          `UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?`,
          [url, auth.userId]
        )
        break
        
      case "id_front":
      case "id_back":
        subDir = `id-documents/${auth.userId}`
        url = await saveFile(file, subDir, type)
        
        // Update user ID document in database
        const column = type === "id_front" ? "national_id_front" : "national_id_back"
        await execute(
          `UPDATE users SET ${column} = ?, updated_at = NOW() WHERE id = ?`,
          [url, auth.userId]
        )
        break
      
      case "advertisement":
        // Admin-only: Upload advertisement images
        if (auth.role !== "admin") {
          return NextResponse.json({ error: "Admin access required for ad uploads" }, { status: 403 })
        }
        subDir = `advertisements`
        url = await saveFile(file, subDir, "ad")
        break
      
      case "receipt":
        // Receipt uploads for top-up requests
        subDir = `receipts/${auth.userId}`
        url = await saveFile(file, subDir, "receipt")
        break
        
      default:
        return NextResponse.json({ error: "Invalid upload type" }, { status: 400 })
    }

    // Log activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, details)
       VALUES (?, ?, 'file_upload', 'upload', ?)`,
      [generateId(), auth.userId, JSON.stringify({ type, filename: file.name, size: file.size })]
    )

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// DELETE - Delete file (optional cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Security: Only allow deleting files in user's own directories
    const allowedPaths = [
      `/uploads/listings/${auth.userId}/`,
      `/uploads/avatars/${auth.userId}`,
      `/uploads/id-documents/${auth.userId}/`,
    ]

    const isAllowed = allowedPaths.some((path) => url.includes(path))
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized to delete this file" }, { status: 403 })
    }

    // Note: In production, implement actual file deletion
    // For cPanel, files are stored in the public/uploads directory

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
