import { NextRequest, NextResponse } from "next/server";
import { getMetadata } from "@/lib/services/metadata-fetcher";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get("title");
    const imdbIdParam = searchParams.get("imdb_id");
    const type = searchParams.get("type");
    const medium = searchParams.get("medium");
    const year = searchParams.get("year");
    const season = searchParams.get("season");
    const source = searchParams.get("source");

    const metadata = await getMetadata({
      title: title || undefined,
      imdb_id: imdbIdParam || undefined,
      type: type || undefined,
      medium: medium || undefined,
      year: year || undefined,
      season: season || undefined,
      source: source || undefined,
    });

    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error("Metadata fetch error:", error);
    const status = error.message.includes("required") || error.message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch metadata" },
      { status: error.message.includes("configured") ? 500 : status }
    );
  }
}
