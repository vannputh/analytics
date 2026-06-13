"use client"

import { useState } from "react"
import { format } from "date-fns/format"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface DateRangePickerProps {
    from: string | null
    to: string | null
    onChange: (from: string | null, to: string | null) => void
    className?: string
}

// Quick presets. getRange runs on click so "now" is always current.
const DATE_PRESETS: { label: string; getRange: () => [Date, Date] }[] = [
    {
        label: "Last 30 days",
        getRange: () => {
            const now = new Date()
            const start = new Date()
            start.setDate(now.getDate() - 30)
            return [start, now]
        },
    },
    {
        label: "Last 90 days",
        getRange: () => {
            const now = new Date()
            const start = new Date()
            start.setDate(now.getDate() - 90)
            return [start, now]
        },
    },
    {
        label: "Last 6 months",
        getRange: () => {
            const now = new Date()
            const start = new Date()
            start.setMonth(now.getMonth() - 6)
            return [start, now]
        },
    },
    {
        label: "Last Year",
        getRange: () => {
            const now = new Date()
            return [new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), now]
        },
    },
    {
        label: "This Year",
        getRange: () => {
            const now = new Date()
            return [new Date(now.getFullYear(), 0, 1), now]
        },
    },
]

export function DateRangePicker({ from, to, onChange, className }: DateRangePickerProps) {
    const [open, setOpen] = useState(false)

    const fromDate = from ? new Date(from) : undefined
    const toDate = to ? new Date(to) : undefined

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 border-dashed font-mono text-xs justify-start",
                        (from || to) && "border-foreground/50",
                        className
                    )}
                >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {from || to ? (
                        <>
                            {from ? format(new Date(from), "MMM d, yy") : "Start"}
                            {" → "}
                            {to ? format(new Date(to), "MMM d, yy") : "Now"}
                        </>
                    ) : (
                        "Date Range"
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 max-h-[80vh] overflow-y-auto" align="start">
                <div className="flex flex-col sm:flex-row">
                    <div className="p-2 border-b sm:border-b-0 sm:border-r">
                        <p className="text-xs text-muted-foreground mb-2 px-2">From</p>
                        <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={(date) => {
                                onChange(date ? format(date, "yyyy-MM-dd") : null, to)
                            }}
                            initialFocus
                        />
                    </div>
                    <div className="p-2">
                        <p className="text-xs text-muted-foreground mb-2 px-2">To</p>
                        <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={(date) => {
                                onChange(from, date ? format(date, "yyyy-MM-dd") : null)
                            }}
                        />
                    </div>
                </div>
                <Separator />
                <div className="p-2 grid grid-cols-2 gap-2">
                    {DATE_PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                                const [start, end] = preset.getRange()
                                onChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"))
                            }}
                        >
                            {preset.label}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                            onChange(null, null)
                            setOpen(false)
                        }}
                    >
                        All time
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default DateRangePicker
