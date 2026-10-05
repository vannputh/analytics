"use client"

import { useState, useEffect, useRef } from "react"
import { FoodEntry, FoodEntryInsert, FoodEntryUpdate, ItemOrdered } from "@/lib/database.types"
import {
    createFoodEntry,
    updateFoodEntry,
    uploadFoodImage,
    uploadFoodImageFromUrl,
    addFoodEntryImage,
    getFoodEntry,
    getUniqueCuisineTypes,
    getUniqueItemCategories
} from "@/lib/food-actions"
import { PRICE_LEVELS, FOOD_TAGS, DINING_OPTIONS, formatRestaurantDisplayName, USD_TO_KHR_RATE } from "@/lib/food-types"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    DollarSign,
    Calendar as CalendarIcon,
    Utensils,
    Upload,
    ArrowRight,
    Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns/format"
import { isValid } from "date-fns/isValid"
import Image from "next/image"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel"
import { RatingInput, CuisineSelector, MultiSelectInput, PlaceImageUpload, ItemsOrderedInput } from "@/components/form-inputs"
import { useFoodPlaceAutocomplete, type FoodAutocompleteSuggestion } from "@/hooks/useFoodPlaceAutocomplete"
import type { FoodPlaceDetailsResponse } from "@/lib/food-place-types"
import {
    createFoodFormSnapshot,
    getFoodSaveProgressLabel,
    mapWithConcurrency,
    normalizePlaceImages,
    parseLocalDateInput,
    type FoodImageDraft,
    type FoodSaveProgress,
} from "@/lib/food-add-utils"

interface FoodAddDialogProps {
    entry?: FoodEntry | null
    /** When set (and entry is null), form is initialized from this entry as a new visit (e.g. "Log again"); visit date defaults to initialDate or today. */
    template?: FoodEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (entry: FoodEntry) => void
    initialDate?: string
}


