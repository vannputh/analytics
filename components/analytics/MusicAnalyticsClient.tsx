"use client"

import { MusicEntry } from "@/lib/database.types"
import { useMusicMetrics } from "@/hooks/useMusicMetrics"
import { MusicAnalyticsCharts } from "@/components/analytics/MusicAnalyticsCharts"

interface MusicAnalyticsClientProps {
    music: MusicEntry[]
}

export function MusicAnalyticsClient({ music }: MusicAnalyticsClientProps) {
    const metrics = useMusicMetrics(music)

    return <MusicAnalyticsCharts metrics={metrics} />
}
