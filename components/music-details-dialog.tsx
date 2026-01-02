"use client"

import { useState, useEffect } from "react"
import { MusicEntry, MusicEntryInsert } from "@/lib/database.types"
import { createMusicEntry, updateMusicEntry, deleteMusicEntry } from "@/lib/music-actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    MUSIC_TYPE_OPTIONS,
    MUSIC_STATUS_OPTIONS,
    MUSIC_PLATFORM_OPTIONS,
} from "@/lib/music-types"

interface MusicDetailsDialogProps {
    entry: MusicEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function MusicDetailsDialog({
    entry,
    open,
    onOpenChange,
    onSuccess,
}: MusicDetailsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<MusicEntryInsert>>({})

    useEffect(() => {
        if (entry) {
            setFormData({
                title: entry.title,
                artist: entry.artist,
                album: entry.album,
                type: entry.type,
                duration_minutes: entry.duration_minutes,
                status: entry.status,
                platform: entry.platform,
                price: entry.price,
                my_rating: entry.my_rating,
                listen_count: entry.listen_count,
                release_date: entry.release_date,
                notes: entry.notes,
                cover_url: entry.cover_url,
                spotify_id: entry.spotify_id,
                apple_music_id: entry.apple_music_id,
                genre: entry.genre,
            })
        } else {
            setFormData({
                status: "Listening",
                type: "Album",
                platform: "Spotify",
            })
        }
    }, [entry, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!formData.title) {
                toast.error("Title is required")
                return
            }

            const dataToSave = { ...formData } as MusicEntryInsert

            if (entry) {
                const result = await updateMusicEntry(entry.id, dataToSave)
                if (!result.success) throw new Error(result.error)
                toast.success("Music updated")
            } else {
                const result = await createMusicEntry(dataToSave)
                if (!result.success) throw new Error(result.error)
                toast.success("Music added")
            }

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to save music")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!entry || !confirm("Are you sure you want to delete this music entry?")) return

        setLoading(true)
        try {
            const result = await deleteMusicEntry(entry.id)
            if (!result.success) throw new Error(result.error)
            toast.success("Music deleted")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to delete music")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{entry ? "Edit Music" : "Add Music"}</DialogTitle>
                    <DialogDescription>
                        {entry ? "Make changes to your music entry here." : "Add music to your library."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="details">Details & Notes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="title">Title (Track/Album Name) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        value={formData.title || ""}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="artist">Artist</Label>
                                    <Input
                                        id="artist"
                                        value={formData.artist || ""}
                                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="album">Album</Label>
                                    <Input
                                        id="album"
                                        value={formData.album || ""}
                                        onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={formData.type || "Album"}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MUSIC_TYPE_OPTIONS.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status || "Listening"}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MUSIC_STATUS_OPTIONS.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                                    <Input
                                        id="duration_minutes"
                                        type="number"
                                        min="0"
                                        value={formData.duration_minutes || ""}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            setFormData({ ...formData, duration_minutes: isNaN(val) ? null : val })
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="my_rating">My Rating (0-10)</Label>
                                    <Input
                                        id="my_rating"
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={formData.my_rating || ""}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value)
                                            setFormData({ ...formData, my_rating: isNaN(val) ? null : val })
                                        }}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="platform">Platform</Label>
                                    <Select
                                        value={formData.platform || "Spotify"}
                                        onValueChange={(value) => setFormData({ ...formData, platform: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MUSIC_PLATFORM_OPTIONS.map((p) => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="listen_count">Listen Count</Label>
                                    <Input
                                        id="listen_count"
                                        type="number"
                                        min="0"
                                        value={formData.listen_count || "0"}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            setFormData({ ...formData, listen_count: isNaN(val) ? null : val })
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Release Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.release_date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.release_date ? format(new Date(formData.release_date), "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.release_date ? new Date(formData.release_date) : undefined}
                                                onSelect={(date) => setFormData({ ...formData, release_date: date ? format(date, "yyyy-MM-dd") : null })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (if purchased)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price || ""}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value)
                                            setFormData({ ...formData, price: isNaN(val) ? null : val })
                                        }}
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="genre">Genre (Comma separated)</Label>
                                    <Input
                                        id="genre"
                                        value={Array.isArray(formData.genre) ? formData.genre.join(", ") : ""}
                                        onChange={(e) => setFormData({ ...formData, genre: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                        placeholder="Rock, Pop, Jazz"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="cover_url">Cover URL</Label>
                                    <Input
                                        id="cover_url"
                                        value={formData.cover_url || ""}
                                        onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes || ""}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="flex justify-between items-center gap-2">
                        {entry && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                                className="mr-auto"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Music
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {entry ? "Save Changes" : "Add Music"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
