// Categories (replacing meal types)
export const CATEGORIES = [
    'Café',
    'Restaurant',
    'Eatery',
    'Bar',
    'Street Food',
    'Food Court',
    'Bakery',
    'Fast Food',
    'Fine Dining',
    'Buffet',
] as const
export type Category = (typeof CATEGORIES)[number]

// Price levels
export const PRICE_LEVELS = ['$', '$$', '$$$', '$$$$'] as const
export type PriceLevel = (typeof PRICE_LEVELS)[number]

// Common cuisine types
export const CUISINE_TYPES = [
    'Thai',
    'Japanese',
    'Chinese',
    'Korean',
    'Vietnamese',
    'Italian',
    'French',
    'American',
    'Mexican',
    'Indian',
    'Mediterranean',
    'Middle Eastern',
    'Fusion',
    'Seafood',
    'BBQ',
    'Vegetarian',
    'Vegan',
    'Cafe',
    'Bakery',
    'Street Food',
    'Fast Food',
    'Buffet',
] as const
export type CuisineType = (typeof CUISINE_TYPES)[number]

// Common tags
export const FOOD_TAGS = [
    'Date Night',
    'Casual',
    'Fine Dining',
    'Rooftop',
    'Outdoor Seating',
    'Family Friendly',
    'Solo Dining',
    'Business',
    'Late Night',
    'Delivery',
    'Takeaway',
    'Halal',
    'Pet Friendly',
    'Great View',
    'Live Music',
    'Instagrammable',
    'Hidden Gem',
    'Popular',
    'Quiet',
    'Cozy',
] as const
export type FoodTag = (typeof FOOD_TAGS)[number]

// Currency options - USD is default
export const CURRENCIES = ['USD', 'KHR', 'THB', 'EUR', 'JPY', 'GBP', 'SGD', 'KRW'] as const
export type Currency = (typeof CURRENCIES)[number]

// Exchange rate: USD to KHR (Cambodian Riel)
export const USD_TO_KHR_RATE = 4100

// Helper function to format dual currency display
export function formatDualCurrency(usdAmount: number | null | undefined): string {
    if (!usdAmount || usdAmount === 0) return '—'

    const khr = usdAmount * USD_TO_KHR_RATE
    const khrFormatted = khr >= 1000
        ? `៛${(khr / 1000).toFixed(1)}K`
        : `៛${Math.round(khr).toLocaleString()}`

    return `$${usdAmount.toFixed(2)} (${khrFormatted})`
}

// Filter state for food entries
export interface FoodFilterState {
    dateFrom: string | null
    dateTo: string | null
    categories: string[]
    cuisineTypes: string[]
    priceLevels: string[]
    cities: string[]
    minRating: number | null
    wouldReturn: boolean | null
}

export const defaultFoodFilterState: FoodFilterState = {
    dateFrom: null,
    dateTo: null,
    categories: [],
    cuisineTypes: [],
    priceLevels: [],
    cities: [],
    minRating: null,
    wouldReturn: null,
}
