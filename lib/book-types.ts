export const BOOK_FORMAT_OPTIONS = [
    "Physical",
    "Hardcover",
    "Paperback",
    "Kindle",
    "E-Book",
    "Audiobook",
    "PDF"
] as const;

export const BOOK_STATUS_OPTIONS = [
    "Reading",
    "Finished",
    "On Hold",
    "Dropped",
    "Plan to Read"
] as const;

export const BOOK_PLATFORM_OPTIONS = [
    "Physical",
    "Kindle",
    "Audible",
    "Apple Books",
    "Google Play Books",
    "Libby",
    "Other"
] as const;

export type BookFormat = (typeof BOOK_FORMAT_OPTIONS)[number];
export type BookStatus = (typeof BOOK_STATUS_OPTIONS)[number];
export type BookPlatform = (typeof BOOK_PLATFORM_OPTIONS)[number];

export interface BookFilterState {
    dateFrom: string | null;
    dateTo: string | null;
    genres: string[];
    formats: string[];
    languages: string[];
    statuses: string[];
    authors: string[];
}

export const defaultBookFilterState: BookFilterState = {
    dateFrom: null,
    dateTo: null,
    genres: [],
    formats: [],
    languages: [],
    statuses: [],
    authors: [],
};

import { BookEntry } from "./database.types";
import { normalizeLanguage } from "./language-utils";

/**
 * Apply filters to a list of book entries
 */
export function applyBookFilters(data: BookEntry[], filters: BookFilterState): BookEntry[] {
    return data.filter((entry) => {
        // Date range filter (finish_date based)
        if (filters.dateFrom) {
            const finishDate = entry.finish_date || entry.start_date
            if (!finishDate || finishDate < filters.dateFrom) return false
        }
        if (filters.dateTo) {
            const finishDate = entry.finish_date || entry.start_date
            if (!finishDate || finishDate > filters.dateTo) return false
        }

        // Genre filter (AND logic - entry must have ALL selected genres)
        if (filters.genres.length > 0) {
            if (!entry.genre || !Array.isArray(entry.genre)) return false
            const entryGenres = entry.genre.map((g) => g.toLowerCase().trim())
            for (const filterGenre of filters.genres) {
                if (!entryGenres.includes(filterGenre.toLowerCase().trim())) return false
            }
        }

        // Format filter
        if (filters.formats.length > 0) {
            if (!entry.format || !filters.formats.includes(entry.format)) return false
        }

        // Language filter (AND logic) - compare normalized English names
        if (filters.languages.length > 0) {
            if (!entry.language || !Array.isArray(entry.language)) return false
            const entryLanguages = normalizeLanguage(entry.language)
            const filterLanguages = normalizeLanguage(filters.languages)
            for (const filterLang of filterLanguages) {
                if (!entryLanguages.includes(filterLang)) return false
            }
        }

        // Status filter
        if (filters.statuses.length > 0) {
            if (!entry.status || !filters.statuses.includes(entry.status)) return false
        }

        // Author filter
        if (filters.authors.length > 0) {
            if (!entry.author || !filters.authors.includes(entry.author)) return false
        }

        return true
    })
}

/**
 * Extract unique values from book data for filter options
 */
export function extractBookFilterOptions(data: BookEntry[]) {
    const genres = new Set<string>()
    const formats = new Set<string>()
    const languages = new Set<string>()
    const statuses = new Set<string>()
    const authors = new Set<string>()

    for (const entry of data) {
        if (entry.format) formats.add(entry.format)
        if (entry.status) statuses.add(entry.status)
        if (entry.author) authors.add(entry.author)

        // Handle genre array
        if (entry.genre && Array.isArray(entry.genre)) {
            entry.genre.forEach((g) => {
                const trimmed = typeof g === 'string' ? g.trim() : String(g).trim()
                if (trimmed) genres.add(trimmed)
            })
        }

        // Handle language array - normalize to English for filter options
        if (entry.language && Array.isArray(entry.language)) {
            normalizeLanguage(entry.language).forEach((l) => languages.add(l))
        }
    }

    return {
        genres: Array.from(genres).sort(),
        formats: Array.from(formats).sort(),
        languages: Array.from(languages).sort(),
        statuses: Array.from(statuses).sort(),
        authors: Array.from(authors).sort(),
    }
}
