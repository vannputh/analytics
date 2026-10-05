import type { FoodEntry, FoodEntryInsert } from "./database.types"

export interface FoodCalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

export function toggleFoodSelectedDate(currentDate: string | null, nextDate: string): string | null {
  return currentDate === nextDate ? null : nextDate
}

export function formatFoodDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

function cloneItemsOrdered(entry: FoodEntry): FoodEntryInsert["items_ordered"] {
  return entry.items_ordered?.map((item) => ({
    name: item.name,
    price: item.price,
    image_url: null,
    category: item.category ?? null,
    categories: item.categories ? [...item.categories] : null,
  })) ?? null
}

export function buildFoodCalendarMonth(
  year: number,
  month: number,
  today = new Date(),
): FoodCalendarDay[] {
  const days: FoodCalendarDay[] = []
  const firstDayOfMonth = new Date(year, month, 1)
  const firstWeekdayOffset = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const previousMonth = month === 0 ? 11 : month - 1
  const previousYear = month === 0 ? year - 1 : year
  const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate()

  for (let offset = firstWeekdayOffset - 1; offset >= 0; offset -= 1) {
    const day = daysInPreviousMonth - offset
    const date = new Date(previousYear, previousMonth, day)
    days.push({
      date: formatFoodDateKey(date),
      day,
      isCurrentMonth: false,
      isToday: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    days.push({
      date: formatFoodDateKey(date),
      day,
      isCurrentMonth: true,
      isToday:
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
    })
  }

  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  const remainingDays = 42 - days.length

  for (let day = 1; day <= remainingDays; day += 1) {
    const date = new Date(nextYear, nextMonth, day)
    days.push({
      date: formatFoodDateKey(date),
      day,
      isCurrentMonth: false,
      isToday: false,
    })
  }

  return days
}

export function groupFoodEntriesByDate(entries: FoodEntry[]): Record<string, FoodEntry[]> {
  const grouped: Record<string, FoodEntry[]> = {}

  for (const entry of entries) {
    const key = entry.visit_date
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(entry)
  }

  for (const [key, dayEntries] of Object.entries(grouped)) {
    grouped[key] = dayEntries
      .slice()
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
  }

  return grouped
}

export function createFoodDuplicateEntryDraft(
  entry: FoodEntry,
  visitDate: string,
): Partial<FoodEntryInsert> {
  return {
    name: entry.name,
    branch: entry.branch,
    visit_date: visitDate,
    category: entry.category,
    address: entry.address,
    google_maps_url: entry.google_maps_url,
    latitude: entry.latitude,
    longitude: entry.longitude,
    neighborhood: entry.neighborhood,
    city: entry.city,
    country: entry.country,
    instagram_handle: entry.instagram_handle,
    website_url: entry.website_url,
    items_ordered: cloneItemsOrdered(entry),
    favorite_item: entry.favorite_item,
    overall_rating: entry.overall_rating,
    food_rating: entry.food_rating,
    ambiance_rating: entry.ambiance_rating,
    service_rating: entry.service_rating,
    value_rating: entry.value_rating,
    total_price: entry.total_price,
    currency: entry.currency,
    price_level: entry.price_level,
    cuisine_type: entry.cuisine_type ? [...entry.cuisine_type] : null,
    dining_type: entry.dining_type,
    tags: entry.tags ? [...entry.tags] : null,
    would_return: entry.would_return,
    notes: entry.notes,
    primary_image_url: entry.primary_image_url ?? null,
  }
}
