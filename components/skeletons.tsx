import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function WatchingCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Poster */}
            <Skeleton className="w-full aspect-[4/3]" />
            <div className="p-4 space-y-3">
                {/* Title + year */}
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                {/* Badges */}
                <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                {/* Progress */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 flex-1 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </div>
        </div>
    );
}

export function WatchingSectionSkeleton() {
    return (
        <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-36" />
            </div>
            {/* Horizontal card strip */}
            <div className="flex gap-3 sm:gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[72vw] sm:w-72">
                        <WatchingCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MediaCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-[2/3] w-full" />
            <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </CardContent>
        </Card>
    );
}

export function MediaTableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-4 w-8" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-28" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                        <TableHead className="hidden sm:table-cell"><Skeleton className="h-4 w-14" /></TableHead>
                        <TableHead className="hidden sm:table-cell"><Skeleton className="h-4 w-14" /></TableHead>
                        <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-6" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-12 w-8 rounded" /></TableCell>
                            <TableCell>
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function SectionHeaderSkeleton({ iconWidth = "w-5" }: { iconWidth?: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className={`h-5 ${iconWidth} rounded`} />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-8 rounded-full" />
        </div>
    );
}

export function FilterBarSkeleton() {
    return (
        <div className="flex items-center gap-2 mb-4 overflow-hidden">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <div className="ml-auto">
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}

export function DiaryPageSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Watching strip */}
            <main className="p-4 sm:p-6">
                <WatchingSectionSkeleton />

                {/* Watched section */}
                <div className="mb-8">
                    <SectionHeaderSkeleton iconWidth="w-5" />
                    <FilterBarSkeleton />
                    <div className="flex gap-2 mb-4">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                    <MediaTableSkeleton rows={5} />
                </div>

                {/* Planned section */}
                <div className="mb-8">
                    <SectionHeaderSkeleton iconWidth="w-5" />
                    <MediaTableSkeleton rows={3} />
                </div>
            </main>
        </div>
    );
}

// Shared KPI card placeholder — mirrors KPICard (label, 2xl value, subValue, right-aligned icon)
function KPICardSkeleton() {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </CardContent>
        </Card>
    );
}

// Matches KPIGrid: 10 cards, grid-cols-2 / md:3 / lg:5
const MEDIA_KPI_SLOTS = [
    "spent", "hours", "days", "items", "rating",
    "genre", "language", "genres", "languages", "platforms",
] as const;

export function KPIGridSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MEDIA_KPI_SLOTS.map((slot) => (
                <KPICardSkeleton key={slot} />
            ))}
        </div>
    );
}

// Matches FoodKPIGrid: 6 cards, grid-cols-2 / md:3 / lg:6
const FOOD_KPI_SLOTS = ["visits", "spent", "rating", "city", "type", "return"] as const;

export function FoodKPIGridSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {FOOD_KPI_SLOTS.map((slot) => (
                <KPICardSkeleton key={slot} />
            ))}
        </div>
    );
}

export function ChartGridSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Filter bar */}
            <FilterBarSkeleton />
            {/* KPI grid */}
            <KPIGridSkeleton />
            {/* Charts */}
            <ChartGridSkeleton />
        </div>
    );
}
