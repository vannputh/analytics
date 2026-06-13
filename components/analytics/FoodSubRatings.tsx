"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FoodMetrics } from "@/hooks/useFoodMetrics"

interface FoodSubRatingsProps {
    metrics: FoodMetrics
}

const SUB_RATINGS = [
    { key: "averageFoodRating", label: "Food" },
    { key: "averageAmbianceRating", label: "Ambiance" },
    { key: "averageServiceRating", label: "Service" },
    { key: "averageValueRating", label: "Value" },
] as const

// Surfaces the food/ambiance/service/value averages that useFoodMetrics already
// computes but nothing renders. Hidden entirely when no sub-ratings exist.
export function FoodSubRatings({ metrics }: FoodSubRatingsProps) {
    const rows = SUB_RATINGS
        .map((r) => ({ label: r.label, value: metrics[r.key] }))
        .filter((r) => r.value > 0)

    if (rows.length === 0) return null

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    Ratings Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {rows.map((r) => (
                    <div key={r.label} className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-mono text-muted-foreground">{r.label}</span>
                            <span className="text-sm font-mono font-semibold tabular-nums">
                                {r.value.toFixed(1)}
                                <span className="text-muted-foreground">/5</span>
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-foreground/70 rounded-full"
                                style={{ width: `${(r.value / 5) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default FoodSubRatings
