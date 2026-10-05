"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SearchResult {
    id: string
    title: string
    year: string | null
    poster_url: string | null
    media_type: "movie" | "tv"
    imdb_id?: string
}

interface BasicDetailsSectionProps {
    title: string | null
    onChange: (value: string) => void
    onSelectResult: (result: SearchResult) => Promise<void>
    autoFocus?: boolean
}

export function BasicDetailsSection({
    title,
    onChange,
    onSelectResult,
    autoFocus,
}: BasicDetailsSectionProps) {
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isFocused, setIsFocused] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Debounced search - only when focused
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        // Don't search if not focused
        if (!isFocused) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }

        const query = title?.trim()
        if (!query || query.length < 2) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }

        setIsSearching(true)
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/metadata/search?q=${encodeURIComponent(query)}`)
                const data = await response.json()
                setSearchResults(data.results || [])
                // Only show dropdown if still focused
                if (isFocused) {
                    setShowDropdown((data.results || []).length > 0)
                }
            } catch (error) {
                console.error("Search error:", error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [title, isFocused])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || searchResults.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault()
            handleSelectResult(searchResults[selectedIndex])
        } else if (e.key === "Escape") {
            setShowDropdown(false)
            setSelectedIndex(-1)
        }
    }

    const handleSelectResult = async (result: SearchResult) => {
        setShowDropdown(false)
        setSearchResults([])
        setSelectedIndex(-1)
        setIsFocused(false) // Blur after selection
        await onSelectResult(result)
    }

    const handleFocus = () => {
        setIsFocused(true)
    }

    const handleBlur = () => {
        // Small delay to allow click on dropdown items
        setTimeout(() => {
            setIsFocused(false)
            setShowDropdown(false)
        }, 200)
    }

    return (
        <div className="space-y-2 relative" ref={dropdownRef}>
            <Label htmlFor="title" className="text-sm font-mono">
                Title <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
                <Input
                    ref={inputRef}
                    id="title"
                    value={title || ""}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Start typing to search..."
                    required
                    autoFocus={autoFocus}
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[400px] overflow-y-auto">
                    {searchResults.map((result, index) => (
                        <button
                            key={result.id}
                            type="button"
                            className={cn(
                                "w-full flex items-start gap-3 p-3 text-left hover:bg-accent transition-colors",
                                index === selectedIndex && "bg-accent"
                            )}
                            onClick={() => handleSelectResult(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {result.poster_url ? (
                                <img
                                    src={result.poster_url}
                                    alt={result.title}
                                    className="w-12 h-16 object-cover rounded"
                                />
                            ) : (
                                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                    No poster
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    {result.year && <span>{result.year}</span>}
                                    <span className="capitalize">{result.media_type === "tv" ? "TV Show" : "Movie"}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
