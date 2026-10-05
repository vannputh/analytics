import { checkUserApprovalByEmail } from "@analytics/data"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return Response.json(
        {
          error: "Server configuration error",
          details: "Missing Supabase configuration for approval checks.",
        },
        { status: 500 },
      )
    }

    const result = await checkUserApprovalByEmail({
      email: String(email),
      serviceRoleKey: supabaseServiceRoleKey,
      supabaseUrl,
    })

    return Response.json(result)
  } catch (error) {
    console.error("Expo check-user route error:", error)
    return Response.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    )
  }
}
