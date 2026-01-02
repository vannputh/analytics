"use client"

import { useState, useEffect, useMemo } from "react"
import { getFoodEntries } from "@/lib/food-actions"
import { FoodEntry } from "@/lib/database.types"
import { useFoodMetrics } from "@/hooks/useFoodMetrics"
import { FoodKPIGrid } from "@/components/analytics/FoodKPIGrid"
import { FoodAnalyticsCharts } from "@/components/analytics/FoodAnalyticsCharts"
import { PageHeader } from "@/components/page-header"
import { Loader2, AlertCircle, Utensils } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            {/* KPI Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-7 w-20 mb-1" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-[280px] w-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function FoodAnalyticsPage() {
    const [entries, setEntries] = useState<FoodEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function fetchEntries() {
            try {
                setLoading(true)
                setError(null)

                const result = await getFoodEntries()

                if (!isMounted) return

                if (!result.success) {
                    throw new Error(result.error || "Failed to load entries")
                }

                setEntries(result.data || [])
            } catch (err) {
                if (!isMounted) return

                console.error("Failed to fetch entries:", err)
                const errorMessage = err instanceof Error ? err.message : "Failed to load entries"
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchEntries()

        return () => {
            isMounted = false
        }
    }, [])

    // Calculate metrics from entries
    const metrics = useFoodMetrics(entries)

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <PageHeader title="Food Analytics" />
                <main className="p-4 sm:p-6">
                    <AnalyticsSkeleton />
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-destructive">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm font-mono">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <PageHeader title="Food Analytics" />

            {/* Main Content */}
            <main className="p-4 sm:p-6">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Utensils className="h-12 w-12 opacity-30 mb-4" />
                        <p className="text-sm font-mono mb-3">No food entries yet</p>
                        <Button asChild>
                            <Link href="/food">Add Your First Entry</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* KPI Grid */}
                        <FoodKPIGrid metrics={metrics} />

                        {/* Charts */}
                        <FoodAnalyticsCharts metrics={metrics} />
                    </div>
                )}
            </main>
        </div>
    )
}
