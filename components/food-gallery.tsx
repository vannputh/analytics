"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface FoodGalleryProps {
    images: { url: string; alt?: string }[]
    className?: string
}

export function FoodGallery({ images, className }: FoodGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!images || images.length === 0) return null

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main Featured Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted group">
                <Image
                    src={images[currentIndex].url}
                    alt={images[currentIndex].alt || "Gallery image"}
                    fill
                    className="object-cover transition-all"
                    priority
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation()
                                prevImage()
                            }}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation()
                                nextImage()
                            }}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </>
                )}

                {/* Lightbox/Zoom Trigger */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent">
                        <DialogTitle className="sr-only">Food Gallery - Image {currentIndex + 1}</DialogTitle>
                        <DialogDescription className="sr-only">Full size view of food items</DialogDescription>
                        <div className="relative aspect-[4/3] w-full">
                            <Image
                                src={images[currentIndex].url}
                                alt={images[currentIndex].alt || "Full size image"}
                                fill
                                className="object-contain"
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                                currentIndex === idx ? "border-primary shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img.url}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
