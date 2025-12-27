"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends ImageProps {
    fallbackElement?: React.ReactNode;
}

export function SafeImage({
    fallbackElement,
    src,
    alt,
    ...props
}: SafeImageProps) {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    if (error || !src || src === "N/A") {
        return <>{fallbackElement}</>;
    }

    return (
        <Image
            src={src}
            alt={alt}
            onError={() => setError(true)}
            {...props}
        />
    );
}
