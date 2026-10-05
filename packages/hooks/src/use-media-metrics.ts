"use client"

import { useMemo } from "react"

import {
  calculateMediaMetrics,
  type MediaEntry,
  type MediaMetrics,
} from "@analytics/domain"

export type { MediaMetrics } from "@analytics/domain"

export function useMediaMetrics(data: MediaEntry[]): MediaMetrics {
  return useMemo(() => calculateMediaMetrics(data), [data])
}

export default useMediaMetrics
