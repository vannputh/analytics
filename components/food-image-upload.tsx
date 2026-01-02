"use client"

import { useState, useRef, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface FoodImageUploadProps {
    onImageSelected: (file: File) => void
    onImageRemoved?: () => void
    existingImageUrl?: string | null
    label?: string
    maxSizeMB?: number
    className?: string
}

export function FoodImageUpload({
    onImageSelected,
    onImageRemoved,
    existingImageUrl,
    label = "Photo",
    maxSizeMB = 5,
    className,
}: FoodImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(existingImageUrl || null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > maxSizeMB) {
            alert(`File size must be less than ${maxSizeMB}MB`)
            return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Pass file to parent
        onImageSelected(file)
    }

    const handleRemove = () => {
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (cameraInputRef.current) cameraInputRef.current.value = ''
        if (onImageRemoved) onImageRemoved()
    }

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium">
                    {label}
                </label>
            )}

            {preview ? (
                <div className="relative group">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                        <Image
                            src={preview}
                            alt={label}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex gap-2">
                    {/* Upload from gallery */}
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                    </Button>

                    {/* Take photo (mobile) */}
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 sm:hidden"
                        onClick={() => cameraInputRef.current?.click()}
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                    </Button>

                    {/* Hidden file inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
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
            )}

            <p className="text-xs text-muted-foreground">
                Max size: {maxSizeMB}MB. Formats: JPG, PNG, WebP
            </p>
        </div>
    )
}

export default FoodImageUpload
