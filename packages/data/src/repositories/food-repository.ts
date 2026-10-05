import type { AnalyticsSupabaseClient } from "../supabase/client"
import type {
  FoodEntry,
  FoodEntryImage,
  FoodEntryImageInsert,
  FoodEntryInsert,
  FoodEntryUpdate,
} from "@analytics/domain"
import { FOOD_ANALYTICS_ENTRY_SELECT, groupFoodEntriesByDate } from "@analytics/domain"

export interface FoodEntryFilters {
  dateFrom?: string | null
  dateTo?: string | null
  categories?: string[]
  cuisineTypes?: string[]
  itemCategories?: string[]
  priceLevels?: string[]
  diningTypes?: string[]
  city?: string
  minRating?: number | null
  wouldReturn?: boolean | null
  search?: string
  includeImages?: boolean
  limit?: number
  offset?: number
  projection?: "analytics" | "full"
}

export interface FoodMonthLoadOptions {
  includeImages?: boolean
}

export interface FoodFieldOptions {
  categories: string[]
  cities: string[]
  cuisineTypes: string[]
  itemCategories: string[]
}

export interface FoodEntryDetail extends FoodEntry {
  images: FoodEntryImage[]
}

function extractItemCategories(entry: FoodEntry): string[] {
  return (entry.items_ordered || []).flatMap((item) =>
    item.categories?.length ? item.categories : item.category ? [item.category] : [],
  )
}

function dedupeSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])).sort()
}

function sortImages(images: FoodEntryImage[]): FoodEntryImage[] {
  return images.slice().sort((left, right) => {
    if (left.is_primary && !right.is_primary) return -1
    if (!left.is_primary && right.is_primary) return 1
    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  })
}

function withPrimaryImage(entry: any): FoodEntry {
  const primaryImage =
    entry.food_entry_images?.find((image: { is_primary?: boolean }) => image.is_primary) ??
    entry.food_entry_images?.[0]

  const { food_entry_images, ...rest } = entry
  return {
    ...rest,
    primary_image_url: primaryImage?.image_url ?? entry.primary_image_url ?? null,
  } as FoodEntry
}

