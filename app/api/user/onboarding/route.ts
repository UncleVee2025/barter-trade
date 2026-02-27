// User Onboarding API - Tracks and manages onboarding progress
import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId } from "@/lib/db"

interface OnboardingStatus {
  id: string
  user_id: string
  personal_details_confirmed: boolean
  profile_picture_uploaded: boolean
  id_document_uploaded: boolean
  interests_selected: boolean
  onboarding_completed: boolean
  selected_interests: string[] | null
  started_at: Date
  completed_at: Date | null
  last_prompt_at: Date | null
}

// GET - Get onboarding status
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if onboarding record exists
    let onboarding = await queryOne<OnboardingStatus>(
      `SELECT * FROM user_onboarding WHERE user_id = ?`,
      [auth.userId]
    )

    // If no record, create one
    if (!onboarding) {
      const onboardingId = generateId()
      await execute(
        `INSERT INTO user_onboarding (id, user_id, started_at) VALUES (?, ?, NOW())`,
        [onboardingId, auth.userId]
      )
      
      onboarding = {
        id: onboardingId,
        user_id: auth.userId,
        personal_details_confirmed: false,
        profile_picture_uploaded: false,
        id_document_uploaded: false,
        interests_selected: false,
        onboarding_completed: false,
        selected_interests: null,
        started_at: new Date(),
        completed_at: null,
        last_prompt_at: null,
      }
    }

    // Get user details for pre-filling
    const user = await queryOne<{
      name: string
      email: string
      phone: string | null
      region: string
      town: string | null
      avatar: string | null
      id_verification_status: string
    }>(
      `SELECT name, email, phone, region, town, avatar, id_verification_status FROM users WHERE id = ?`,
      [auth.userId]
    )

    // Parse selected_interests if it's a string
    let interests: string[] = []
    if (onboarding.selected_interests) {
      try {
        interests = typeof onboarding.selected_interests === 'string'
          ? JSON.parse(onboarding.selected_interests)
          : onboarding.selected_interests
      } catch {
        interests = []
      }
    }

    return NextResponse.json({
      onboarding: {
        personalDetailsConfirmed: Boolean(onboarding.personal_details_confirmed),
        profilePictureUploaded: Boolean(onboarding.profile_picture_uploaded),
        idDocumentUploaded: Boolean(onboarding.id_document_uploaded),
        interestsSelected: Boolean(onboarding.interests_selected),
        onboardingCompleted: Boolean(onboarding.onboarding_completed),
        selectedInterests: interests,
        startedAt: onboarding.started_at,
        completedAt: onboarding.completed_at,
      },
      user: user || null,
      needsOnboarding: !onboarding.onboarding_completed,
    })
  } catch (error) {
    console.error("Onboarding status fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 })
  }
}

// PATCH - Update onboarding progress
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { step, data } = body

    // Ensure onboarding record exists
    let onboarding = await queryOne<{ id: string }>(
      `SELECT id FROM user_onboarding WHERE user_id = ?`,
      [auth.userId]
    )

    if (!onboarding) {
      const onboardingId = generateId()
      await execute(
        `INSERT INTO user_onboarding (id, user_id, started_at) VALUES (?, ?, NOW())`,
        [onboardingId, auth.userId]
      )
      onboarding = { id: onboardingId }
    }

    switch (step) {
      case "personal_details":
        // Update user profile
        if (data.name || data.phone || data.region || data.town) {
          const updates: string[] = []
          const params: (string | null)[] = []

          if (data.name) {
            updates.push("name = ?")
            params.push(data.name)
          }
          if (data.phone) {
            updates.push("phone = ?")
            params.push(data.phone)
          }
          if (data.region) {
            updates.push("region = ?")
            params.push(data.region)
          }
          if (data.town) {
            updates.push("town = ?")
            params.push(data.town)
          }

          if (updates.length > 0) {
            params.push(auth.userId)
            await execute(
              `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
              params
            )
          }
        }

        await execute(
          `UPDATE user_onboarding SET personal_details_confirmed = TRUE, updated_at = NOW() WHERE user_id = ?`,
          [auth.userId]
        )
        break

      case "profile_picture":
        if (data.avatarUrl) {
          await execute(
            `UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?`,
            [data.avatarUrl, auth.userId]
          )
        }
        await execute(
          `UPDATE user_onboarding SET profile_picture_uploaded = TRUE, updated_at = NOW() WHERE user_id = ?`,
          [auth.userId]
        )
        break

      case "id_document":
        if (data.frontImage && data.backImage) {
          // Create ID verification request
          const verificationId = generateId()
          await execute(
            `INSERT INTO id_verification_requests (id, user_id, national_id_front, national_id_back, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [verificationId, auth.userId, data.frontImage, data.backImage]
          )

          // Update user's ID verification status
          await execute(
            `UPDATE users SET 
              national_id_front = ?,
              national_id_back = ?,
              id_verification_status = 'pending',
              updated_at = NOW()
            WHERE id = ?`,
            [data.frontImage, data.backImage, auth.userId]
          )
        }
        await execute(
          `UPDATE user_onboarding SET id_document_uploaded = TRUE, updated_at = NOW() WHERE user_id = ?`,
          [auth.userId]
        )
        break

      case "interests":
        if (data.interests && Array.isArray(data.interests)) {
          await execute(
            `UPDATE user_onboarding SET 
              interests_selected = TRUE,
              selected_interests = ?,
              updated_at = NOW()
            WHERE user_id = ?`,
            [JSON.stringify(data.interests), auth.userId]
          )
        }
        break

      case "complete":
        await execute(
          `UPDATE user_onboarding SET 
            onboarding_completed = TRUE,
            completed_at = NOW(),
            updated_at = NOW()
          WHERE user_id = ?`,
          [auth.userId]
        )

        // Create welcome notification
        await execute(
          `INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
           VALUES (?, ?, 'system', ?, ?, FALSE, NOW())`,
          [
            generateId(),
            auth.userId,
            "Welcome to Barter Trade Namibia!",
            "Congratulations on completing your profile setup. You're now ready to start trading! Browse listings, create your own, and connect with traders across Namibia."
          ]
        )
        break

      case "skip_id":
        // Mark ID step as acknowledged but skipped
        await execute(
          `UPDATE user_onboarding SET id_document_uploaded = FALSE, updated_at = NOW() WHERE user_id = ?`,
          [auth.userId]
        )
        break

      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Step "${step}" completed successfully`,
    })
  } catch (error) {
    console.error("Onboarding update error:", error)
    return NextResponse.json({ error: "Failed to update onboarding progress" }, { status: 500 })
  }
}

// POST - Reset or prompt onboarding
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "prompt") {
      // Update last_prompt_at to track when user was last reminded
      await execute(
        `UPDATE user_onboarding SET last_prompt_at = NOW(), updated_at = NOW() WHERE user_id = ?`,
        [auth.userId]
      )
      return NextResponse.json({ success: true, message: "Prompt recorded" })
    }

    if (action === "reset") {
      await execute(
        `UPDATE user_onboarding SET 
          personal_details_confirmed = FALSE,
          profile_picture_uploaded = FALSE,
          id_document_uploaded = FALSE,
          interests_selected = FALSE,
          onboarding_completed = FALSE,
          selected_interests = NULL,
          completed_at = NULL,
          updated_at = NOW()
        WHERE user_id = ?`,
        [auth.userId]
      )
      return NextResponse.json({ success: true, message: "Onboarding reset" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Onboarding action error:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
