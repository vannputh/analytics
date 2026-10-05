import { GoogleGenerativeAI } from "@google/generative-ai"

import { normalizeGeminiError } from "@analytics/domain"

const SYSTEM_INSTRUCTION = `You are a strict data cleaner for a media tracking application. Your job is to normalize messy CSV data into a clean, structured JSON format.

RULES:
1. Normalize all dates to YYYY-MM-DD format
2. Convert ratings like "5/10" or "8.5/10" to plain numeric values (5.0, 8.5)
3. Strip all currency symbols from prices, output as plain numbers
4. Parse durations into standardized format: "X min" or "Xh Ym" (e.g., "2h" becomes "120 min", "1:30" becomes "90 min")
5. Normalize medium values to one of: Movie, TV Show, Game, Podcast
6. Normalize status values to one of: Finished, Watching, On Hold, Dropped, Plan to Watch
7. Genre should be an array of strings. Split comma-separated genres and trim whitespace
8. If a field is empty or "N/A" or "-", set it to null
9. Trim all string values
10. Preserve the original title exactly as given

OUTPUT FORMAT:
Return a JSON object with structure:
{
  "entries": [],
  "errors": []
}

IMPORTANT: Return ONLY the raw JSON object. No markdown formatting, no code blocks, no explanations before or after.`

function repairJSON(value: string) {
  return value.replace(/,(\s*[}\]])/g, "$1")
}

export async function POST(request: Request) {
  try {
    const { csvData } = await request.json()

    if (!csvData || typeof csvData !== "string") {
      return Response.json({ error: "Missing or invalid csvData field" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    const modelName = process.env.GEMINI_MODEL_NAME

    if (!apiKey) {
      return Response.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    if (!modelName) {
      return Response.json(
        { error: "Gemini model name not configured (GEMINI_MODEL_NAME)" },
        { status: 500 },
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    })

    const result = await model.generateContent(`Clean and normalize the following CSV data:\n\n${csvData}`)
    const text = result.response.text()

    let jsonString = text.trim()
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim()
    } else {
      const startIdx = jsonString.indexOf("{")
      const lastIdx = jsonString.lastIndexOf("}")
      if (startIdx !== -1 && lastIdx !== -1 && lastIdx > startIdx) {
        jsonString = jsonString.substring(startIdx, lastIdx + 1)
      }
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonString)
    } catch (firstError) {
      try {
        parsed = JSON.parse(repairJSON(jsonString))
      } catch {
        const entriesMatch = jsonString.match(/"entries"\s*:\s*\[([\s\S]*?)\](?:\s*[,}])/)
        if (!entriesMatch) {
          throw firstError
        }
        parsed = {
          entries: JSON.parse(`[${entriesMatch[1]}]`),
          errors: [],
        }
      }
    }

    if (!parsed.entries || !Array.isArray(parsed.entries)) {
      throw new Error("Invalid response structure from AI: missing entries array")
    }

    return Response.json({
      success: true,
      data: parsed.entries,
      errors: parsed.errors || [],
      rawCount: parsed.entries.length,
    })
  } catch (error) {
    console.error("Expo clean-data route error:", error)

    if (error instanceof SyntaxError) {
      return Response.json({ error: "Failed to parse AI response as JSON" }, { status: 500 })
    }

    const { message, statusCode } = normalizeGeminiError(error)
    return Response.json(
      { error: message },
      { status: statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500 },
    )
  }
}
