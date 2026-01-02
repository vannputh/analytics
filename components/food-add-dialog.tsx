"use client"

import { useState, useEffect, useRef } from "react"
import { FoodEntry, FoodEntryInsert, FoodEntryUpdate, ItemOrdered } from "@/lib/database.types"
import { createFoodEntry, updateFoodEntry } from "@/lib/food-actions"
import { CATEGORIES, PRICE_LEVELS, CUISINE_TYPES, FOOD_TAGS, formatDualCurrency, USD_TO_KHR_RATE } from "@/lib/food-types"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Star,
    Loader2,
    X,
    Plus,
    MapPin,
    DollarSign,
    Calendar as CalendarIcon,
    Utensils,
    Camera,
    Upload,
    ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import Image from "next/image"

interface FoodAddDialogProps {
    entry?: FoodEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (entry: FoodEntry) => void
    initialDate?: string
}

function RatingInput({
    label,
    value,
    onChange
}: {
    label: string
    value: number | null
    onChange: (value: number | null) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <Label className="text-sm">{label}</Label>
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(value === i + 1 ? null : i + 1)}
                        className="p-0.5"
                    >
                        <Star
                            className={cn(
                                "h-5 w-5 transition-colors",
                                value !== null && i < value
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30 hover:text-amber-400/50"
                            )}
                        />
                    </button>
                ))}
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="ml-1 p-1 rounded-full hover:bg-muted"
                    >
                        <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                )}
            </div>
        </div>
    )
}

function MultiSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
}: {
    label: string
    options: readonly string[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
}) {
    const toggleOption = (option: string) => {
        if (value.includes(option)) {
            onChange(value.filter((v) => v !== option))
        } else {
            onChange([...value, option])
        }
    }

    return (
        <div className="space-y-2">
            <Label className="text-sm">{label}</Label>
            <div className="flex flex-wrap gap-1 min-h-[38px] p-2 border rounded-md bg-background">
                {value.length === 0 ? (
                    <span className="text-sm text-muted-foreground">{placeholder || "Select..."}</span>
                ) : (
                    value.map((v) => (
                        <Badge key={v} variant="secondary" className="gap-1">
                            {v}
                            <button
                                type="button"
                                onClick={() => onChange(value.filter((val) => val !== v))}
                                className="ml-1 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))
                )}
            </div>
            <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                {options.filter((o) => !value.includes(o)).map((option) => (
                    <Badge
                        key={option}
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => toggleOption(option)}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        {option}
                    </Badge>
                ))}
            </div>
        </div>
    )
}

// Image upload component for place photos
function PlaceImageUpload({
    images,
    onImagesChange,
}: {
    images: { file?: File; preview: string }[]
    onImagesChange: (images: { file?: File; preview: string }[]) => void
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImages: { file: File; preview: string }[] = []
        Array.from(files).forEach((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`)
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                newImages.push({ file, preview: reader.result as string })
                if (newImages.length === files.length) {
                    onImagesChange([...images, ...newImages])
                }
            }
            reader.readAsDataURL(file)
        })

        // Reset inputs
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (cameraInputRef.current) cameraInputRef.current.value = ''
    }

    const removeImage = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-3">
            <Label className="text-sm">Place Photos</Label>

            {/* Image previews */}
            {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                        <div key={index} className="relative flex-shrink-0">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                <Image
                                    src={img.preview}
                                    alt={`Place photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload buttons */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                </Button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    )
}

// Updated ItemsInput for ItemOrdered[] with prices and photo uploads
function ItemsOrderedInput({
    value,
    onChange,
    favoriteItem,
    onFavoriteChange,
}: {
    value: (ItemOrdered & { file?: File; preview?: string })[]
    onChange: (value: (ItemOrdered & { file?: File; preview?: string })[]) => void
    favoriteItem: string | null
    onFavoriteChange: (value: string | null) => void
}) {
    const [newItemName, setNewItemName] = useState("")
    const [newItemPrice, setNewItemPrice] = useState("")
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

    const addItem = () => {
        if (newItemName.trim()) {
            const newItem: ItemOrdered & { file?: File; preview?: string } = {
                name: newItemName.trim(),
                price: newItemPrice ? parseFloat(newItemPrice) : null,
                image_url: null,
            }
            onChange([...value, newItem])
            setNewItemName("")
            setNewItemPrice("")
        }
    }

    const removeItem = (index: number) => {
        const item = value[index]
        if (favoriteItem === item.name) {
            onFavoriteChange(null)
        }
        onChange(value.filter((_, i) => i !== index))
    }

    const updateItemPrice = (index: number, price: string) => {
        const updated = [...value]
        updated[index] = { ...updated[index], price: price ? parseFloat(price) : null }
        onChange(updated)
    }

    const handleItemImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large (max 5MB)")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const updated = [...value]
            updated[index] = {
                ...updated[index],
                file,
                preview: reader.result as string
            }
            onChange(updated)
        }
        reader.readAsDataURL(file)
    }

    const removeItemImage = (index: number) => {
        const updated = [...value]
        updated[index] = {
            ...updated[index],
            file: undefined,
            preview: undefined,
            image_url: null
        }
        onChange(updated)
    }

    // Calculate total from items
    const total = value.reduce((sum, item) => sum + (item.price || 0), 0)

    return (
        <div className="space-y-4">
            <Label className="text-sm">Items Ordered</Label>

            {/* Add new item */}
            <div className="flex gap-2">
                <Input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Item name..."
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            addItem()
                        }
                    }}
                />
                <Input
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="$0"
                    type="number"
                    step="0.01"
                    className="w-20"
                />
                <Button type="button" variant="outline" size="icon" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Items list */}
            {value.length > 0 && (
                <div className="space-y-3">
                    {value.map((item, index) => (
                        <div
                            key={index}
                            className="p-3 rounded-lg bg-muted/50 space-y-2"
                        >
                            <div className="flex items-center gap-2">
                                {/* Item image preview or add buttons */}
                                <div className="relative flex-shrink-0">
                                    {item.preview || item.image_url ? (
                                        <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                            <Image
                                                src={item.preview || item.image_url || ''}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeItemImage(index)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRefs.current[`file_${index}`]?.click()}
                                                className="w-10 h-10 rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                                title="Upload photo"
                                            >
                                                <Upload className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRefs.current[`camera_${index}`]?.click()}
                                                className="w-10 h-10 rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                                title="Take photo"
                                            >
                                                <Camera className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        ref={(el) => { fileInputRefs.current[`file_${index}`] = el }}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleItemImage(index, e)}
                                    />
                                    <input
                                        ref={(el) => { fileInputRefs.current[`camera_${index}`] = el }}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleItemImage(index, e)}
                                    />
                                </div>

                                {/* Item name */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate block">{item.name}</span>
                                </div>

                                {/* Price input */}
                                <Input
                                    value={item.price?.toString() || ""}
                                    onChange={(e) => updateItemPrice(index, e.target.value)}
                                    placeholder="$0"
                                    type="number"
                                    step="0.01"
                                    className="w-20 h-8 text-sm"
                                />

                                {/* Favorite toggle */}
                                <button
                                    type="button"
                                    onClick={() => onFavoriteChange(favoriteItem === item.name ? null : item.name)}
                                    className={cn(
                                        "p-1 rounded-full",
                                        favoriteItem === item.name
                                            ? "text-amber-500"
                                            : "text-muted-foreground hover:text-amber-500"
                                    )}
                                    title="Set as favorite"
                                >
                                    <Star className={cn("h-4 w-4", favoriteItem === item.name && "fill-current")} />
                                </button>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="p-1 rounded-full text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Total display */}
                    {total > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm font-medium">Items Total:</span>
                            <span className="font-mono text-sm">{formatDualCurrency(total)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function FoodAddDialog({
    entry,
    open,
    onOpenChange,
    onSuccess,
    initialDate,
}: FoodAddDialogProps) {
    const isEditing = !!entry
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [visitDate, setVisitDate] = useState<Date | undefined>(undefined)
    const [category, setCategory] = useState<string>("")
    const [address, setAddress] = useState("")
    const [googleMapsUrl, setGoogleMapsUrl] = useState("")
    const [neighborhood, setNeighborhood] = useState("")
    const [city, setCity] = useState("")
    const [country, setCountry] = useState("Cambodia")
    const [instagramHandle, setInstagramHandle] = useState("")
    const [websiteUrl, setWebsiteUrl] = useState("")
    const [cuisineTypes, setCuisineTypes] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [itemsOrdered, setItemsOrdered] = useState<(ItemOrdered & { file?: File; preview?: string })[]>([])
    const [favoriteItem, setFavoriteItem] = useState<string | null>(null)
    const [overallRating, setOverallRating] = useState<number | null>(null)
    const [foodRating, setFoodRating] = useState<number | null>(null)
    const [ambianceRating, setAmbianceRating] = useState<number | null>(null)
    const [serviceRating, setServiceRating] = useState<number | null>(null)
    const [valueRating, setValueRating] = useState<number | null>(null)
    const [totalPrice, setTotalPrice] = useState<string>("")
    const [priceLevel, setPriceLevel] = useState<string>("")
    const [notes, setNotes] = useState("")
    const [placeImages, setPlaceImages] = useState<{ file?: File; preview: string }[]>([])

    // Calculate total from items for display
    const itemsTotal = itemsOrdered.reduce((sum, item) => sum + (item.price || 0), 0)
    const displayTotal = totalPrice ? parseFloat(totalPrice) : itemsTotal

    // Initialize form from entry or defaults
    useEffect(() => {
        if (entry) {
            setName(entry.name)
            setVisitDate(entry.visit_date ? new Date(entry.visit_date + "T00:00:00") : undefined)
            setCategory(entry.category || "")
            setAddress(entry.address || "")
            setGoogleMapsUrl(entry.google_maps_url || "")
            setNeighborhood(entry.neighborhood || "")
            setCity(entry.city || "")
            setCountry(entry.country || "Cambodia")
            setInstagramHandle(entry.instagram_handle || "")
            setWebsiteUrl(entry.website_url || "")
            setCuisineTypes(entry.cuisine_type || [])
            setTags(entry.tags || [])
            // Map existing items to include preview property
            setItemsOrdered(
                (entry.items_ordered || []).map(item => ({
                    ...item,
                    preview: item.image_url || undefined
                }))
            )
            setFavoriteItem(entry.favorite_item || null)
            setOverallRating(entry.overall_rating)
            setFoodRating(entry.food_rating)
            setAmbianceRating(entry.ambiance_rating)
            setServiceRating(entry.service_rating)
            setValueRating(entry.value_rating)
            setTotalPrice(entry.total_price?.toString() || "")
            setPriceLevel(entry.price_level || "")
            setNotes(entry.notes || "")
            setPlaceImages([]) // TODO: Load existing place images
        } else {
            // Reset for new entry
            setName("")
            setVisitDate(initialDate ? new Date(initialDate + "T00:00:00") : new Date())
            setCategory("")
            setAddress("")
            setGoogleMapsUrl("")
            setNeighborhood("")
            setCity("")
            setCountry("Cambodia")
            setInstagramHandle("")
            setWebsiteUrl("")
            setCuisineTypes([])
            setTags([])
            setItemsOrdered([])
            setFavoriteItem(null)
            setOverallRating(null)
            setFoodRating(null)
            setAmbianceRating(null)
            setServiceRating(null)
            setValueRating(null)
            setTotalPrice("")
            setPriceLevel("")
            setNotes("")
            setPlaceImages([])
        }
    }, [entry, initialDate, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error("Please enter a name")
            return
        }

        if (!visitDate) {
            toast.error("Please select a date")
            return
        }

        setIsSubmitting(true)

        try {
            // Calculate final total - use manual entry if provided, otherwise sum of items
            const finalTotal = totalPrice ? parseFloat(totalPrice) : itemsTotal || null

            // Prepare items data (without file references for database)
            const itemsForDb: ItemOrdered[] = itemsOrdered.map(item => ({
                name: item.name,
                price: item.price,
                image_url: item.image_url || item.preview || null // Use preview URL for now
            }))

            const data: FoodEntryInsert | FoodEntryUpdate = {
                name: name.trim(),
                visit_date: format(visitDate, "yyyy-MM-dd"),
                category: category || null,
                address: address || null,
                google_maps_url: googleMapsUrl || null,
                neighborhood: neighborhood || null,
                city: city || null,
                country: country || null,
                instagram_handle: instagramHandle || null,
                website_url: websiteUrl || null,
                cuisine_type: cuisineTypes.length > 0 ? cuisineTypes : null,
                tags: tags.length > 0 ? tags : null,
                items_ordered: itemsForDb.length > 0 ? itemsForDb : null,
                favorite_item: favoriteItem,
                overall_rating: overallRating,
                food_rating: foodRating,
                ambiance_rating: ambianceRating,
                service_rating: serviceRating,
                value_rating: valueRating,
                total_price: finalTotal,
                currency: "USD",
                price_level: priceLevel || null,
                notes: notes || null,
            }

            let result
            if (isEditing && entry) {
                result = await updateFoodEntry(entry.id, data)
            } else {
                result = await createFoodEntry(data as FoodEntryInsert)
            }

            if (result.success) {
                // TODO: Upload place images to storage after entry is created
                // TODO: Upload item images to storage after entry is created

                toast.success(isEditing ? "Entry updated" : "Entry added")
                onSuccess(result.data)
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to save entry")
            }
        } catch (error) {
            console.error("Error saving entry:", error)
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-xl p-0">
                <ScrollArea className="h-full">
                    <form onSubmit={handleSubmit} className="p-6 pb-8 space-y-6">
                        <SheetHeader className="text-left">
                            <SheetTitle>{isEditing ? "Edit Entry" : "Add Entry"}</SheetTitle>
                            <SheetDescription>
                                {isEditing ? "Update your dining experience" : "Record a new dining experience"}
                            </SheetDescription>
                        </SheetHeader>

                        {/* Place Photos */}
                        <PlaceImageUpload
                            images={placeImages}
                            onImagesChange={setPlaceImages}
                        />

                        <Separator />

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Restaurant / Place Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Sushi Masato"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Visit Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !visitDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {visitDate ? format(visitDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={visitDate}
                                                onSelect={setVisitDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Location */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="neighborhood">Neighborhood</Label>
                                    <Input
                                        id="neighborhood"
                                        value={neighborhood}
                                        onChange={(e) => setNeighborhood(e.target.value)}
                                        placeholder="e.g., BKK1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="e.g., Phnom Penh"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Full address..."
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                                <Input
                                    id="googleMapsUrl"
                                    value={googleMapsUrl}
                                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    type="url"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="instagramHandle">Instagram</Label>
                                    <Input
                                        id="instagramHandle"
                                        value={instagramHandle}
                                        onChange={(e) => setInstagramHandle(e.target.value)}
                                        placeholder="@restaurant"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="websiteUrl">Website</Label>
                                    <Input
                                        id="websiteUrl"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        placeholder="https://..."
                                        type="url"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Categories */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Utensils className="h-4 w-4" />
                                Categories
                            </h4>

                            <MultiSelect
                                label="Cuisine Type"
                                options={CUISINE_TYPES}
                                value={cuisineTypes}
                                onChange={setCuisineTypes}
                                placeholder="Select cuisines..."
                            />

                            <MultiSelect
                                label="Tags"
                                options={FOOD_TAGS}
                                value={tags}
                                onChange={setTags}
                                placeholder="Select tags..."
                            />
                        </div>

                        <Separator />

                        {/* Items Ordered with prices and photos */}
                        <ItemsOrderedInput
                            value={itemsOrdered}
                            onChange={setItemsOrdered}
                            favoriteItem={favoriteItem}
                            onFavoriteChange={setFavoriteItem}
                        />

                        <Separator />

                        {/* Ratings */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Ratings
                            </h4>

                            <div className="space-y-3">
                                <RatingInput label="Overall" value={overallRating} onChange={setOverallRating} />
                                <RatingInput label="Food" value={foodRating} onChange={setFoodRating} />
                                <RatingInput label="Ambiance" value={ambianceRating} onChange={setAmbianceRating} />
                                <RatingInput label="Service" value={serviceRating} onChange={setServiceRating} />
                                <RatingInput label="Value" value={valueRating} onChange={setValueRating} />
                            </div>
                        </div>

                        <Separator />

                        {/* Price */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Price
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="totalPrice">Total (USD)</Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="totalPrice"
                                            value={totalPrice}
                                            onChange={(e) => setTotalPrice(e.target.value)}
                                            placeholder={itemsTotal > 0 ? itemsTotal.toString() : "0"}
                                            type="number"
                                            step="0.01"
                                        />
                                        {displayTotal > 0 && (
                                            <p className="text-xs text-muted-foreground font-mono">
                                                = ៛{(displayTotal * USD_TO_KHR_RATE).toLocaleString()} KHR
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priceLevel">Price Level</Label>
                                    <Select value={priceLevel} onValueChange={setPriceLevel}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRICE_LEVELS.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes about your experience..."
                                rows={4}
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : isEditing ? (
                                    "Update Entry"
                                ) : (
                                    "Add Entry"
                                )}
                            </Button>
                        </div>
                    </form>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

export default FoodAddDialog
