"use client"

import { useMemo } from "react"
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatDuration } from "@/lib/parsing-utils"

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

const CHART_COLORS = [
    "hsl(0, 0%, 15%)",
    "hsl(0, 0%, 30%)",
    "hsl(0, 0%, 45%)",
    "hsl(0, 0%, 60%)",
    "hsl(0, 0%, 75%)",
    "hsl(0, 0%, 85%)",
]

const ACCENT_COLOR = "hsl(0, 0%, 10%)"

const tooltipStyle = {
    backgroundColor: "hsl(0, 0%, 98%)",
    border: "1px solid hsl(0, 0%, 90%)",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "12px",
    fontFamily: "monospace",
}

function SimpleBarChart({ data, dataKey }: { data: any[]; dataKey: string }) {
    if (data.length === 0) return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No data</div>

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(0, 0%, 90%)" />
                <XAxis
                    type="number"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
                    hide
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
                    width={100}
                />
                <Tooltip
                    cursor={{ fill: "hsl(0, 0%, 96%)" }}
                    contentStyle={tooltipStyle}
                />
                <Bar dataKey={dataKey} fill={ACCENT_COLOR} radius={[0, 2, 2, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    )
}

function SimplePieChart({ data, title }: { data: Record<string, number>; title: string }) {
    const chartData = useMemo(() => {
        return Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }))
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-mono">
                No {title.toLowerCase()} data
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: "hsl(0, 0%, 60%)", strokeWidth: 1 }}
                >
                    {chartData.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0), "Items"]}
                />
            </PieChart>
        </ResponsiveContainer>
    )
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
                        <SimpleBarChart data={metrics.topArtists} dataKey="value" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByType} title="Type" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByPlatform} title="Platform" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Genre</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByGenre} title="Genre" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
