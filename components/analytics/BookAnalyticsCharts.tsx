"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/parsing-utils"
import { SimpleBarChart, SimplePieChart, ACCENT_COLOR } from "@/components/charts"

interface BookMetrics {
    totalBooks: number
    finishedCount: number
    totalPagesRead: number
    averageRating: number
    countByStatus: Record<string, number>
    countByFormat: Record<string, number>
    countByGenre: Record<string, number>
    booksPerMonth: { name: string; value: number }[]
    pagesPerMonth: { name: string; value: number }[]
}

interface BookAnalyticsChartsProps {
    metrics: BookMetrics
}

export function BookAnalyticsCharts({ metrics }: BookAnalyticsChartsProps) {
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Books</p>
                        <p className="text-3xl font-bold font-mono mt-2">{metrics.totalBooks}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Finished</p>
                        <p className="text-3xl font-bold font-mono mt-2">{metrics.finishedCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Pages Read</p>
                        <p className="text-3xl font-bold font-mono mt-2">{formatNumber(metrics.totalPagesRead)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Avg Rating</p>
                        <p className="text-3xl font-bold font-mono mt-2">{metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : "—"}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Books Finished per Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleBarChart data={metrics.booksPerMonth} layout="horizontal" valueLabel="Books" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Pages Read per Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleBarChart data={metrics.pagesPerMonth} layout="horizontal" valueLabel="Pages" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByStatus} title="Status" valueLabel="Books" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Format</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByFormat} title="Format" valueLabel="Books" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Genre</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByGenre} title="Genre" valueLabel="Books" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
