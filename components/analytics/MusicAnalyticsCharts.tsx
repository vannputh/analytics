"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/parsing-utils"
import { SimpleBarChart, SimplePieChart } from "@/components/charts"

interface MusicMetrics {
    totalEntries: number
    totalMinutesListened: number
    averageRating: number
    countByStatus: Record<string, number>
    countByType: Record<string, number>
    countByPlatform: Record<string, number>
    countByGenre: Record<string, number>
    topArtists: { name: string; value: number }[]
}

interface MusicAnalyticsChartsProps {
    metrics: MusicMetrics
}

export function MusicAnalyticsCharts({ metrics }: MusicAnalyticsChartsProps) {
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Tracks/Albums</p>
                        <p className="text-3xl font-bold font-mono mt-2">{metrics.totalEntries}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Listening Time</p>
                        <div className="mt-2">
                            <p className="text-3xl font-bold font-mono">{formatNumber(Math.floor(metrics.totalMinutesListened / 60), 1)} h</p>
                            <p className="text-xs text-muted-foreground">{formatNumber(metrics.totalMinutesListened)} mins</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Avg Rating</p>
                        <p className="text-3xl font-bold font-mono mt-2">{metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : "—"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Top Genre</p>
                        <p className="text-xl font-bold font-mono mt-2 truncate">
                            {Object.entries(metrics.countByGenre).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Top Artists</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleBarChart
                            data={metrics.topArtists}
                            layout="vertical"
                            valueLabel="Count"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByType} title="Type" valueLabel="Items" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByPlatform} title="Platform" valueLabel="Items" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Genre</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByGenre} title="Genre" valueLabel="Items" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
