"use client"

import { useMemo } from "react"
import {
    AreaChart,
    Area,
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
    Legend,
    Treemap,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FoodMetrics } from "@/hooks/useFoodMetrics"

interface FoodAnalyticsChartsProps {
    metrics: FoodMetrics
}

// Monochrome palette with accent
const CHART_COLORS = [
    "hsl(0, 0%, 15%)",
    "hsl(0, 0%, 30%)",
    "hsl(0, 0%, 45%)",
    "hsl(0, 0%, 60%)",
    "hsl(0, 0%, 75%)",
    "hsl(0, 0%, 85%)",
]

const ACCENT_COLOR = "hsl(0, 0%, 10%)"

// Custom tooltip style
const tooltipStyle = {
    backgroundColor: "hsl(0, 0%, 98%)",
    border: "1px solid hsl(0, 0%, 90%)",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "12px",
    fontFamily: "monospace",
}

function formatMonthLabel(month: string): string {
    const [year, m] = month.split("-")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${monthNames[parseInt(m, 10) - 1]} ${year.slice(2)}`
}

function formatCurrency(amount: number): string {
    return `฿${amount.toLocaleString()}`
}

function formatNumber(num: number): string {
    return num.toLocaleString()
}

// Visits by Month Chart
function VisitsByMonthChart({ data }: { data: { month: string; count: number }[] }) {
    const chartData = useMemo(() => {
        return data.map((d) => ({
            month: formatMonthLabel(d.month),
            count: d.count,
        }))
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-mono">
                No visit data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis
                    dataKey="month"
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
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0), "Visits"]}
                />
                <Bar dataKey="count" fill={ACCENT_COLOR} radius={[2, 2, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

// Spending by Month Chart
function SpendingByMonthChart({ data }: { data: { month: string; amount: number }[] }) {
    const chartData = useMemo(() => {
        return data.map((d) => ({
            month: formatMonthLabel(d.month),
            amount: Math.round(d.amount),
        }))
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-mono">
                No spending data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT_COLOR} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={ACCENT_COLOR} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
                />
                <YAxis
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
                    tickFormatter={(v) => `฿${v >= 1000 ? `${v / 1000}k` : v}`}
                />
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Spent"]}
                />
                <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={ACCENT_COLOR}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendingGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// Cuisine Types Treemap
function CuisineTreemap({ data }: { data: Record<string, number> }) {
    const chartData = useMemo(() => {
        return Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, value]) => ({ name, size: value }))
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-mono">
                No cuisine data
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <Treemap
                data={chartData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="hsl(0, 0%, 100%)"
                fill={ACCENT_COLOR}
                content={({ x, y, width, height, name, value }) => {
                    if (width < 40 || height < 30) return <g />
                    return (
                        <g>
                            <rect
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                fill={CHART_COLORS[Math.abs(name?.toString().charCodeAt(0) || 0) % CHART_COLORS.length]}
                                stroke="hsl(0, 0%, 100%)"
                                strokeWidth={2}
                            />
                            <text
                                x={x + width / 2}
                                y={y + height / 2 - 6}
                                textAnchor="middle"
                                fill="hsl(0, 0%, 100%)"
                                fontSize={11}
                                fontFamily="monospace"
                                fontWeight="bold"
                            >
                                {name}
                            </text>
                            <text
                                x={x + width / 2}
                                y={y + height / 2 + 8}
                                textAnchor="middle"
                                fill="hsl(0, 0%, 85%)"
                                fontSize={10}
                                fontFamily="monospace"
                            >
                                {value}
                            </text>
                        </g>
                    )
                }}
            >
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0), "Visits"]}
                />
            </Treemap>
        </ResponsiveContainer>
    )
}

// Pie Chart for city/neighborhood/price level
function DistributionPieChart({ data, title }: { data: Record<string, number>; title: string }) {
    const chartData = useMemo(() => {
        return Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
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
                    innerRadius={50}
                    outerRadius={90}
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
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0), "Visits"]}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

// Most Visited Places Chart
function MostVisitedChart({ data }: { data: { name: string; count: number; avgRating: number }[] }) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-mono">
                No visit data
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis
                    type="number"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    width={80}
                />
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined, name: string | undefined) => {
                        const v = value ?? 0
                        if (name === "count") return [v, "Visits"]
                        if (name === "avgRating") return [v.toFixed(1), "Avg Rating"]
                        return [v, name ?? ""]
                    }}
                />
                <Bar dataKey="count" fill={ACCENT_COLOR} radius={[0, 2, 2, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

// Rating Distribution Chart
function RatingDistributionChart({ data }: { data: { rating: number; count: number }[] }) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-mono">
                No rating data
            </div>
        )
    }

    // Ensure we have all ratings 1-5 represented
    const fullData = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1
        const found = data.find((d) => d.rating === rating)
        return { rating: `${rating}★`, count: found?.count || 0 }
    })

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fullData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis
                    dataKey="rating"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0), "Entries"]}
                />
                <Bar dataKey="count" fill={ACCENT_COLOR} radius={[2, 2, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function FoodAnalyticsCharts({ metrics }: FoodAnalyticsChartsProps) {
    return (
        <div className="space-y-4">
            {/* Main row: Visits and Spending */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            Visits · By Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <VisitsByMonthChart data={metrics.countByMonth} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            Spending · By Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <SpendingByMonthChart data={metrics.spentByMonth} />
                    </CardContent>
                </Card>
            </div>

            {/* Secondary row: Cuisine and Most Visited */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            Cuisine Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <CuisineTreemap data={metrics.countByCuisine} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            Most Visited Places
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <MostVisitedChart data={metrics.mostVisitedPlaces} />
                    </CardContent>
                </Card>
            </div>

            {/* Tertiary row: Pie charts - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            By City
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <DistributionPieChart data={metrics.countByCity} title="City" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            By Category
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <DistributionPieChart data={metrics.countByCategory} title="Category" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                            Rating Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <RatingDistributionChart data={metrics.ratingDistribution} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default FoodAnalyticsCharts