function applyFoodFilters(query: any, filters?: FoodEntryFilters) {
  let current = query

  if (!filters) {
    return current
  }

  if (filters.dateFrom) {
    current = current.gte("visit_date", filters.dateFrom)
  }

  if (filters.dateTo) {
    current = current.lte("visit_date", filters.dateTo)
  }

  if (filters.categories?.length) {
    current = current.in("category", filters.categories)
  }

  if (filters.cuisineTypes?.length) {
    current = current.overlaps("cuisine_type", filters.cuisineTypes)
  }

  if (filters.priceLevels?.length) {
    current = current.in("price_level", filters.priceLevels)
  }

  if (filters.diningTypes?.length) {
    current = current.in("dining_type", filters.diningTypes)
  }

  if (filters.wouldReturn !== undefined && filters.wouldReturn !== null) {
    current = current.eq("would_return", filters.wouldReturn)
  }

  if (filters.city) {
    current = current.eq("city", filters.city)
  }

  if (filters.minRating) {
    current = current.gte("overall_rating", filters.minRating)
  }

  if (filters.search) {
    const escaped = filters.search.replace(/"/g, '""')
    const pattern = `"%${escaped}%"`
    current = current.or(`name.ilike.${pattern},branch.ilike.${pattern}`)
  }

  if (typeof filters.limit === "number" && typeof filters.offset === "number") {
    current = current.range(filters.offset, filters.offset + filters.limit - 1)
  } else if (typeof filters.limit === "number") {
    current = current.limit(filters.limit)
  }

  return current
}

export function createFoodRepository(client: AnalyticsSupabaseClient) {
  return {
    async getEntries(filters?: FoodEntryFilters): Promise<FoodEntry[]> {
      const selectQuery = filters?.projection === "analytics"
        ? FOOD_ANALYTICS_ENTRY_SELECT
        : filters?.includeImages
          ? `
          *,
          food_entry_images (
            image_url,
            is_primary
          )
        `
          : "*"

      let query = client
        .from("food_entries" as any)
        .select(selectQuery)
        .order("visit_date", { ascending: false })

      query = applyFoodFilters(query, filters)

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      let entries = ((data ?? []) as any[]).map((entry) =>
        filters?.includeImages ? withPrimaryImage(entry) : (entry as FoodEntry),
      )

      if (filters?.itemCategories?.length) {
        entries = entries.filter((entry) =>
          filters.itemCategories?.some((category) => extractItemCategories(entry).includes(category)),
        )
      }

      return entries
    },

    async getEntriesForMonth(
      year: number,
      month: number,
      options?: FoodMonthLoadOptions,
    ): Promise<Record<string, FoodEntry[]>> {
      const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`
      const dateTo = new Date(year, month, 0).toISOString().slice(0, 10)
      const entries = await this.getEntries({
        dateFrom,
        dateTo,
        includeImages: options?.includeImages ?? true,
      })
      return groupFoodEntriesByDate(entries)
    },

    async getEntryById(id: string, options?: { includeImages?: boolean }): Promise<FoodEntryDetail | null> {
      const selectQuery = options?.includeImages
        ? `
          *,
          food_entry_images (
            *
          )
        `
        : "*"

      const { data, error } = await client
        .from("food_entries" as any)
        .select(selectQuery)
        .eq("id", id)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        return null
      }

      const entry = data as any
      const images = options?.includeImages ? sortImages((entry.food_entry_images ?? []) as FoodEntryImage[]) : []
      const { food_entry_images, ...rest } = entry

      return {
        ...(options?.includeImages ? withPrimaryImage(entry) : (rest as FoodEntry)),
        images,
      }
    },

    async createEntry(input: FoodEntryInsert): Promise<FoodEntry> {
      const { data, error } = await client
        .from("food_entries" as any)
        .insert(input)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as unknown as FoodEntry
    },

    async updateEntry(id: string, input: FoodEntryUpdate): Promise<FoodEntry> {
      const { data, error } = await client
        .from("food_entries" as any)
        .update(input)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as unknown as FoodEntry
    },

    async deleteEntry(id: string): Promise<void> {
      const { error } = await client.from("food_entries" as any).delete().eq("id", id)

      if (error) {
        throw new Error(error.message)
      }
    },

    async getFieldOptions(): Promise<FoodFieldOptions> {
      const { data, error } = await client
        .from("food_entries" as any)
        .select("category, city, cuisine_type, items_ordered")

      if (error) {
        throw new Error(error.message)
      }

      const entries = (data ?? []) as unknown as FoodEntry[]
      const cuisineTypes = dedupeSorted(entries.flatMap((entry) => entry.cuisine_type ?? []))
      const itemCategories = dedupeSorted(entries.flatMap((entry) => extractItemCategories(entry)))

      return {
        categories: dedupeSorted(entries.map((entry) => entry.category)),
        cities: dedupeSorted(entries.map((entry) => entry.city)),
        cuisineTypes,
        itemCategories,
      }
    },

    async insertEntryImage(input: FoodEntryImageInsert): Promise<FoodEntryImage> {
      if (input.is_primary) {
        const { error: unsetError } = await client
          .from("food_entry_images" as any)
          .update({ is_primary: false })
          .eq("food_entry_id", input.food_entry_id)

        if (unsetError) {
          throw new Error(unsetError.message)
        }
      }

      const { data, error } = await client
        .from("food_entry_images" as any)
        .insert(input)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as unknown as FoodEntryImage
    },

    async getLocalPlaceSuggestions(query: string, limit = 8): Promise<FoodEntry[]> {
      const entries = await this.getEntries({
        search: query,
        limit: Math.max(limit * 3, 12),
      })

      const seen = new Set<string>()
      const suggestions: FoodEntry[] = []

      for (const entry of entries) {
        const key = `${entry.name.trim().toLowerCase()}|${(entry.branch ?? "").trim().toLowerCase()}`
        if (seen.has(key)) {
          continue
        }

        seen.add(key)
        suggestions.push(entry)

        if (suggestions.length >= limit) {
          break
        }
      }

      return suggestions
    },
  }
}
