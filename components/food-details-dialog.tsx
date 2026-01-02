"use client"

import { useState } from "react"
import { FoodEntry } from "@/lib/database.types"
import { deleteFoodEntry } from "@/lib/food-actions"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Star,
    MapPin,
    Trash2,
    Edit2,
    Instagram,
    Globe,
    Utensils,
    Copy,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatDualCurrency } from "@/lib/food-types"
import Image from "next/image"

interface FoodDetailsDialogProps {
    entry: FoodEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (entry: FoodEntry) => void
    onDelete: (id: string) => void
}

function RatingDisplay({ label, rating }: { label: string; rating: number | null }) {
    if (rating === null || rating === undefined) return null

    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "h-4 w-4",
                            i < Math.floor(rating)
                                ? "fill-amber-400 text-amber-400"
                                : i < rating
                                    ? "fill-amber-400/50 text-amber-400"
                                    : "text-muted-foreground/30"
                        )}
                    />
                ))}
                <span className="ml-2 text-sm font-mono font-medium">{rating.toFixed(1)}</span>
            </div>
        </div>
    )
}

export function FoodDetailsDialog({
    entry,
    open,
    onOpenChange,
    onEdit,
    onDelete,
}: FoodDetailsDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    if (!entry) return null

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this entry?")) return

        setIsDeleting(true)
        try {
            const result = await deleteFoodEntry(entry.id)
            if (result.success) {
                toast.success("Entry deleted")
                onDelete(entry.id)
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to delete entry")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsDeleting(false)
        }
    }

    const copyAddress = () => {
        if (entry.address) {
            navigator.clipboard.writeText(entry.address)
            toast.success("Address copied")
        }
    }

    // Calculate total from items if available
    const itemsTotal = entry.items_ordered && Array.isArray(entry.items_ordered)
        ? entry.items_ordered.reduce((sum, item) => sum + (item.price || 0), 0)
        : 0

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-xl p-0">
                <ScrollArea className="h-full">
                    <div className="p-6 pb-8">
                        <SheetHeader className="text-left">
                            <SheetTitle className="text-xl">{entry.name}</SheetTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {entry.category && (
                                    <Badge variant="outline" className="text-xs">
                                        <Utensils className="h-3 w-3 mr-1" />
                                        {entry.category}
                                    </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    {new Date(entry.visit_date + "T00:00:00").toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </SheetHeader>

                        {/* Cuisine Types */}
                        {entry.cuisine_type && Array.isArray(entry.cuisine_type) && entry.cuisine_type.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {entry.cuisine_type.map((cuisine) => (
                                    <Badge key={cuisine} variant="secondary">
                                        {cuisine}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Separator className="my-4" />

                        {/* Location Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Location
                            </h4>

                            {(entry.neighborhood || entry.city) && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <p className="text-sm">
                                        {[entry.neighborhood, entry.city, entry.country].filter(Boolean).join(", ")}
                                    </p>
                                </div>
                            )}

                            {entry.address && (
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 text-sm text-muted-foreground">
                                        {entry.address}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {/* External Links */}
                            <div className="flex flex-wrap gap-2">
                                {entry.google_maps_url && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={entry.google_maps_url} target="_blank" rel="noopener noreferrer">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            Google Maps
                                        </a>
                                    </Button>
                                )}
                                {entry.instagram_handle && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={`https://instagram.com/${entry.instagram_handle.replace("@", "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Instagram className="h-4 w-4 mr-2" />
                                            {entry.instagram_handle}
                                        </a>
                                    </Button>
                                )}
                                {entry.website_url && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={entry.website_url} target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-4 w-4 mr-2" />
                                            Website
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Ratings Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Ratings
                            </h4>
                            <div className="space-y-1">
                                <RatingDisplay label="Overall" rating={entry.overall_rating} />
                                <RatingDisplay label="Food" rating={entry.food_rating} />
                                <RatingDisplay label="Ambiance" rating={entry.ambiance_rating} />
                                <RatingDisplay label="Service" rating={entry.service_rating} />
                                <RatingDisplay label="Value" rating={entry.value_rating} />
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Price Section */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <span className="text-sm text-muted-foreground">Total</span>
                                <p className="text-lg font-semibold font-mono">
                                    {formatDualCurrency(entry.total_price || itemsTotal)}
                                </p>
                            </div>
                            {entry.price_level && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Price Level</span>
                                    <p className="text-lg font-semibold">{entry.price_level}</p>
                                </div>
                            )}
                        </div>

                        {/* Items Ordered */}
                        {entry.items_ordered && Array.isArray(entry.items_ordered) && entry.items_ordered.length > 0 && (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                        Items Ordered
                                    </h4>
                                    <ul className="space-y-3">
                                        {entry.items_ordered.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                {item.image_url && (
                                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={cn(
                                                            "text-sm truncate",
                                                            item.name === entry.favorite_item && "font-medium text-amber-600"
                                                        )}>
                                                            {item.name}
                                                            {item.name === entry.favorite_item && " ⭐"}
                                                        </span>
                                                        {item.price && (
                                                            <span className="text-sm font-mono text-muted-foreground flex-shrink-0">
                                                                {formatDualCurrency(item.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {/* Notes */}
                        {entry.notes && (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                        Notes
                                    </h4>
                                    <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        <Separator className="my-4" />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onEdit(entry)}
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

export default FoodDetailsDialog
