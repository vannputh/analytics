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
    Treemap,
    LineChart,
    Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/parsing-utils"

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

function SimpleBarChart({ data, dataKey, color = ACCENT_COLOR }: { data: any[]; dataKey: string; color?: string }) {
    if (data.length === 0) return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No data</div>

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0, 0%, 90%)" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
                />
                <YAxis
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
                />
                <Tooltip
                    cursor={{ fill: "hsl(0, 0%, 96%)" }}
                    contentStyle={tooltipStyle}
                />
                <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
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
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0), "Books"]}
                />
            </PieChart>
        </ResponsiveContainer>
    )
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
                        <SimpleBarChart data={metrics.booksPerMonth} dataKey="value" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Pages Read per Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleBarChart data={metrics.pagesPerMonth} dataKey="value" color="hsl(0, 0%, 40%)" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByStatus} title="Status" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">By Format</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimplePieChart data={metrics.countByFormat} title="Format" />
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
