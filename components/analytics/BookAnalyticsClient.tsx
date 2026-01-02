"use client"

import { BookEntry } from "@/lib/database.types"
import { useBookMetrics } from "@/hooks/useBookMetrics"
import { BookAnalyticsCharts } from "@/components/analytics/BookAnalyticsCharts"

interface BookAnalyticsClientProps {
    books: BookEntry[]
}

export function BookAnalyticsClient({ books }: BookAnalyticsClientProps) {
    const metrics = useBookMetrics(books)

    return <BookAnalyticsCharts metrics={metrics} />
}
