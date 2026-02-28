function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function normalizeGooglePlaceTypes(
  primaryType: string | null | undefined,
  types: string[] | null | undefined
): string[] {
  const normalized = new Set<string>();
  const rawValues = [primaryType, ...(types || [])];

  for (const value of rawValues) {
    if (!value) continue;
    const token = normalizeToken(value);
    if (!token) continue;
    normalized.add(token);
  }

  return Array.from(normalized);
}

const CATEGORY_MATCHERS: Array<{ category: string; tokens: string[] }> = [
  {
    category: "Bar",
    tokens: ["bar", "pub", "wine_bar", "cocktail_bar", "brewpub", "night_club"],
  },
  {
    category: "Cafe",
    tokens: ["cafe", "coffee_shop", "tea_house", "bakery", "dessert_shop", "ice_cream_shop"],
  },
  {
    category: "Street Food",
    tokens: ["street_food", "hawker_stall", "food_court", "meal_takeaway", "fast_food_restaurant"],
  },
  {
    category: "Restaurant",
    tokens: ["restaurant", "steak_house", "seafood_restaurant", "sushi_restaurant", "pizza_restaurant"],
  },
];

const CUISINE_TOKEN_MAP: Record<string, string> = {
  thai: "Thai",
  japanese: "Japanese",
  chinese: "Chinese",
  korean: "Korean",
  vietnamese: "Vietnamese",
  italian: "Italian",
  french: "French",
  american: "American",
  mexican: "Mexican",
  indian: "Indian",
  mediterranean: "Mediterranean",
  middle_eastern: "Middle Eastern",
  fusion: "Fusion",
  seafood: "Seafood",
  bbq: "BBQ",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  bakery: "Bakery",
};

function extractCuisineToken(placeType: string): string | null {
  if (!placeType) return null;
  const normalized = normalizeToken(placeType);
  if (!normalized) return null;

  if (normalized.endsWith("_restaurant")) {
    return normalized.slice(0, -"_restaurant".length);
  }

  return normalized;
}

export function inferCategoryFromPlaceTypes(placeTypes: string[]): string | null {
  for (const matcher of CATEGORY_MATCHERS) {
    const matched = placeTypes.some((typeToken) => {
      if (matcher.tokens.includes(typeToken)) return true;
      if (matcher.category === "Restaurant" && typeToken.endsWith("_restaurant")) return true;
      if (matcher.category === "Bar" && typeToken.endsWith("_bar")) return true;
      return false;
    });

    if (matched) return matcher.category;
  }

  return null;
}

export function inferCuisineTypesFromPlaceTypes(placeTypes: string[]): string[] {
  const inferred = new Set<string>();

  for (const placeType of placeTypes) {
    const cuisineToken = extractCuisineToken(placeType);
    if (!cuisineToken) continue;

    const mapped = CUISINE_TOKEN_MAP[cuisineToken];
    if (mapped) {
      inferred.add(mapped);
    }
  }

  return Array.from(inferred);
}
