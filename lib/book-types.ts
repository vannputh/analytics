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
