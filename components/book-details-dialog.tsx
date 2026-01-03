"use client"

import { useState, useEffect, useRef } from "react"
import { BookEntry, BookEntryInsert } from "@/lib/database.types"
import { createBookEntry, updateBookEntry, deleteBookEntry } from "@/lib/book-actions"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2, Trash2, Upload, BookOpen } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SafeImage } from "@/components/ui/safe-image"
import {
    BOOK_FORMAT_OPTIONS,
    BOOK_STATUS_OPTIONS,
    BOOK_PLATFORM_OPTIONS,
} from "@/lib/book-types"

interface BookDetailsDialogProps {
    entry: BookEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function BookDetailsDialog({
    entry,
    open,
    onOpenChange,
    onSuccess,
}: BookDetailsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<BookEntryInsert>>({})
    const [activeTab, setActiveTab] = useState("general")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (entry) {
            setFormData({
                title: entry.title,
                author: entry.author,
                publisher: entry.publisher,
                isbn: entry.isbn,
                pages: entry.pages,
                format: entry.format,
                status: entry.status,
                platform: entry.platform,
                price: entry.price,
                my_rating: entry.my_rating,
                start_date: entry.start_date,
                finish_date: entry.finish_date,
                notes: entry.notes,
                cover_url: entry.cover_url,
                series_name: entry.series_name,
                series_number: entry.series_number,
                language: entry.language,
                genre: entry.genre,
            })
        } else {
            setFormData({
                status: "Plan to Read",
                format: "Physical",
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

            const dataToSave = { ...formData } as BookEntryInsert

            if (entry) {
                const result = await updateBookEntry(entry.id, dataToSave)
                if (!result.success) throw new Error(result.error)
                toast.success("Book updated")
            } else {
                const result = await createBookEntry(dataToSave)
                if (!result.success) throw new Error(result.error)
                toast.success("Book added")
            }

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to save book")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!entry || !confirm("Are you sure you want to delete this book?")) return

        setLoading(true)
        try {
            const result = await deleteBookEntry(entry.id)
            if (!result.success) throw new Error(result.error)
            toast.success("Book deleted")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to delete book")
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
                        {/* Small Cover */}
                        <div className="w-10 h-14 relative rounded overflow-hidden border shadow-sm bg-muted flex-shrink-0 group">
                            {formData.cover_url ? (
                                <SafeImage
                                    src={formData.cover_url}
                                    alt={formData.title || "New Book"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="font-semibold text-base truncate h-auto leading-none">
                                {isNewEntry ? "Add New Book" : formData.title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground truncate mt-1">
                                {!isNewEntry && formData.author ? formData.author : (isNewEntry ? "Add a new book to your library" : "")}
                            </DialogDescription>
                        </div>
                    </div>
                    {/* Horizontal Tabs */}
                    <div className="flex gap-1 mt-3 overflow-x-auto">
                        {(["general", "details", "dates"] as const).map(tab => (
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
                                {tab === "dates" ? "Dates & Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:flex w-64 bg-muted/30 border-r flex-col p-5 gap-5 overflow-y-auto shrink-0">
                        {/* Cover */}
                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden border shadow-sm bg-muted self-center w-full group shrink-0">
                            {formData.cover_url ? (
                                <SafeImage
                                    src={formData.cover_url}
                                    alt={formData.title || "New Book"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                                    <BookOpen className="h-12 w-12" />
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
                            {(["general", "details", "dates"] as const).map(tab => (
                                <Button
                                    key={tab}
                                    variant={activeTab === tab ? "secondary" : "ghost"}
                                    className={cn(
                                        "justify-start h-9 truncate",
                                        activeTab === tab && "bg-secondary font-medium"
                                    )}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === "dates" ? "Dates & Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-full">
                        {/* Desktop Header */}
                        <DialogHeader className="hidden md:block px-6 py-4 border-b shrink-0">
                            <DialogTitle className="text-xl truncate" title={formData.title || "New Book"}>
                                {isNewEntry ? "Add New Book" : formData.title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {!isNewEntry && formData.author ? `by ${formData.author}` : (isNewEntry ? "Enter the details for the new book" : "")}
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1">
                            <form onSubmit={handleSubmit} className="p-4 md:p-6">
                                {/* GENERAL TAB */}
                                {activeTab === "general" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="title"
                                                value={formData.title || ""}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Book Title"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="author">Author</Label>
                                            <Input
                                                id="author"
                                                value={formData.author || ""}
                                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                placeholder="Author Name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={formData.status || "Plan to Read"}
                                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BOOK_STATUS_OPTIONS.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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

                                        <div className="space-y-2">
                                            <Label htmlFor="format">Format</Label>
                                            <Select
                                                value={formData.format || "Physical"}
                                                onValueChange={(value) => setFormData({ ...formData, format: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BOOK_FORMAT_OPTIONS.map((fmt) => (
                                                        <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pages">Pages</Label>
                                            <Input
                                                id="pages"
                                                type="number"
                                                min="0"
                                                value={formData.pages || ""}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value)
                                                    setFormData({ ...formData, pages: isNaN(val) ? null : val })
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
                                            <Label htmlFor="series_name">Series Name</Label>
                                            <Input
                                                id="series_name"
                                                value={formData.series_name || ""}
                                                onChange={(e) => setFormData({ ...formData, series_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="series_number">Series #</Label>
                                            <Input
                                                id="series_number"
                                                type="number"
                                                value={formData.series_number || ""}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value)
                                                    setFormData({ ...formData, series_number: isNaN(val) ? null : val })
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="publisher">Publisher</Label>
                                            <Input
                                                id="publisher"
                                                value={formData.publisher || ""}
                                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="isbn">ISBN</Label>
                                            <Input
                                                id="isbn"
                                                value={formData.isbn || ""}
                                                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="platform">Source/Platform</Label>
                                            <Select
                                                value={formData.platform || "Physical"}
                                                onValueChange={(value) => setFormData({ ...formData, platform: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select platform" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BOOK_PLATFORM_OPTIONS.map((p) => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="price">Price</Label>
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
                                                placeholder="Fiction, Sci-Fi, Mystery"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* DATES TAB */}
                                {activeTab === "dates" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !formData.start_date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {formData.start_date ? format(new Date(formData.start_date), "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.start_date ? new Date(formData.start_date) : undefined}
                                                        onSelect={(date) => setFormData({ ...formData, start_date: date ? format(date, "yyyy-MM-dd") : null })}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Finish Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !formData.finish_date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {formData.finish_date ? format(new Date(formData.finish_date), "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.finish_date ? new Date(formData.finish_date) : undefined}
                                                        onSelect={(date) => setFormData({ ...formData, finish_date: date ? format(date, "yyyy-MM-dd") : null })}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
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
                                    {entry ? "Save Changes" : "Add Book"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
