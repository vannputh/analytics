"use client";

import { Star, StarHalf, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
    value: number | null | undefined;
    onChange: (value: number) => void;
    maxStars?: number;
    size?: "sm" | "md" | "lg";
    showNumericInput?: boolean;
    className?: string;
}

export function StarRatingInput({
    value,
    onChange,
    maxStars = 10,
    size = "md",
    showNumericInput = true,
    className,
}: StarRatingInputProps) {
    const currentValue = value || 0;

    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    const buttonClasses = {
        sm: "h-4 w-5",
        md: "h-5 w-6",
        lg: "h-6 w-7",
    };

    // Handle click on a star - determine if left or right half was clicked
    const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const isLeftHalf = clickX < rect.width / 2;

        // Left half = star - 0.5, Right half = full star value
        const newValue = isLeftHalf ? starIndex - 0.5 : starIndex;
        onChange(newValue);
    };

    // Render a single star with proper fill state
    const renderStar = (starIndex: number) => {
        const fillState = currentValue >= starIndex
            ? "full"
            : currentValue >= starIndex - 0.5
                ? "half"
                : "empty";

        return (
            <div
                key={starIndex}
                className={cn(
                    sizeClasses[size],
                    "cursor-pointer hover:scale-110 transition-transform relative"
                )}
                onClick={(e) => handleStarClick(starIndex, e)}
            >
                {fillState === "full" && (
                    <Star className={cn(sizeClasses[size], "fill-current text-yellow-500 absolute inset-0")} />
                )}
                {fillState === "half" && (
                    <>
                        <Star className={cn(sizeClasses[size], "text-muted-foreground/30 absolute inset-0")} />
                        <div className="absolute inset-0 overflow-hidden w-1/2">
                            <Star className={cn(sizeClasses[size], "fill-current text-yellow-500")} />
                        </div>
                    </>
                )}
                {fillState === "empty" && (
                    <Star className={cn(sizeClasses[size], "text-muted-foreground/30 absolute inset-0")} />
                )}
            </div>
        );
    };

    // Format the display value
    const displayValue = currentValue ?
        (Number.isInteger(currentValue) ? `${currentValue}.0` : currentValue.toString())
        : "0.0";

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {showNumericInput && (
                <div className="flex items-center border rounded-md h-10 pl-3 pr-1 min-w-[5rem] justify-between bg-background">
                    <span className="font-medium">{currentValue || "--"}</span>
                    <div className="flex flex-col border-l ml-2">
                        <button
                            type="button"
                            className={cn(
                                "flex items-center justify-center hover:bg-muted rounded-tr-sm transition-colors",
                                buttonClasses[size]
                            )}
                            onClick={() => onChange(Math.min(maxStars, currentValue + 0.5))}
                        >
                            <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                            type="button"
                            className={cn(
                                "flex items-center justify-center hover:bg-muted rounded-br-sm transition-colors",
                                buttonClasses[size]
                            )}
                            onClick={() => onChange(Math.max(0, currentValue - 0.5))}
                        >
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex text-yellow-500 gap-0.5">
                {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) =>
                    renderStar(star)
                )}
            </div>
            <span className="text-base font-medium">
                {displayValue}/{maxStars}
            </span>
        </div>
    );
}
