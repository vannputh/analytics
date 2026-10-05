"use client"

import { useMemo } from "react"
import { SimpleBarChart } from "@/components/charts/SimpleBarChart"
import { SimplePieChart } from "@/components/charts/SimplePieChart"
import { AreaChartBase } from "@/components/charts/AreaChartBase"
import { formatCurrency, formatNumber } from "@/components/charts/chart-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AIQueryResultsProps {
  data: any[]
  metadata: {
    visualizationType: "kpi" | "table" | "bar" | "pie" | "line" | "area"
    columnCount: number
    rowCount: number
    columns: string[]
    columnTypes: Record<string, string>
  }
  explanation: string
}

export function AIQueryResults({ data, metadata, explanation }: AIQueryResultsProps) {
  const { visualizationType, columns, columnTypes } = metadata

  // Format values based on type
  const formatValue = (value: any, columnName: string): string => {
    if (value === null || value === undefined) {
      return "—"
    }

    const type = columnTypes[columnName]

    if (type === "number") {
      // Check if it's likely a currency field
      if (
        columnName.toLowerCase().includes("price") ||
        columnName.toLowerCase().includes("spent") ||
        columnName.toLowerCase().includes("cost") ||
        columnName.toLowerCase().includes("total")
      ) {
        return formatCurrency(value)
      }
      // Check if it's a rating
      if (columnName.toLowerCase().includes("rating") || columnName.toLowerCase().includes("avg")) {
        return value.toFixed(2)
      }
      return formatNumber(value)
    }

    if (type === "date") {
      return new Date(value).toLocaleDateString()
    }

    if (type === "boolean") {
      return value ? "Yes" : "No"
    }

    if (Array.isArray(value)) {
      return value.join(", ")
    }

    if (typeof value === "object") {
      return JSON.stringify(value)
    }

    return String(value)
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (data.length === 0) return []

    // For bar/pie charts, convert to { name, value } format
    if (visualizationType === "bar" || visualizationType === "pie") {
      const nameColumn = columns[0]
      const valueColumn = columns[1]

      return data.map((row) => ({
        name: String(row[nameColumn] || "Unknown"),
        value: Number(row[valueColumn]) || 0,
      }))
    }

    // For area/line charts, keep original format
    if (visualizationType === "area" || visualizationType === "line") {
      return data
    }

    return []
  }, [data, columns, visualizationType])

  // Render KPI card
  if (visualizationType === "kpi") {
    const value = data[0]?.[columns[0]]
    const formattedValue = formatValue(value, columns[0])

    return (
      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-mono">{explanation}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-5xl font-bold font-mono mb-2">{formattedValue}</div>
            <div className="text-sm text-muted-foreground font-mono capitalize">
              {columns[0].replace(/_/g, " ")}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render bar chart
  if (visualizationType === "bar") {
    const valueColumn = columns[1]
    const isCurrency =
      valueColumn.toLowerCase().includes("price") ||
      valueColumn.toLowerCase().includes("spent") ||
      valueColumn.toLowerCase().includes("cost") ||
      valueColumn.toLowerCase().includes("total")

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono">Results</CardTitle>
          <CardDescription className="text-xs font-mono">{explanation}</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={chartData}
            layout="vertical"
            height={Math.max(280, chartData.length * 40)}
            valueFormatter={isCurrency ? formatCurrency : formatNumber}
            valueLabel={valueColumn.replace(/_/g, " ")}
          />
        </CardContent>
      </Card>
    )
  }

  // Render pie chart
  if (visualizationType === "pie") {
    const valueColumn = columns[1]
    const isCurrency =
      valueColumn.toLowerCase().includes("price") ||
      valueColumn.toLowerCase().includes("spent") ||
      valueColumn.toLowerCase().includes("cost") ||
      valueColumn.toLowerCase().includes("total")

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono">Results</CardTitle>
          <CardDescription className="text-xs font-mono">{explanation}</CardDescription>
        </CardHeader>
        <CardContent>
          <SimplePieChart
            data={chartData}
            height={360}
            valueFormatter={isCurrency ? formatCurrency : formatNumber}
            valueLabel={valueColumn.replace(/_/g, " ")}
            showPercentLabel={true}
          />
        </CardContent>
      </Card>
    )
  }

  // Render area chart
  if (visualizationType === "area" || visualizationType === "line") {
    const dateColumn = columns.find(
      (col) =>
        columnTypes[col] === "date" ||
        ["date", "month", "year", "visit_date", "start_date"].some((term) =>
          col.toLowerCase().includes(term)
        )
    )
    const valueColumn = columns.find((col) => col !== dateColumn) || columns[1]

    const isCurrency =
      valueColumn.toLowerCase().includes("price") ||
      valueColumn.toLowerCase().includes("spent") ||
      valueColumn.toLowerCase().includes("cost") ||
      valueColumn.toLowerCase().includes("total")

    // Format data for area chart
    const areaData = data.map((row) => ({
      name: dateColumn ? formatValue(row[dateColumn], dateColumn) : "",
      value: Number(row[valueColumn]) || 0,
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono">Results</CardTitle>
          <CardDescription className="text-xs font-mono">{explanation}</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChartBase
            data={areaData}
            dataKey="value"
            xAxisKey="name"
            height={320}
            valueFormatter={isCurrency ? formatCurrency : formatNumber}
            valueLabel={valueColumn.replace(/_/g, " ")}
          />
        </CardContent>
      </Card>
    )
  }

  // Render table (default)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-mono">
          Results ({data.length} row{data.length !== 1 ? "s" : ""})
        </CardTitle>
        <CardDescription className="text-xs font-mono">{explanation}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="font-mono text-xs capitalize">
                    {col.replace(/_/g, " ")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col} className="font-mono text-xs">
                      {formatValue(row[col], col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
