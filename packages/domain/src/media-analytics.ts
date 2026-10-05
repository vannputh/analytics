import { VISUAL_MEDIA_TYPES, type MediaEntry } from "./database.types"
import { normalizeLanguage } from "./language-utils"
import { parseDurationToMinutes, parsePrice } from "./parsing-utils"
import { getMonthBucketKey } from "./analytics-date"

export interface MediaMetrics {
  totalSpent: number
  averagePrice: number
  spentByMedium: Record<string, number>
  spentByMonth: { month: string; amount: number; byMedium: Record<string, number> }[]
  totalMinutes: number
  totalHours: number
  daysWatched: number
  minutesByMonth: { month: string; minutes: number }[]
  minutesByMedium: Record<string, number>
  totalItems: number
  countByMedium: Record<string, number>
  countByLanguage: Record<string, number>
  countByGenre: Record<string, number>
  countByPlatform: Record<string, number>
  countByStatus: Record<string, number>
  countByType: Record<string, number>
  countByMonth: { month: string; count: number }[]
  averageRating: number
  ratingDistribution: { rating: number; count: number }[]
  topLanguage: string | null
  topGenre: string | null
  topPlatform: string | null
  topMedium: string | null
}

function getTopEntry(record: Record<string, number>): string | null {
  const entries = Object.entries(record)
  if (entries.length === 0) return null
  return entries.reduce((left, right) => (left[1] > right[1] ? left : right))[0]
}

function incrementRecord(record: Record<string, number>, key: string | null, amount = 1) {
  if (!key) return
  record[key] = (record[key] || 0) + amount
}

export function calculateMediaMetrics(data: MediaEntry[]): MediaMetrics {
  let totalSpent = 0
  let totalMinutes = 0
  let totalRatingSum = 0
  let ratedItemCount = 0

  const spentByMedium: Record<string, number> = {}
  const spentByMonthMap: Record<string, { amount: number; byMedium: Record<string, number> }> = {}
  const minutesByMonthMap: Record<string, number> = {}
  const minutesByMedium: Record<string, number> = {}
  const countByMedium: Record<string, number> = {}
  const countByLanguage: Record<string, number> = {}
  const countByGenre: Record<string, number> = {}
  const countByPlatform: Record<string, number> = {}
  const countByStatus: Record<string, number> = {}
  const countByType: Record<string, number> = {}
  const countByMonthMap: Record<string, number> = {}
  const ratingBuckets: Record<number, number> = {}

  for (const entry of data) {
    const month = getMonthBucketKey(entry.finish_date) || getMonthBucketKey(entry.start_date)
    const medium = entry.medium
    const isVisualMedia = medium && (VISUAL_MEDIA_TYPES as readonly string[]).includes(medium)

    const price = parsePrice(entry.price)
    if (price !== null && price > 0) {
      totalSpent += price
      incrementRecord(spentByMedium, medium, price)

      if (month) {
        if (!spentByMonthMap[month]) {
          spentByMonthMap[month] = { amount: 0, byMedium: {} }
        }
        spentByMonthMap[month].amount += price
        incrementRecord(spentByMonthMap[month].byMedium, medium, price)
      }
    }

    if (isVisualMedia) {
      const minutes = parseDurationToMinutes(entry.length)
      if (minutes !== null && minutes > 0) {
        totalMinutes += minutes
        incrementRecord(minutesByMedium, medium, minutes)
        if (month) {
          incrementRecord(minutesByMonthMap, month, minutes)
        }
      }
    }

    incrementRecord(countByMedium, medium)
    incrementRecord(countByPlatform, entry.platform)
    incrementRecord(countByStatus, entry.status)
    incrementRecord(countByType, entry.type)
    if (month) {
      incrementRecord(countByMonthMap, month)
    }

    if (entry.genre && Array.isArray(entry.genre)) {
      for (const genre of entry.genre) {
        incrementRecord(countByGenre, genre.trim())
      }
    }

    if (entry.language) {
      for (const language of normalizeLanguage(entry.language)) {
        incrementRecord(countByLanguage, language)
      }
    }

    const rating = entry.my_rating ?? entry.rating
    if (rating !== null && rating !== undefined) {
      totalRatingSum += rating
      ratedItemCount += 1
      const bucket = Math.floor(rating)
      ratingBuckets[bucket] = (ratingBuckets[bucket] || 0) + 1
    }
  }

  const spentByMonth = Object.entries(spentByMonthMap)
    .map(([month, monthData]) => ({ month, ...monthData }))
    .sort((left, right) => left.month.localeCompare(right.month))

  const minutesByMonth = Object.entries(minutesByMonthMap)
    .map(([month, minutes]) => ({ month, minutes }))
    .sort((left, right) => left.month.localeCompare(right.month))

  const countByMonth = Object.entries(countByMonthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((left, right) => left.month.localeCompare(right.month))

  const ratingDistribution = Object.entries(ratingBuckets)
    .map(([rating, count]) => ({ rating: Number.parseInt(rating, 10), count }))
    .sort((left, right) => left.rating - right.rating)

  const totalHours = totalMinutes / 60
  const daysWatched = totalHours / 24
  const averagePrice = data.length > 0 ? totalSpent / data.length : 0
  const averageRating = ratedItemCount > 0 ? totalRatingSum / ratedItemCount : 0

  return {
    totalSpent,
    averagePrice,
    spentByMedium,
    spentByMonth,
    totalMinutes,
    totalHours,
    daysWatched,
    minutesByMonth,
    minutesByMedium,
    totalItems: data.length,
    countByMedium,
    countByLanguage,
    countByGenre,
    countByPlatform,
    countByStatus,
    countByType,
    countByMonth,
    averageRating,
    ratingDistribution,
    topLanguage: getTopEntry(countByLanguage),
    topGenre: getTopEntry(countByGenre),
    topPlatform: getTopEntry(countByPlatform),
    topMedium: getTopEntry(countByMedium),
  }
}
