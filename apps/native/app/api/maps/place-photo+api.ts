import { isGooglePlacePhotoName } from "@analytics/domain"

import { requireRequestUser } from "@/lib/server-auth"

function clampMaxWidth(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10)

  if (!Number.isFinite(parsed)) {
    return 800
  }

  return Math.min(4800, Math.max(1, parsed))
}

export async function GET(request: Request) {
  try {
    const unauthorized = await requireRequestUser(request)
    if (unauthorized) return unauthorized

    const url = new URL(request.url)
    const photoName = url.searchParams.get("name")?.trim() ?? ""
    const maxWidthPx = clampMaxWidth(url.searchParams.get("maxWidthPx"))

    if (!isGooglePlacePhotoName(photoName)) {
      return Response.json({ error: "A valid Google place photo name is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return Response.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 })
    }

    const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`)
    mediaUrl.searchParams.set("maxWidthPx", String(maxWidthPx))

    const response = await fetch(mediaUrl, {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    })

    if (!response.ok) {
      return Response.json({ error: "Unable to load place photo" }, { status: response.status })
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    if (contentType.includes("application/json")) {
      return Response.json({ error: "Unable to load place photo" }, { status: 502 })
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=86400",
        "Content-Type": contentType,
      },
    })
  } catch (error) {
    console.error("Expo place-photo route error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
