"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MusicEntry } from "@/lib/database.types"
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { Card, CardContent } from "@/components/ui/card"
import { MusicDetailsDialog } from "@/components/music-details-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteMusicEntry } from "@/lib/music-actions"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"

interface MusicTableProps {
    data: MusicEntry[]
}

export function MusicTable({ data }: MusicTableProps) {
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedMusic, setSelectedMusic] = useState<MusicEntry | null>(null)

    const handleEdit = (music: MusicEntry) => {
        setSelectedMusic(music)
        setDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this music entry?")) return
        try {
            const result = await deleteMusicEntry(id)
            if (result.success) {
                toast.success("Music deleted")
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to delete music")
        }
    }

    const columns: ColumnDef<MusicEntry>[] = [
        {
            accessorKey: "cover_url",
            header: "",
            cell: ({ row }) => {
                const cover = row.getValue("cover_url") as string
                return cover ? (
                    <div className="relative w-10 h-10 group">
                        <SafeImage
                            src={cover}
                            alt={row.getValue("title")}
                            fill
                            className="object-cover rounded-sm"
                            sizes="40px"
                            fallbackElement={
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-sm flex items-center justify-center absolute inset-0">
                                    <Eye className="h-4 w-4 text-zinc-400" />
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-sm flex items-center justify-center">
                        <Eye className="h-4 w-4 text-zinc-400" />
                    </div>
                )
            },
            enableSorting: false,
        },
        {
            accessorKey: "title",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="font-medium max-w-xs truncate" title={row.getValue("title")}>
                        {row.getValue("title")}
                    </div>
                )
            },
        },
        {
            accessorKey: "artist",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Artist
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("artist") || "—"}</div>,
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type") as string
                return type ? (
                    <Badge variant="outline" className="font-normal text-xs">
                        {type}
                    </Badge>
                ) : null
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                const variants = {
                    "Finished": "default",
                    "Listening": "secondary",
                    "On Repeat": "secondary",
                    "Dropped": "destructive",
                    "Plan to Listen": "outline",
                } as const

                return status ? (
                    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
                        {status}
                    </Badge>
                ) : null
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string
                if (!value) return true
                return rowValue === value
            },
        },
        {
            accessorKey: "my_rating",
            header: "Rating",
            cell: ({ row }) => {
                const rating = row.getValue("my_rating") as number
                return rating ? (
                    <div className="font-medium text-sm">
                        ★ {rating % 1 === 0 ? rating : rating.toFixed(1)}
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const music = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(music)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(music.id)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const renderMobileCard = (music: MusicEntry) => {
        const statusVariants = {
            "Finished": "default",
            "Listening": "secondary",
            "On Repeat": "secondary",
            "Dropped": "destructive",
            "Plan to Listen": "outline",
        } as const

        return (
            <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEdit(music)}
            >
                <CardContent className="p-3">
                    <div className="flex gap-3">
                        {/* Album Art */}
                        <div className="w-12 h-12 relative bg-muted rounded flex-shrink-0 overflow-hidden">
                            {music.cover_url ? (
                                <SafeImage
                                    src={music.cover_url}
                                    alt={music.title}
                                    fill
                                    className="object-cover"
                                    fallbackElement={
                                        <div className="flex items-center justify-center h-full">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    }
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <h3 className="font-medium text-sm leading-tight line-clamp-2">{music.title}</h3>
                            {music.artist && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{music.artist}</p>
                            )}
                            <div className="mt-1 flex items-center gap-1">
                                {music.status && (
                                    <Badge
                                        variant={statusVariants[music.status as keyof typeof statusVariants] || "outline"}
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {music.status}
                                    </Badge>
                                )}
                            </div>
                            <div className="mt-auto pt-1 flex items-center justify-between">
                                {music.my_rating ? (
                                    <span className="text-xs font-medium">★ {music.my_rating}</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
                                {music.type && (
                                    <span className="text-[10px] text-muted-foreground">{music.type}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={data}
                searchPlaceholder="Search music..."
                renderMobileCard={renderMobileCard}
            />

            <MusicDetailsDialog
                open={detailsOpen}
                onOpenChange={(open) => {
                    setDetailsOpen(open)
                    if (!open) setSelectedMusic(null)
                }}
                entry={selectedMusic}
                onSuccess={() => { }}
            />
        </div>
    )
}
