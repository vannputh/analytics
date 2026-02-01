"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingDisplayProps {
    /** Rating value (e.g. 3.5 out of max) */
    rating: number | null | undefined;
    /** Max stars (default 5) */
    max?: number;
    /** Size of each star */
    size?: "sm" | "md" | "lg";
    /** Show numeric value next to stars */
    showValue?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
} as const;

export function StarRatingDisplay({
    rating,
    max = 5,
    size = "md",
    showValue = true,
    className,
}: StarRatingDisplayProps) {
    if (rating === null || rating === undefined) return null;

    const sizeClass = sizeClasses[size];

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {Array.from({ length: max }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        sizeClass,
                        "transition-colors",
                        i < Math.floor(rating)
                            ? "fill-amber-400 text-amber-400"
                            : i < rating
                                ? "fill-amber-400/50 text-amber-400"
                                : "text-muted-foreground/30"
                    )}
                />
            ))}
            {showValue && (
                <span className={cn(
                    "font-mono text-muted-foreground",
                    size === "sm" && "ml-1 text-xs",
                    size === "md" && "ml-1.5 text-sm",
                    size === "lg" && "ml-2 text-base"
                )}>
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
