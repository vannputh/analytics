"use client"

import { useMemo } from "react"

import {
  calculateFoodMetrics,
  type FoodEntry,
  type FoodMetrics,
} from "@analytics/domain"

export type { FoodMetrics } from "@analytics/domain"

export function useFoodMetrics(data: FoodEntry[]): FoodMetrics {
  return useMemo(() => calculateFoodMetrics(data), [data])
}
