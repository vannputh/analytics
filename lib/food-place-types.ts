export type FoodPlaceSource = "local" | "google";

export interface FoodPlaceSuggestion {
  id: string;
  source: FoodPlaceSource;
  name: string;
  branch?: string | null;
  address?: string | null;
  subtitle?: string | null;
  placeId?: string | null;
  googleMapsUrl?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface FoodPlaceSearchResponse {
  results: FoodPlaceSuggestion[];
}

export interface FoodPlaceDetailsRequest {
  url?: string;
  placeId?: string;
}

export interface FoodPlaceNormalizedFields {
  name: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  country: string | null;
}

export interface FoodPlaceDetailsResponse {
  name: string;
  address: string;
  website: string;
  priceLevel: string | null;
  neighborhood: string | null;
  city: string | null;
  country: string | null;
  googleMapsUrl: string;
  photos: string[] | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeTypes?: string[] | null;
  suggestedCategory?: string | null;
  suggestedCuisineTypes?: string[] | null;
  normalized?: FoodPlaceNormalizedFields;
}