export function FoodAddDialog({
    entry,
    template,
    open,
    onOpenChange,
    onSuccess,
    initialDate,
}: FoodAddDialogProps) {
    const isEditing = !!entry
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [branch, setBranch] = useState("")
    const [visitDate, setVisitDate] = useState<Date | undefined>(
        entry?.visit_date
            ? parseLocalDateInput(entry.visit_date)
            : initialDate
                ? parseLocalDateInput(initialDate)
                : undefined
    )
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
    const [diningType, setDiningType] = useState<string>("")
    const [wouldReturn, setWouldReturn] = useState<boolean | null>(null)
    const [notes, setNotes] = useState("")
    const [placeImages, setPlaceImages] = useState<FoodImageDraft[]>([])
    const sidebarFileInputRef = useRef<HTMLInputElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
    const baselineRef = useRef<string | null>(null)
    const [saveProgress, setSaveProgress] = useState<FoodSaveProgress>({
        phase: "idle",
        placeUploaded: 0,
        placeTotal: 0,
        itemUploaded: 0,
        itemTotal: 0,
    })

    // Restaurant name autocomplete
    const [placeSuggestionsOpen, setPlaceSuggestionsOpen] = useState(false)
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
    const [isNameFocused, setIsNameFocused] = useState(false)
    const ignoreBlurRef = useRef(false)
    const lastAutofillKeyRef = useRef<string | null>(null)

    const handlePlaceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const validFiles: File[] = []
        Array.from(files).forEach((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`)
            } else {
                validFiles.push(file)
            }
        })

        if (validFiles.length === 0) return

        const readPromises = validFiles.map((file, idx) => {
            return new Promise<{ file: File; preview: string; is_primary: boolean }>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    resolve({
                        file,
                        preview: reader.result as string,
                        is_primary: placeImages.length === 0 && idx === 0
                    })
                }
                reader.readAsDataURL(file)
            })
        })

        const newImages = await Promise.all(readPromises)
        setPlaceImages(prev => normalizePlaceImages([...prev, ...newImages]))

        if (sidebarFileInputRef.current) sidebarFileInputRef.current.value = ''
    }

    const [isAutofilling, setIsAutofilling] = useState(false)
    const [availableCuisines, setAvailableCuisines] = useState<string[]>([])
    const [availableItemCategories, setAvailableItemCategories] = useState<string[]>([])

    const {
        suggestions: placeSuggestions,
        isSearching: isSearchingPlaces,
    } = useFoodPlaceAutocomplete({
        open,
        isEditing,
        query: name,
    })

    useEffect(() => {
        if (!isNameFocused || isEditing) {
            setPlaceSuggestionsOpen(false)
            setSelectedSuggestionIndex(-1)
            return
        }

        const shouldOpen = name.trim().length >= 2 && placeSuggestions.length > 0
        setPlaceSuggestionsOpen(shouldOpen)
        if (!shouldOpen) {
            setSelectedSuggestionIndex(-1)
        }
    }, [isNameFocused, isEditing, name, placeSuggestions.length])

    useEffect(() => {
        if (selectedSuggestionIndex >= placeSuggestions.length) {
            setSelectedSuggestionIndex(-1)
        }
    }, [selectedSuggestionIndex, placeSuggestions.length])

    // Load available cuisines and item categories
    useEffect(() => {
        async function loadOptions() {
            const [cuisineResult, categoryResult] = await Promise.all([
                getUniqueCuisineTypes(),
                getUniqueItemCategories()
            ])
            if (cuisineResult.success) {
                setAvailableCuisines(cuisineResult.data)
            }
            if (categoryResult.success) {
                setAvailableItemCategories(categoryResult.data)
            }
        }
        loadOptions()
    }, [])

    // Calculate total from items for display
    const itemsTotal = itemsOrdered.reduce((sum, item) => sum + (item.price || 0), 0)
    const displayTotal = totalPrice ? parseFloat(totalPrice) : itemsTotal

    // Initialize form from entry, template (duplicate), or defaults
    useEffect(() => {
        if (!open) return

        setSelectedSuggestionIndex(-1)
        setPlaceSuggestionsOpen(false)
        setSaveProgress({
            phase: "idle",
            placeUploaded: 0,
            placeTotal: 0,
            itemUploaded: 0,
            itemTotal: 0,
        })
        lastAutofillKeyRef.current = null

        if (entry) {
            const nextName = entry.name
            const nextBranch = entry.branch ?? ""
            const nextVisitDate = parseLocalDateInput(entry.visit_date)
            const nextCategory = entry.category || ""
            const nextAddress = entry.address || ""
            const nextGoogleMapsUrl = entry.google_maps_url || ""
            const nextNeighborhood = entry.neighborhood || ""
            const nextCity = entry.city || ""
            const nextCountry = entry.country || "Cambodia"
            const nextInstagramHandle = entry.instagram_handle || ""
            const nextWebsiteUrl = entry.website_url || ""
            const nextCuisineTypes = entry.cuisine_type || []
            const nextTags = entry.tags || []
            const nextItems = (entry.items_ordered || []).map(item => ({
                ...item,
                preview: item.image_url || undefined
            }))
            const nextFavoriteItem = entry.favorite_item || null
            const nextOverallRating = entry.overall_rating
            const nextFoodRating = entry.food_rating
            const nextAmbianceRating = entry.ambiance_rating
            const nextServiceRating = entry.service_rating
            const nextValueRating = entry.value_rating
            const nextTotalPrice = entry.total_price?.toString() || ""
            const nextPriceLevel = entry.price_level || ""
            const nextDiningType = entry.dining_type || ""
            const nextWouldReturn = entry.would_return ?? null
            const nextNotes = entry.notes || ""
            const nextPlaceImages = normalizePlaceImages(entry.images?.map(img => ({
                preview: img.image_url,
                is_primary: img.is_primary
            })) || [])

            setName(nextName)
            setBranch(nextBranch)
            setVisitDate(nextVisitDate)
            setCategory(nextCategory)
            setAddress(nextAddress)
            setGoogleMapsUrl(nextGoogleMapsUrl)
            setNeighborhood(nextNeighborhood)
            setCity(nextCity)
            setCountry(nextCountry)
            setInstagramHandle(nextInstagramHandle)
            setWebsiteUrl(nextWebsiteUrl)
            setCuisineTypes(nextCuisineTypes)
            setTags(nextTags)
            setItemsOrdered(nextItems)
            setFavoriteItem(nextFavoriteItem)
            setOverallRating(nextOverallRating)
            setFoodRating(nextFoodRating)
            setAmbianceRating(nextAmbianceRating)
            setServiceRating(nextServiceRating)
            setValueRating(nextValueRating)
            setTotalPrice(nextTotalPrice)
            setPriceLevel(nextPriceLevel)
            setDiningType(nextDiningType)
            setWouldReturn(nextWouldReturn)
            setNotes(nextNotes)
            setPlaceImages(nextPlaceImages)

            baselineRef.current = createFoodFormSnapshot({
                name: nextName,
                branch: nextBranch,
                visitDate: nextVisitDate,
                category: nextCategory,
                address: nextAddress,
                googleMapsUrl: nextGoogleMapsUrl,
                neighborhood: nextNeighborhood,
                city: nextCity,
                country: nextCountry,
                instagramHandle: nextInstagramHandle,
                websiteUrl: nextWebsiteUrl,
                cuisineTypes: nextCuisineTypes,
                tags: nextTags,
                items: nextItems.map((item) => ({
                    name: item.name,
                    price: item.price,
                    categories: item.categories || (item.category ? [item.category] : []),
                    imageIdentity: item.image_url || null,
                })),
                favoriteItem: nextFavoriteItem || "",
                overallRating: nextOverallRating,
                foodRating: nextFoodRating,
                ambianceRating: nextAmbianceRating,
                serviceRating: nextServiceRating,
                valueRating: nextValueRating,
                totalPrice: nextTotalPrice,
                priceLevel: nextPriceLevel,
                diningType: nextDiningType,
                wouldReturn: nextWouldReturn,
                notes: nextNotes,
                placeImages: nextPlaceImages,
            })
            return
        }

        if (template) {
            const templateVisitDate = parseLocalDateInput(initialDate) || new Date()
            const nextName = template.name
            const nextBranch = template.branch ?? ""
            const nextCategory = template.category || ""
            const nextAddress = template.address || ""
            const nextGoogleMapsUrl = template.google_maps_url || ""
            const nextNeighborhood = template.neighborhood || ""
            const nextCity = template.city || ""
            const nextCountry = template.country || "Cambodia"
            const nextInstagramHandle = template.instagram_handle || ""
            const nextWebsiteUrl = template.website_url || ""
            const nextCuisineTypes = template.cuisine_type || []
            const nextTags = template.tags || []
            const nextItems = (template.items_ordered || []).map(item => ({
                ...item,
                preview: item.image_url || undefined
            }))
            const nextFavoriteItem = template.favorite_item || null
            const nextOverallRating = template.overall_rating
            const nextFoodRating = template.food_rating
            const nextAmbianceRating = template.ambiance_rating
            const nextServiceRating = template.service_rating
            const nextValueRating = template.value_rating
            const nextTotalPrice = template.total_price?.toString() || ""
            const nextPriceLevel = template.price_level || ""
            const nextDiningType = template.dining_type || ""
            const nextWouldReturn = template.would_return ?? null
            const nextNotes = template.notes || ""
            const nextPlaceImages = normalizePlaceImages(template.images?.map(img => ({
                preview: img.image_url,
                is_primary: img.is_primary
            })) || [])

            setName(nextName)
            setBranch(nextBranch)
            setVisitDate(templateVisitDate)
            setCategory(nextCategory)
            setAddress(nextAddress)
            setGoogleMapsUrl(nextGoogleMapsUrl)
            setNeighborhood(nextNeighborhood)
            setCity(nextCity)
            setCountry(nextCountry)
            setInstagramHandle(nextInstagramHandle)
            setWebsiteUrl(nextWebsiteUrl)
            setCuisineTypes(nextCuisineTypes)
            setTags(nextTags)
            setItemsOrdered(nextItems)
            setFavoriteItem(nextFavoriteItem)
            setOverallRating(nextOverallRating)
            setFoodRating(nextFoodRating)
            setAmbianceRating(nextAmbianceRating)
            setServiceRating(nextServiceRating)
            setValueRating(nextValueRating)
            setTotalPrice(nextTotalPrice)
            setPriceLevel(nextPriceLevel)
            setDiningType(nextDiningType)
            setWouldReturn(nextWouldReturn)
            setNotes(nextNotes)
            setPlaceImages(nextPlaceImages)

            baselineRef.current = createFoodFormSnapshot({
                name: nextName,
                branch: nextBranch,
                visitDate: templateVisitDate,
                category: nextCategory,
                address: nextAddress,
                googleMapsUrl: nextGoogleMapsUrl,
                neighborhood: nextNeighborhood,
                city: nextCity,
                country: nextCountry,
                instagramHandle: nextInstagramHandle,
                websiteUrl: nextWebsiteUrl,
                cuisineTypes: nextCuisineTypes,
                tags: nextTags,
                items: nextItems.map((item) => ({
                    name: item.name,
                    price: item.price,
                    categories: item.categories || (item.category ? [item.category] : []),
                    imageIdentity: item.image_url || null,
                })),
                favoriteItem: nextFavoriteItem || "",
                overallRating: nextOverallRating,
                foodRating: nextFoodRating,
                ambianceRating: nextAmbianceRating,
                serviceRating: nextServiceRating,
                valueRating: nextValueRating,
                totalPrice: nextTotalPrice,
                priceLevel: nextPriceLevel,
                diningType: nextDiningType,
                wouldReturn: nextWouldReturn,
                notes: nextNotes,
                placeImages: nextPlaceImages,
            })
            return
        }

        const defaultVisit = parseLocalDateInput(initialDate) || new Date()
        setName("")
        setBranch("")
        setVisitDate(defaultVisit)
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
        setDiningType("")
        setWouldReturn(null)
        setNotes("")
        setPlaceImages([])
        setSaveProgress({
            phase: "idle",
            placeUploaded: 0,
            placeTotal: 0,
            itemUploaded: 0,
            itemTotal: 0,
        })

        baselineRef.current = createFoodFormSnapshot({
            name: "",
            branch: "",
            visitDate: defaultVisit,
            category: "",
            address: "",
            googleMapsUrl: "",
            neighborhood: "",
            city: "",
            country: "Cambodia",
            instagramHandle: "",
            websiteUrl: "",
            cuisineTypes: [],
            tags: [],
            items: [],
            favoriteItem: "",
            overallRating: null,
            foodRating: null,
            ambianceRating: null,
            serviceRating: null,
            valueRating: null,
            totalPrice: "",
            priceLevel: "",
            diningType: "",
            wouldReturn: null,
            notes: "",
            placeImages: [],
        })
    }, [entry, template, initialDate, open])

    // When opening edit with an entry that has no images (e.g. from calendar), fetch full entry so place images load
    useEffect(() => {
        if (!open || !entry?.id) return
        const hasImages = entry.images && entry.images.length > 0
        if (hasImages) return

        let cancelled = false
        getFoodEntry(entry.id).then((result) => {
            if (cancelled || !result.success) return
            const fullEntry = result.data as { images?: { image_url: string; is_primary: boolean }[] }
            if (fullEntry.images && fullEntry.images.length > 0) {
                const hydratedImages = normalizePlaceImages(
                    fullEntry.images.map((img) => ({
                        preview: img.image_url,
                        is_primary: img.is_primary,
                    }))
                )
                setPlaceImages(hydratedImages)
                baselineRef.current = createFoodFormSnapshot({
                    name: entry.name,
                    branch: entry.branch || "",
                    visitDate: parseLocalDateInput(entry.visit_date),
                    category: entry.category || "",
                    address: entry.address || "",
                    googleMapsUrl: entry.google_maps_url || "",
                    neighborhood: entry.neighborhood || "",
                    city: entry.city || "",
                    country: entry.country || "Cambodia",
                    instagramHandle: entry.instagram_handle || "",
                    websiteUrl: entry.website_url || "",
                    cuisineTypes: entry.cuisine_type || [],
                    tags: entry.tags || [],
                    items: (entry.items_ordered || []).map((item) => ({
                        name: item.name,
                        price: item.price,
                        categories: item.categories || (item.category ? [item.category] : []),
                        imageIdentity: item.image_url || null,
                    })),
                    favoriteItem: entry.favorite_item || "",
                    overallRating: entry.overall_rating,
                    foodRating: entry.food_rating,
                    ambianceRating: entry.ambiance_rating,
                    serviceRating: entry.service_rating,
                    valueRating: entry.value_rating,
                    totalPrice: entry.total_price?.toString() || "",
                    priceLevel: entry.price_level || "",
                    diningType: entry.dining_type || "",
                    wouldReturn: entry.would_return ?? null,
                    notes: entry.notes || "",
                    placeImages: hydratedImages,
                })
            }
        })
        return () => {
            cancelled = true
        }
    }, [open, entry?.id, entry?.images?.length])

    useEffect(() => {
        if (!open) baselineRef.current = null
    }, [open])

    // Focus first field when opening for new entry
    useEffect(() => {
        if (!open || entry) return
        const t = setTimeout(() => nameInputRef.current?.focus(), 100)
        return () => clearTimeout(t)
    }, [open, entry])

    const getCurrentSnapshot = () =>
        createFoodFormSnapshot({
            name,
            branch,
            visitDate,
            category,
            address,
            googleMapsUrl,
            neighborhood,
            city,
            country,
            instagramHandle,
            websiteUrl,
            cuisineTypes,
            tags,
            items: itemsOrdered.map((item) => ({
                name: item.name,
                price: item.price,
                categories: item.categories || (item.category ? [item.category] : []),
                imageIdentity:
                    item.file
                        ? `file:${item.file.name}:${item.file.size}:${item.file.lastModified}`
                        : item.image_url || item.preview || null,
            })),
            favoriteItem: favoriteItem || "",
            overallRating,
            foodRating,
            ambianceRating,
            serviceRating,
            valueRating,
            totalPrice,
            priceLevel,
            diningType,
            wouldReturn,
            notes,
            placeImages,
        })
    const isDirty = baselineRef.current !== null && getCurrentSnapshot() !== baselineRef.current

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && isSubmitting) {
            return
        }
        if (!nextOpen && isDirty) {
            setShowDiscardConfirm(true)
            return
        }
        onOpenChange(nextOpen)
    }

    const handleConfirmDiscard = () => {
        setShowDiscardConfirm(false)
        onOpenChange(false)
    }

    const isMapsUrl = (s: string) =>
        /google\.com\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(s?.trim() ?? "")

    const isGooglePlacePhotoUrl = (url: string) =>
        /^https?:\/\/places\.googleapis\.com\/v1\/.+\/media/i.test(url.trim())

    const buildAutofillRequestKey = (url?: string, placeId?: string) =>
        `${placeId?.trim().toLowerCase() || ""}|${url?.trim().toLowerCase() || ""}`

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
        setSaveProgress({
            phase: "saving-entry",
            placeUploaded: 0,
            placeTotal: 0,
            itemUploaded: 0,
            itemTotal: 0,
        })

        try {
            const uploadConcurrency = 3
            // When items exist, always use their sum as total_price so the card shows the correct value after edit
            const finalTotal =
                itemsOrdered.length > 0
                    ? itemsTotal || null
                    : (totalPrice ? parseFloat(totalPrice) || null : null)

            // Prepare items data (without file references for database)
            const itemsForDb: ItemOrdered[] = itemsOrdered.map(item => ({
                name: item.name,
                price: item.price,
                image_url: item.image_url || (item.preview?.startsWith('data:') ? null : item.preview) || null,
                category: item.category || item.categories?.[0] || null,
                categories: item.categories || (item.category ? [item.category] : null)
            }))

            const data: FoodEntryInsert | FoodEntryUpdate = {
                name: name.trim(),
                branch: branch.trim() || null,
                visit_date: visitDate && isValid(visitDate) ? format(visitDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
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
                dining_type: diningType || null,
                would_return: wouldReturn,
                notes: notes || null,
            }

            let result
            if (isEditing && entry) {
                result = await updateFoodEntry(entry.id, data)
            } else {
                result = await createFoodEntry(data as FoodEntryInsert)
            }

            if (result.success) {
                const entryId = result.data.id
                let finalEntry = result.data
                let successfulUploads = 0
                let failedUploads = 0

                const placeUploadJobs = placeImages
                    .map((img, index) => ({ img, index }))
                    .filter(({ img }) => {
                        if (img.file) return true
                        return isGooglePlacePhotoUrl(img.preview)
                    })

                if (placeUploadJobs.length > 0) {
                    setSaveProgress(prev => ({
                        ...prev,
                        phase: "uploading-place",
                        placeUploaded: 0,
                        placeTotal: placeUploadJobs.length,
                    }))

                    await mapWithConcurrency(placeUploadJobs, uploadConcurrency, async ({ img, index }) => {
                        try {
                            const uploadResult = img.file
                                ? await uploadFoodImage(img.file, entryId, "place", index)
                                : await uploadFoodImageFromUrl(img.preview, entryId, "place", index)

                            if (!uploadResult.success) {
                                failedUploads += 1
                                return
                            }

                            const imageResult = await addFoodEntryImage({
                                food_entry_id: entryId,
                                image_url: uploadResult.data.url,
                                storage_path: uploadResult.data.path,
                                is_primary: img.is_primary,
                            } as any)

                            if (imageResult.success) {
                                successfulUploads += 1
                            } else {
                                failedUploads += 1
                            }
                        } catch (error) {
                            failedUploads += 1
                        } finally {
                            setSaveProgress(prev => ({
                                ...prev,
                                placeUploaded: prev.placeUploaded + 1,
                            }))
                        }
                    })
                }

                const itemUploads = itemsOrdered
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => Boolean(item.file))

                const uploadedItemImageUrls = new Map<number, string>()
                if (itemUploads.length > 0) {
                    setSaveProgress(prev => ({
                        ...prev,
                        phase: "uploading-items",
                        itemUploaded: 0,
                        itemTotal: itemUploads.length,
                    }))

                    await mapWithConcurrency(itemUploads, uploadConcurrency, async ({ item, index }) => {
                        try {
                            const file = item.file
                            if (!file) {
                                failedUploads += 1
                                return
                            }
                            const uploadResult = await uploadFoodImage(file, entryId, "item", index)
                            if (!uploadResult.success) {
                                failedUploads += 1
                                return
                            }
                            uploadedItemImageUrls.set(index, uploadResult.data.url)
                            successfulUploads += 1
                        } catch (error) {
                            failedUploads += 1
                        } finally {
                            setSaveProgress(prev => ({
                                ...prev,
                                itemUploaded: prev.itemUploaded + 1,
                            }))
                        }
                    })
                }

                if (uploadedItemImageUrls.size > 0) {
                    setSaveProgress(prev => ({ ...prev, phase: "finalizing" }))
                    const updatedItems = itemsOrdered.map((item, index) => {
                        const uploadedUrl = uploadedItemImageUrls.get(index)
                        if (!uploadedUrl) return item
                        return {
                            ...item,
                            image_url: uploadedUrl,
                            file: undefined,
                            preview: undefined,
                        }
                    })

                    const updatedItemsForDb: ItemOrdered[] = updatedItems.map(item => ({
                        name: item.name,
                        price: item.price,
                        image_url: item.image_url || null,
                        category: item.category || item.categories?.[0] || null,
                        categories: item.categories || (item.category ? [item.category] : null)
                    }))

                    const updateItemsResult = await updateFoodEntry(entryId, { items_ordered: updatedItemsForDb })
                    if (updateItemsResult.success) {
                        finalEntry = updateItemsResult.data
                    } else {
                        failedUploads += 1
                    }
                }

                setSaveProgress(prev => ({ ...prev, phase: "finalizing" }))
                const baseMessage = isEditing ? "Entry updated" : "Entry added"
                if (failedUploads > 0) {
                    toast.success(`${baseMessage}. ${successfulUploads} uploaded, ${failedUploads} failed`)
                } else if (successfulUploads > 0) {
                    toast.success(`${baseMessage}. Uploaded ${successfulUploads} photo${successfulUploads === 1 ? "" : "s"}`)
                } else {
                    toast.success(baseMessage)
                }

                baselineRef.current = null
                onSuccess(finalEntry)
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to save entry")
            }
        } catch (error) {
            console.error("Error saving entry:", error)
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
            setSaveProgress({
                phase: "idle",
                placeUploaded: 0,
                placeTotal: 0,
                itemUploaded: 0,
                itemTotal: 0,
            })
        }
    }

    const applyLocalPlaceSuggestion = (selectedEntry: FoodEntry) => {
        setName(selectedEntry.name)
        setBranch(selectedEntry.branch ?? "")
        setCategory(selectedEntry.category ?? "")
        setCuisineTypes(selectedEntry.cuisine_type ?? [])
        setAddress(selectedEntry.address ?? "")
        setGoogleMapsUrl(selectedEntry.google_maps_url ?? "")
        setNeighborhood(selectedEntry.neighborhood ?? "")
        setCity(selectedEntry.city ?? "")
        setCountry(selectedEntry.country ?? "Cambodia")
        setInstagramHandle(selectedEntry.instagram_handle ?? "")
        setWebsiteUrl(selectedEntry.website_url ?? "")
        setPlaceSuggestionsOpen(false)
        setSelectedSuggestionIndex(-1)
    }

    const handleAutofill = async (
        options?: {
            urlOverride?: string
            placeId?: string
            force?: boolean
        }
    ) => {
        const urlToUse = options?.urlOverride ?? googleMapsUrl
        const normalizedUrl = urlToUse?.trim() || ""
        const placeIdToUse = options?.placeId?.trim()
        const requestKey = buildAutofillRequestKey(normalizedUrl, placeIdToUse)

        if (!normalizedUrl && !placeIdToUse) {
            toast.error("Please enter a Google Maps URL first")
            return
        }

        if (!options?.force && requestKey && requestKey === lastAutofillKeyRef.current) {
            return
        }

        setIsAutofilling(true)
        try {
            const payload = placeIdToUse
                ? { placeId: placeIdToUse, url: normalizedUrl || undefined }
                : { url: normalizedUrl }
            const response = await fetch("/api/maps/place-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await response.json() as FoodPlaceDetailsResponse & { error?: string }

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch place details")
            }

            if (data.name) setName(data.name)
            if (data.address) setAddress(data.address)
            if (data.website) setWebsiteUrl(data.website)
            if (data.neighborhood) setNeighborhood(data.neighborhood)
            if (data.city) setCity(data.city)
            if (data.country) setCountry(data.country)
            if (data.priceLevel) setPriceLevel(data.priceLevel)
            if (data.googleMapsUrl) setGoogleMapsUrl(data.googleMapsUrl)
            if (data.suggestedCategory) {
                setCategory(prev => (prev.trim() ? prev : data.suggestedCategory || prev))
            }
            if (data.suggestedCuisineTypes && Array.isArray(data.suggestedCuisineTypes)) {
                const suggested = data.suggestedCuisineTypes.map((value) => value.trim()).filter(Boolean)
                if (suggested.length > 0) {
                    setCuisineTypes((prev) => Array.from(new Set([...prev, ...suggested])))
                }
            }

            // Add photos from Google Places to placeImages
            if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
                const newImages = data.photos.map((photoUrl: string, index: number) => ({
                    preview: photoUrl,
                    is_primary: index === 0 // First photo is primary
                }))
                setPlaceImages(prev => normalizePlaceImages([...prev, ...newImages]))
            }

            lastAutofillKeyRef.current = requestKey || null
            toast.success("Autofilled from Google Maps")
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to autofill")
        } finally {
            setIsAutofilling(false)
        }
    }

    const handleSelectSuggestion = async (suggestion: FoodAutocompleteSuggestion) => {
        if (suggestion.source === "local" && "entry" in suggestion) {
            applyLocalPlaceSuggestion(suggestion.entry)
            return
        }

        setName(suggestion.name)
        if (suggestion.googleMapsUrl) {
            setGoogleMapsUrl(suggestion.googleMapsUrl)
        }
        setPlaceSuggestionsOpen(false)
        setSelectedSuggestionIndex(-1)

        await handleAutofill({
            placeId: suggestion.placeId || undefined,
            urlOverride: suggestion.googleMapsUrl || undefined,
            force: true,
        })
    }

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!placeSuggestionsOpen || placeSuggestions.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedSuggestionIndex((prev) => (prev < placeSuggestions.length - 1 ? prev + 1 : prev))
            return
        }

        if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
            return
        }

        if (e.key === "Escape") {
            e.preventDefault()
            setPlaceSuggestionsOpen(false)
            setSelectedSuggestionIndex(-1)
            return
        }

        if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
            e.preventDefault()
            const suggestion = placeSuggestions[selectedSuggestionIndex]
            if (suggestion) {
                void handleSelectSuggestion(suggestion)
            }
        }
    }

    const handleNameBlur = () => {
        setTimeout(() => {
            if (ignoreBlurRef.current) {
                ignoreBlurRef.current = false
                return
            }
            setIsNameFocused(false)
            setPlaceSuggestionsOpen(false)
        }, 120)
    }

    const tabs = ["general", "location", "items", "ratings", "notes"] as const
    type FoodDialogTab = (typeof tabs)[number]
    const [activeTab, setActiveTab] = useState<FoodDialogTab>("general")

    const tabLabels: Record<FoodDialogTab, string> = {
        general: "General",
        location: "Location",
        items: "Items Ordered",
        ratings: "Ratings & Price",
        notes: "Notes",
    }

    const isGeneralComplete = Boolean(name.trim()) && Boolean(visitDate && isValid(visitDate))
    const tabCompletion: Record<FoodDialogTab, boolean> = {
        general: isGeneralComplete,
        location: Boolean(googleMapsUrl.trim() || address.trim() || city.trim() || neighborhood.trim()),
        items: itemsOrdered.length > 0,
        ratings: [overallRating, foodRating, ambianceRating, serviceRating, valueRating].some((rating) => rating !== null),
        notes: Boolean(notes.trim() || tags.length > 0),
    }

    const saveProgressLabel = getFoodSaveProgressLabel(saveProgress)

    // Always open on general tab when dialog opens (add, edit, or duplicate)
    useEffect(() => {
        if (open) setActiveTab("general")
    }, [open])

    return (
        <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl p-0 h-[90vh] md:h-[85vh] flex flex-col gap-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden border-b bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                        {/* Small Photo */}
                        <div className="w-12 h-12 relative rounded overflow-hidden border shadow-sm bg-muted flex-shrink-0 group">
                            {placeImages.length > 0 ? (
                                <Image
                                    src={placeImages.find(img => img.is_primary)?.preview || placeImages[0]?.preview}
                                    alt={name || "New Entry"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                                    <Utensils className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="font-semibold text-base truncate h-auto leading-none">
                                {isEditing ? (name ? formatRestaurantDisplayName({ name, branch }) : "Edit Entry") : "Add New Entry"}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground truncate">
                                {visitDate && isValid(visitDate) ? format(visitDate, "PPP") : "Add details for your food review"}
                            </DialogDescription>
                        </div>
                    </div>
                    {/* Horizontal Tabs */}
                    <div className="flex gap-1 mt-3 overflow-x-auto">
                        {tabs.map(tab => (
                            <Button
                                key={tab}
                                variant={activeTab === tab ? "secondary" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-8 text-xs flex-shrink-0 capitalize",
                                    activeTab === tab && "bg-secondary font-medium"
                                )}
                                onClick={() => setActiveTab(tab)}
                            >
                                <span>{tabLabels[tab]}</span>
                                {tabCompletion[tab] ? (
                                    <Check className="h-3.5 w-3.5 ml-1" />
                                ) : tab === "general" ? (
                                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                                ) : null}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:flex w-64 bg-muted/30 border-r flex-col p-5 gap-5 overflow-y-auto shrink-0">
                        {/* Photo Gallery Carousel */}
                        {placeImages.length > 0 ? (
                            <Carousel className="w-full" opts={{ loop: true }}>
                                <CarouselContent>
                                    {placeImages.map((img, index) => (
                                        <CarouselItem key={index}>
                                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden border shadow-sm bg-muted w-full group">
                                                <Image
                                                    src={img.preview}
                                                    alt={`Photo ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {img.is_primary && (
                                                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                        Primary
                                                    </div>
                                                )}
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {placeImages.length > 1 && (
                                    <>
                                        <CarouselPrevious className="-left-3 h-7 w-7" />
                                        <CarouselNext className="-right-3 h-7 w-7" />
                                    </>
                                )}
                            </Carousel>
                        ) : (
                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden border shadow-sm bg-muted self-center w-full group shrink-0">
                                <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                                    <Utensils className="h-12 w-12" />
                                </div>
                                {/* Quick upload overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-white hover:text-white hover:bg-white/20"
                                        onClick={() => sidebarFileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Add Photos
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Photo count */}
                        {placeImages.length > 0 && (
                            <p className="text-xs text-center text-muted-foreground">
                                {placeImages.length} photo{placeImages.length !== 1 ? 's' : ''}
                            </p>
                        )}

                        {/* Navigation Tabs (Vertical) */}
                        <div className="flex flex-col gap-1 w-full flex-1">
                            {tabs.map(tab => (
                                <Button
                                    key={tab}
                                    variant={activeTab === tab ? "secondary" : "ghost"}
                                    className={cn(
                                        "justify-start h-9 truncate capitalize",
                                        activeTab === tab && "bg-secondary font-medium"
                                    )}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    <span className="truncate">{tabLabels[tab]}</span>
                                    {tabCompletion[tab] ? (
                                        <Check className="h-3.5 w-3.5 ml-auto" />
                                    ) : tab === "general" ? (
                                        <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                                    ) : null}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-full">
                        {/* Desktop Header */}
                        <DialogHeader className="hidden md:block px-6 py-4 border-b shrink-0">
                            <DialogTitle className="text-xl truncate" title={name ? formatRestaurantDisplayName({ name, branch }) : "New Entry"}>
                                {isEditing ? "Edit Entry" : "Add New Entry"}
                                {name && <span className="text-muted-foreground font-normal text-base ml-2">{formatRestaurantDisplayName({ name, branch })}</span>}
                            </DialogTitle>
                        </DialogHeader>

                        <ScrollArea className="flex-1">
                            <form
                                onSubmit={handleSubmit}
                                className="p-4 md:p-6"
                                onKeyDown={(e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                        e.preventDefault()
                                        handleSubmit(e)
                                    }
                                }}
                            >
                                {/* GENERAL TAB */}
                                {activeTab === "general" && (
                                    <div className="space-y-6">
                                        {/* Place Photos (upload / take photo) */}
                                        <PlaceImageUpload
                                            images={placeImages}
                                            onImagesChange={(images) => setPlaceImages(normalizePlaceImages(images))}
                                            onFileSelect={handlePlaceFileSelect}
                                        />

                                        <Separator />

                                        {/* Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-full relative">
                                                <Label htmlFor="name">Restaurant / Place Name <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Input
                                                        ref={nameInputRef}
                                                        id="name"
                                                        value={name}
                                                        onChange={(e) => {
                                                            setName(e.target.value)
                                                            setSelectedSuggestionIndex(-1)
                                                        }}
                                                        onFocus={() => setIsNameFocused(true)}
                                                        onBlur={handleNameBlur}
                                                        onKeyDown={handleNameKeyDown}
                                                        placeholder="e.g., Sushi Masato (type to search local + Google)"
                                                        required
                                                        autoComplete="off"
                                                    />
                                                    {isSearchingPlaces && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        </span>
                                                    )}
                                                </div>
                                                {placeSuggestionsOpen && (
                                                    <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
                                                        {placeSuggestions.map((suggestion, index) => {
                                                            const isLocal = suggestion.source === "local" && "entry" in suggestion
                                                            const displayName = isLocal
                                                                ? formatRestaurantDisplayName({
                                                                    name: suggestion.name,
                                                                    branch: suggestion.branch ?? "",
                                                                })
                                                                : suggestion.name
                                                            const subtitle = suggestion.subtitle || suggestion.address || null

                                                            return (
                                                                <button
                                                                    key={suggestion.id}
                                                                    type="button"
                                                                    className={cn(
                                                                        "w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                                                                        index === selectedSuggestionIndex && "bg-accent"
                                                                    )}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault()
                                                                        ignoreBlurRef.current = true
                                                                    }}
                                                                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                                                    onClick={() => void handleSelectSuggestion(suggestion)}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="truncate text-sm font-medium">{displayName}</span>
                                                                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                                            {isLocal ? "local" : "google"}
                                                                        </span>
                                                                    </div>
                                                                    {subtitle && (
                                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2 col-span-full">
                                                <Label htmlFor="branch">Branch / Location</Label>
                                                <Input
                                                    id="branch"
                                                    value={branch}
                                                    onChange={(e) => setBranch(e.target.value)}
                                                    placeholder="e.g., Mall, Airport"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Cuisine Type</Label>
                                                <CuisineSelector
                                                    value={cuisineTypes}
                                                    onChange={setCuisineTypes}
                                                    options={[...new Set([...availableCuisines, ...cuisineTypes])].sort()}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="category">Category</Label>
                                                <Select value={category} onValueChange={setCategory}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                                                        <SelectItem value="Bar">Bar</SelectItem>
                                                        <SelectItem value="Cafe">Cafe</SelectItem>
                                                        <SelectItem value="Street Food">Street Food</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Visit Date <span className="text-red-500">*</span></Label>
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
                                                            {visitDate && isValid(visitDate) ? format(visitDate, "PPP") : "Pick a date"}
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
                                                <Label htmlFor="diningType">Dining type</Label>
                                                <Select value={diningType || "_none"} onValueChange={(v) => setDiningType(v === "_none" ? "" : v)}>
                                                    <SelectTrigger id="diningType">
                                                        <SelectValue placeholder="Not set" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="_none">—</SelectItem>
                                                        {DINING_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => setActiveTab("location")}
                                                disabled={!isGeneralComplete}
                                            >
                                                Continue to {tabLabels.location}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* LOCATION TAB */}
                                {activeTab === "location" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="locationGoogleMapsUrl">Google Maps URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="locationGoogleMapsUrl"
                                                    value={googleMapsUrl}
                                                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                                    onPaste={(e) => {
                                                        const pasted = e.clipboardData.getData("text")?.trim()
                                                        if (pasted && isMapsUrl(pasted)) {
                                                            e.preventDefault()
                                                            setGoogleMapsUrl(pasted)
                                                            void handleAutofill({ urlOverride: pasted })
                                                        }
                                                    }}
                                                    placeholder="https://maps.google.com/..."
                                                    type="url"
                                                    className="w-full"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="shrink-0"
                                                    onClick={() => void handleAutofill({ force: true })}
                                                    disabled={!googleMapsUrl.trim() || isAutofilling}
                                                >
                                                    {isAutofilling ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Filling...
                                                        </>
                                                    ) : (
                                                        "Fill"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
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
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => setActiveTab("items")}
                                            >
                                                Continue to {tabLabels.items}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* ITEMS TAB */}
                                {activeTab === "items" && (
                                    <div className="space-y-4">
                                        <ItemsOrderedInput
                                            value={itemsOrdered}
                                            onChange={(newItems) => {
                                                setItemsOrdered(newItems)
                                                const sum = newItems.reduce((s, i) => s + (i.price ?? 0), 0)
                                                setTotalPrice(sum > 0 ? sum.toFixed(2) : "")
                                            }}
                                            favoriteItem={favoriteItem}
                                            onFavoriteChange={setFavoriteItem}
                                            availableCategories={availableItemCategories}
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => setActiveTab("ratings")}
                                            >
                                                Continue to {tabLabels.ratings}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* RATINGS TAB */}
                                {activeTab === "ratings" && (
                                    <div className="space-y-6">
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

                                        <div className="space-y-2">
                                            <Label htmlFor="wouldReturn">Would go back</Label>
                                            <Select
                                                value={wouldReturn === null ? "_none" : wouldReturn ? "true" : "false"}
                                                onValueChange={(v) => setWouldReturn(v === "_none" ? null : v === "true")}
                                            >
                                                <SelectTrigger id="wouldReturn">
                                                    <SelectValue placeholder="Not set" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="_none">— Not set</SelectItem>
                                                    <SelectItem value="true">Yes</SelectItem>
                                                    <SelectItem value="false">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => setActiveTab("notes")}
                                            >
                                                Continue to {tabLabels.notes}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* NOTES TAB */}
                                {activeTab === "notes" && (
                                    <div className="space-y-4">
                                        <MultiSelectInput
                                            label="Tags"
                                            options={FOOD_TAGS}
                                            value={tags}
                                            onChange={setTags}
                                            placeholder="Select tags..."
                                        />

                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Any additional notes about your experience..."
                                                rows={6}
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </ScrollArea>

                        {/* Footer */}
                        <div className="border-t p-4 bg-muted/20 shrink-0 w-full z-10 space-y-3">
                            {isSubmitting && saveProgressLabel && (
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>{saveProgressLabel}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
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
                        </div>
                    </div>
                </div>

                {/* Hidden file input for sidebar upload */}
                <input
                    ref={sidebarFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePlaceFileSelect}
                />
            </DialogContent>
        </Dialog>

        {/* Discard changes confirmation */}
        <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Discard changes?</DialogTitle>
                    <DialogDescription>
                        You have unsaved changes. Are you sure you want to close? Your changes will be lost.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowDiscardConfirm(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirmDiscard}>
                        Discard
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}

export default FoodAddDialog
