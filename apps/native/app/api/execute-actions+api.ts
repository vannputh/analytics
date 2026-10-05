import type { MediaEntryInsert, MediaEntryUpdate } from "@analytics/domain"
import { createMediaRepository } from "@analytics/data"

import { createRequestSupabaseClient, getBearerToken } from "@/lib/server-auth"

interface MediaAction {
  type: "create" | "update" | "delete"
  id?: string
  data?: Partial<{
    title: string
    medium: string
    type: string
    status: string
    genre: string[]
    platform: string
    my_rating: number
    start_date: string
    finish_date: string
    language: string[]
    episodes: number
    episodes_watched: number
    price: number
    poster_url: string
    imdb_id: string
    average_rating: number
    year: string
    plot: string
    season: string
    length: string
  }>
}

interface ExecuteActionsRequest {
  actions: MediaAction[]
}

interface ActionResult {
  success: boolean
  action: MediaAction
  error?: string
  entryId?: string
}

export async function POST(request: Request) {
  try {
    if (!getBearerToken(request)) {
      return Response.json({ success: false, error: "Missing bearer token" }, { status: 401 })
    }

    const body = (await request.json()) as ExecuteActionsRequest

    if (!body.actions || !Array.isArray(body.actions) || body.actions.length === 0) {
      return Response.json({ success: false, error: "No actions provided" }, { status: 400 })
    }

    const client = createRequestSupabaseClient(request)
    const mediaRepository = createMediaRepository(client)
    const results: ActionResult[] = []

    for (const action of body.actions) {
      try {
        if (action.type === "create") {
          if (!action.data?.title) {
            results.push({ success: false, action, error: "Title is required for create action" })
            continue
          }

          const entry = await mediaRepository.createEntry(action.data as MediaEntryInsert)
          results.push({ success: true, action, entryId: entry.id })
          continue
        }

        if (action.type === "update") {
          if (!action.id) {
            results.push({ success: false, action, error: "Entry ID is required for update action" })
            continue
          }

          const entry = await mediaRepository.updateEntry(action.id, action.data as MediaEntryUpdate)
          results.push({ success: true, action, entryId: entry.id })
          continue
        }

        if (action.type === "delete") {
          if (!action.id) {
            results.push({ success: false, action, error: "Entry ID is required for delete action" })
            continue
          }

          await mediaRepository.deleteEntry(action.id)
          results.push({ success: true, action, entryId: action.id })
          continue
        }

        results.push({ success: false, action, error: `Unknown action type: ${action.type}` })
      } catch (error) {
        results.push({
          success: false,
          action,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        })
      }
    }

    const summary = {
      total: results.length,
      succeeded: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
    }

    return Response.json({
      success: summary.failed === 0,
      results,
      summary,
    })
  } catch (error) {
    console.error("Expo execute-actions route error:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
