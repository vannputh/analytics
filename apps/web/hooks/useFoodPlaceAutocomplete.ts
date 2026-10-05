"use client";

import { useEffect, useRef, useState } from "react";
import { getFoodEntries } from "@/lib/food-actions";
import { FoodEntry } from "@/lib/database.types";
import type { FoodPlaceSearchResponse, FoodPlaceSuggestion } from "@/lib/food-place-types";

export interface LocalFoodPlaceSuggestion extends FoodPlaceSuggestion {
  source: "local";
  entry: FoodEntry;
}

export type FoodAutocompleteSuggestion =
  | LocalFoodPlaceSuggestion
  | (FoodPlaceSuggestion & { source: "google" });

interface UseFoodPlaceAutocompleteParams {
  open: boolean;
  isEditing: boolean;
  query: string;
  minQueryLength?: number;
  localLimit?: number;
  googleFallbackThreshold?: number;
}

interface UseFoodPlaceAutocompleteResult {
  suggestions: FoodAutocompleteSuggestion[];
  isSearching: boolean;
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function suggestionKey(suggestion: Pick<FoodPlaceSuggestion, "name" | "branch" | "address">): string {
  return `${normalizeText(suggestion.name)}|${normalizeText(suggestion.branch)}|${normalizeText(suggestion.address)}`;
}

export function useFoodPlaceAutocomplete({
  open,
  isEditing,
  query,
  minQueryLength = 2,
  localLimit = 30,
  googleFallbackThreshold = 3,
}: UseFoodPlaceAutocompleteParams): UseFoodPlaceAutocompleteResult {
  const [suggestions, setSuggestions] = useState<FoodAutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open || isEditing) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const normalizedQuery = query.trim();
    if (normalizedQuery.length < minQueryLength) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setIsSearching(true);

    const timeout = setTimeout(async () => {
      const localResult = await getFoodEntries({ search: normalizedQuery, limit: localLimit });
      if (requestIdRef.current !== currentRequestId) return;

      const localSuggestions: LocalFoodPlaceSuggestion[] = [];
      const seenLocalKeys = new Set<string>();

      if (localResult.success) {
        for (const entry of localResult.data) {
          const key = `${entry.name}\0${entry.branch ?? ""}`;
          if (seenLocalKeys.has(key)) continue;
          seenLocalKeys.add(key);

          localSuggestions.push({
            id: `local-${entry.id}`,
            source: "local",
            name: entry.name,
            branch: entry.branch,
            address: entry.address,
            subtitle: [entry.branch, entry.city, entry.country].filter(Boolean).join(" • ") || entry.address || null,
            placeId: null,
            googleMapsUrl: entry.google_maps_url,
            city: entry.city,
            country: entry.country,
            entry,
          });
        }
      }

      let combinedSuggestions: FoodAutocompleteSuggestion[] = [...localSuggestions];

      if (localSuggestions.length < googleFallbackThreshold) {
        try {
          const response = await fetch(`/api/maps/place-search?q=${encodeURIComponent(normalizedQuery)}`);
          if (response.ok) {
            const data = (await response.json()) as FoodPlaceSearchResponse;
            const existingKeys = new Set(combinedSuggestions.map((suggestion) => suggestionKey(suggestion)));
            const googleSuggestions: FoodAutocompleteSuggestion[] = (data.results || [])
              .map((result) => ({ ...result, source: "google" as const }))
              .filter((result) => {
                const key = suggestionKey(result);
                if (existingKeys.has(key)) return false;
                existingKeys.add(key);
                return true;
              });
            combinedSuggestions = [...combinedSuggestions, ...googleSuggestions];
          }
        } catch (error) {
          console.error("Google place autocomplete failed:", error);
        }
      }

      if (requestIdRef.current === currentRequestId) {
        setSuggestions(combinedSuggestions);
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [open, isEditing, query, minQueryLength, localLimit, googleFallbackThreshold]);

  return { suggestions, isSearching };
}
