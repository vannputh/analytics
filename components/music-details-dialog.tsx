"use client"

import { useState, useEffect, useRef } from "react"
import { MusicEntry, MusicEntryInsert } from "@/lib/database.types"
import { createMusicEntry, updateMusicEntry, deleteMusicEntry } from "@/lib/music-actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2, Trash2, Upload, Music } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SafeImage } from "@/components/ui/safe-image"
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
    const [activeTab, setActiveTab] = useState("general")
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        setActiveTab("general")
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB")
            return
        }

        const toastId = toast.loading("Uploading cover...")

        try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)
            if (formData.title) {
                uploadFormData.append('title', formData.title)
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            setFormData(prev => ({ ...prev, cover_url: data.url }))
            toast.success("Cover uploaded successfully", { id: toastId })
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to upload cover", { id: toastId })
        }
    }

    const isNewEntry = !entry

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 h-[90vh] md:h-[85vh] flex flex-col gap-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden border-b bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                        {/* Small Cover - Square for album art */}
                        <div className="w-12 h-12 relative rounded overflow-hidden border shadow-sm bg-muted flex-shrink-0 group">
                            {formData.cover_url ? (
                                <SafeImage
                                    src={formData.cover_url}
                                    alt={formData.title || "New Music"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                                    <Music className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="font-semibold text-base truncate h-auto leading-none">
                                {isNewEntry ? "Add New Music" : formData.title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground truncate mt-1">
                                {!isNewEntry && formData.artist ? formData.artist : (isNewEntry ? "Add a new music entry to your library" : "")}
                            </DialogDescription>
                        </div>
                    </div>
                    {/* Horizontal Tabs */}
                    <div className="flex gap-1 mt-3 overflow-x-auto">
                        {(["general", "details"] as const).map(tab => (
                            <Button
                                key={tab}
                                variant={activeTab === tab ? "secondary" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-8 text-xs flex-shrink-0",
                                    activeTab === tab && "bg-secondary font-medium"
                                )}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === "details" ? "Details & Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:flex w-64 bg-muted/30 border-r flex-col p-5 gap-5 overflow-y-auto shrink-0">
                        {/* Cover - Square aspect ratio for album art */}
                        <div className="aspect-square relative rounded-lg overflow-hidden border shadow-sm bg-muted self-center w-full group shrink-0">
                            {formData.cover_url ? (
                                <SafeImage
                                    src={formData.cover_url}
                                    alt={formData.title || "New Music"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                                    <Music className="h-12 w-12" />
                                </div>
                            )}

                            {/* Quick upload overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-white hover:bg-white/20"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Change
                                </Button>
                            </div>
                        </div>

                        {/* Navigation Tabs (Vertical) */}
                        <div className="flex flex-col gap-1 w-full flex-1">
                            {(["general", "details"] as const).map(tab => (
                                <Button
                                    key={tab}
                                    variant={activeTab === tab ? "secondary" : "ghost"}
                                    className={cn(
                                        "justify-start h-9 truncate",
                                        activeTab === tab && "bg-secondary font-medium"
                                    )}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === "details" ? "Details & Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-full">
                        {/* Desktop Header */}
                        <DialogHeader className="hidden md:block px-6 py-4 border-b shrink-0">
                            <DialogTitle className="text-xl truncate" title={formData.title || "New Music"}>
                                {isNewEntry ? "Add New Music" : formData.title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {!isNewEntry && formData.artist ? `by ${formData.artist}` : (isNewEntry ? "Enter the details for the new music entry" : "")}
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1">
                            <form onSubmit={handleSubmit} className="p-4 md:p-6">
                                {/* GENERAL TAB */}
                                {activeTab === "general" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-full">
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

                                        {/* Cover URL with upload */}
                                        <div className="col-span-full space-y-2">
                                            <Label>Cover URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formData.cover_url || ""}
                                                    onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                                                    className="flex-1"
                                                    placeholder="https://..."
                                                />
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    title="Upload new cover"
                                                >
                                                    <Upload className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DETAILS TAB */}
                                {activeTab === "details" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="genre">Genre (Comma separated)</Label>
                                            <Input
                                                id="genre"
                                                value={Array.isArray(formData.genre) ? formData.genre.join(", ") : ""}
                                                onChange={(e) => setFormData({ ...formData, genre: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                                placeholder="Rock, Pop, Jazz"
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                value={formData.notes || ""}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </ScrollArea>

                        <DialogFooter className="border-t p-4 flex justify-between bg-muted/20 shrink-0 w-full z-10">
                            {entry && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-200 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:hover:bg-red-950 dark:text-red-400"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                            <div className={cn("flex gap-2", !entry && "ml-auto")}>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {entry ? "Save Changes" : "Add Music"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
