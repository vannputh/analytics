"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { MediaEntry } from "@/lib/database.types"
import { createEntry, updateEntry, CreateEntryInput } from "@/lib/actions"
import { Button } from "@/components/ui/button"
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
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ArrowLeft, Loader2, Save, Download } from "lucide-react"
import { toast } from "sonner"

const MEDIUM_OPTIONS = ["Movie", "TV Show", "Book", "Theatre", "Live Theatre", "Podcast"]
const STATUS_OPTIONS = ["Watching", "Finished", "Dropped", "Plan to Watch", "On Hold"]

export default function AddPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryId = searchParams.get("id")

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateEntryInput>>({
    title: "",
    medium: null,
    type: null,
    season: null,
    episodes: null,
    length: null,
    price: null,
    language: null,
    platform: null,
    status: null,
    genre: null,
    my_rating: null,
    average_rating: null,
    rating: null,
    start_date: null,
    finish_date: null,
    time_taken: null,
    poster_url: null,
    imdb_id: null,
  })

  // Fetch existing entry if editing
  useEffect(() => {
    async function fetchEntry() {
      if (!entryId) return
      
      setFetching(true)
      try {
        const { data, error } = await supabase
          .from("media_entries")
          .select("*")
          .eq("id", entryId)
          .single()

        if (error) {
          toast.error("Failed to load entry")
          router.push("/analytics")
          return
        }
        if (data) {
          setFormData({
            title: data.title || "",
            medium: data.medium || null,
            type: data.type || null,
            season: data.season || null,
            episodes: data.episodes || null,
            length: data.length || null,
            price: data.price || null,
            language: data.language || null,
            platform: data.platform || null,
            status: data.status || null,
            genre: Array.isArray(data.genre) ? data.genre : data.genre ? [data.genre] : null,
            my_rating: data.my_rating || null,
            average_rating: data.average_rating || null,
            rating: data.rating || null,
            start_date: data.start_date || null,
            finish_date: data.finish_date || null,
            time_taken: data.time_taken || null,
            poster_url: data.poster_url || null,
            imdb_id: data.imdb_id || null,
          })
        }
      } catch (err) {
        console.error("Error fetching entry:", err)
        toast.error("Failed to load entry")
        router.push("/analytics")
      } finally {
        setFetching(false)
      }
    }
    
    fetchEntry()
  }, [entryId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || formData.title.trim() === "") {
      toast.error("Title is required")
      return
    }

    setLoading(true)

    try {
      const entryData: CreateEntryInput = {
        title: formData.title.trim(),
        medium: formData.medium || null,
        type: formData.type?.trim() || null,
        season: formData.season?.trim() || null,
        episodes: formData.episodes || null,
        length: formData.length?.trim() || null,
        price: formData.price || null,
        language: formData.language?.trim() || null,
        platform: formData.platform?.trim() || null,
        status: formData.status || null,
        genre: formData.genre && formData.genre.length > 0 ? formData.genre : null,
        my_rating: formData.my_rating || null,
        average_rating: formData.average_rating || null,
        rating: formData.rating || null,
        start_date: formData.start_date || null,
        finish_date: formData.finish_date || null,
        time_taken: formData.time_taken?.trim() || null,
        poster_url: formData.poster_url?.trim() || null,
        imdb_id: formData.imdb_id?.trim() || null,
      }

      if (entryId) {
        const result = await updateEntry(entryId, entryData)
        if (result.success) {
          toast.success("Entry updated successfully")
          router.push("/analytics")
        } else {
          toast.error(result.error || "Failed to update entry")
        }
      } else {
        const result = await createEntry(entryData)
        if (result.success) {
          toast.success("Entry created successfully")
          router.push("/analytics")
        } else {
          toast.error(result.error || "Failed to create entry")
        }
      }
    } catch (error) {
      console.error("Error saving entry:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGenreChange = (value: string) => {
    const genres = value
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0)
    setFormData({ ...formData, genre: genres.length > 0 ? genres : null })
  }

  const handleFetchMetadata = async () => {
    if (!formData.title?.trim()) {
      toast.error("Please enter a title first")
      return
    }

    setFetchingMetadata(true)
    try {
      // Build URL with title and optional parameters
      let url = `/api/metadata?title=${encodeURIComponent(formData.title.trim())}`
      
      if (formData.medium) {
        // Map our medium values to OMDB type
        const typeMap: Record<string, string> = {
          "Movie": "movie",
          "TV Show": "series",
        }
        const omdbType = typeMap[formData.medium]
        if (omdbType) {
          url += `&type=${omdbType}`
        }
      }
      
      if (formData.season) {
        url += `&season=${encodeURIComponent(formData.season)}`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch metadata")
      }

      const metadata = await response.json()

      // Update form data with fetched metadata (overwrites existing values)
      // Note: season and type are not overwritten - they use user input to fetch appropriate metadata
      setFormData((prev) => ({
        ...prev,
        poster_url: metadata.poster_url || prev.poster_url,
        genre: metadata.genre ? metadata.genre.split(",").map((g: string) => g.trim()) : prev.genre,
        language: metadata.language || prev.language,
        average_rating: metadata.average_rating ?? prev.average_rating,
        length: metadata.length || prev.length,
        episodes: metadata.episodes ?? prev.episodes,
        imdb_id: metadata.imdb_id || prev.imdb_id,
      }))

      toast.success("Metadata fetched successfully")
    } catch (error) {
      console.error("Error fetching metadata:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch metadata")
    } finally {
      setFetchingMetadata(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-mono">Loading entry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/analytics")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-mono uppercase tracking-wider">
              {entryId ? "Edit Entry" : "Add Entry"}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title - Required */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-mono">
              Title <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchMetadata}
                disabled={fetchingMetadata || !formData.title?.trim()}
              >
                {fetchingMetadata ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch Metadata
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Medium and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medium" className="text-sm font-mono">
                Medium
              </Label>
              <Select
                value={formData.medium || "__none__"}
                onValueChange={(value) =>
                  setFormData({ ...formData, medium: value === "__none__" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {MEDIUM_OPTIONS.map((medium) => (
                    <SelectItem key={medium} value={medium}>
                      {medium}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-mono">
                Status
              </Label>
              <Select
                value={formData.status || "__none__"}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value === "__none__" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type, Season, Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-mono">
                Type
              </Label>
              <Input
                id="type"
                value={formData.type || ""}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Action, Drama"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season" className="text-sm font-mono">
                Season
              </Label>
              <Input
                id="season"
                value={formData.season || ""}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g., Season 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-mono">
                Language
              </Label>
              <Input
                id="language"
                value={formData.language || ""}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="e.g., English"
              />
            </div>
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="genre" className="text-sm font-mono">
              Genre (comma-separated)
            </Label>
            <Input
              id="genre"
              value={Array.isArray(formData.genre) ? formData.genre.join(", ") : formData.genre || ""}
              onChange={(e) => handleGenreChange(e.target.value)}
              placeholder="e.g., Action, Drama, Comedy"
            />
          </div>

          {/* Platform, Episodes, Length */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-sm font-mono">
                Platform
              </Label>
              <Input
                id="platform"
                value={formData.platform || ""}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                placeholder="e.g., Netflix, Amazon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="episodes" className="text-sm font-mono">
                Episodes
              </Label>
              <Input
                id="episodes"
                type="number"
                value={formData.episodes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    episodes: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Number of episodes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="length" className="text-sm font-mono">
                Length
              </Label>
              <Input
                id="length"
                value={formData.length || ""}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                placeholder="e.g., 120 min, 300 pages"
              />
            </div>
          </div>

          {/* Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="my_rating" className="text-sm font-mono">
                My Rating
              </Label>
              <Input
                id="my_rating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.my_rating || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    my_rating: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="0-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_rating" className="text-sm font-mono">
                Average Rating
              </Label>
              <Input
                id="average_rating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.average_rating || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    average_rating: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="e.g., IMDb rating"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-sm font-mono">
                Start Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finish_date" className="text-sm font-mono">
                Finish Date
              </Label>
              <Input
                id="finish_date"
                type="date"
                value={formData.finish_date || ""}
                onChange={(e) => setFormData({ ...formData, finish_date: e.target.value || null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_taken" className="text-sm font-mono">
                Time Taken
              </Label>
              <Input
                id="time_taken"
                value={formData.time_taken || ""}
                onChange={(e) => setFormData({ ...formData, time_taken: e.target.value })}
                placeholder="e.g., 2 weeks"
              />
            </div>
          </div>

          {/* Price and IDs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-mono">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imdb_id" className="text-sm font-mono">
                IMDb ID
              </Label>
              <Input
                id="imdb_id"
                value={formData.imdb_id || ""}
                onChange={(e) => setFormData({ ...formData, imdb_id: e.target.value })}
                placeholder="tt1234567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poster_url" className="text-sm font-mono">
                Poster URL
              </Label>
              <Input
                id="poster_url"
                type="url"
                value={formData.poster_url || ""}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {entryId ? "Update Entry" : "Create Entry"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/analytics")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
