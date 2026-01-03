import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GOOGLE_MAPS_API_KEY is not configured" },
                { status: 500 }
            );
        }

        // 1. Expand short URLs if necessary
        let fullUrl = url;
        if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
            try {
                const response = await fetch(url, {
                    method: "HEAD",
                    redirect: "manual",
                });
                const location = response.headers.get("location");
                if (location) {
                    fullUrl = location;
                }
            } catch (error) {
                console.error("Error expanding short URL:", error);
                // Continue with original URL if expansion fails, though it likely won't work well
            }
        }

        // 2. Extract info from URL
        // Patterns:
        // https://www.google.com/maps/place/Place+Name/@lat,lng,...
        // https://www.google.com/maps/place/data=!3m1!4b1!4m2!3m1!1s0x0:0x... (CID) - hard to use CID with Places API new version
        // https://www.google.com/maps/search/?api=1&query=...&query_place_id=...

        let placeId: string | null = null;
        let query: string | null = null;
        let searchUrl = "";

        // Try to find place_id in URL query params (some share links have it)
        try {
            const urlObj = new URL(fullUrl);
            // Check for ?q=... or ?query=...
            const qParam = urlObj.searchParams.get("q") || urlObj.searchParams.get("query");
            if (qParam) query = qParam;

            // Check for place_id or ftid (sometimes used)
            const idParam = urlObj.searchParams.get("place_id") || urlObj.searchParams.get("ftid");
            if (idParam) placeId = idParam;
        } catch (e) {
            // invalid url, ignore
        }

        // regex for /maps/place/Name/ or /maps/search/Name/
        if (!placeId && !query) {
            const placeRegex = /\/maps\/place\/([^\/]+)/;
            const match = fullUrl.match(placeRegex);
            if (match && match[1]) {
                // Check if it looks like a coordinate or generic placeholder
                const captured = match[1];
                if (!captured.startsWith("@")) {
                    // Decode the name, replace + with space
                    query = decodeURIComponent(captured).replace(/\+/g, " ");
                }
            }
        }

        // 3. Call Google Places API
        // If we have a Place ID, use Details. If we have a query, use Find Place or Text Search.

        // We prefer Text Search (New) or Find Place because scraping the URL for Place ID is unreliable unless it's explicitly there.
        // The "Name" in the URL is usually good enough for a Text Search.

        let placeData = null;

        if (query) {
            // Use Text Search (Basic) to find the place
            // https://places.googleapis.com/v1/places:searchText
            // FieldMask: places.id,places.displayName,places.formattedAddress,places.priceLevel,places.rating,places.websiteUri,places.location

            const textSearchUrl = `https://places.googleapis.com/v1/places:searchText`;

            const response = await fetch(textSearchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.priceLevel,places.rating,places.websiteUri,places.location,places.addressComponents,places.photos'
                },
                body: JSON.stringify({
                    textQuery: query,
                    maxResultCount: 1
                })
            });

            const data = await response.json();
            if (data.places && data.places.length > 0) {
                placeData = data.places[0];
            }
        }

        if (!placeData) {
            // Fallback: If we couldn't extract a query, or search returned nothing, 
            // maybe clean the URL ? 
            return NextResponse.json({ error: "Could not identify place from URL" }, { status: 404 });
        }

        // 4. Transform response
        // Google Places API v1 response structure
        // priceLevel is enum: PRICE_LEVEL_UNSPECIFIED, PRICE_LEVEL_FREE, PRICE_LEVEL_INEXPENSIVE, PRICE_LEVEL_MODERATE, PRICE_LEVEL_EXPENSIVE, PRICE_LEVEL_VERY_EXPENSIVE

        const priceLevelMap: Record<string, string> = {
            "PRICE_LEVEL_INEXPENSIVE": "1", // $
            "PRICE_LEVEL_MODERATE": "2",    // $$
            "PRICE_LEVEL_EXPENSIVE": "3",   // $$$
            "PRICE_LEVEL_VERY_EXPENSIVE": "4" // $$$$
        };

        // Extract address components
        let neighborhood = null;
        let city = null;
        let country = null;

        if (placeData.addressComponents) {
            for (const comp of placeData.addressComponents) {
                const types = comp.types;
                if (!types || !Array.isArray(types)) continue;

                if (types.includes("sublocality") || types.includes("neighborhood")) {
                    neighborhood = comp.longText;
                }
                if (types.includes("locality")) {
                    city = comp.longText;
                }
                if (types.includes("country")) {
                    country = comp.longText;
                }
            }
        }

        // Build photo URLs if photos are available
        // Google Places API v1 returns photos with a 'name' field like "places/ChIJ.../photos/AXCi2Q..."
        // We need to use the Media API endpoint to get the actual image
        const photoUrls: string[] = [];
        if (placeData.photos && Array.isArray(placeData.photos)) {
            for (const photo of placeData.photos.slice(0, 5)) { // Limit to 5 photos
                if (photo.name) {
                    // Construct the photo URL using the Places API media endpoint
                    const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`;
                    photoUrls.push(photoUrl);
                }
            }
        }

        return NextResponse.json({
            name: placeData.displayName?.text || "",
            address: placeData.formattedAddress || "",
            website: placeData.websiteUri || "",
            rating: placeData.rating || null,
            priceLevel: priceLevelMap[placeData.priceLevel] || null,
            neighborhood,
            city,
            country: country || "Cambodia", // Default/Fallback
            googleMapsUrl: placeData.googleMapsUri || url,
            photos: photoUrls.length > 0 ? photoUrls : null,
        });

    } catch (error) {
        console.error("Maps API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
