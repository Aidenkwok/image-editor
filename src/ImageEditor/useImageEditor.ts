import { SyntheticEvent, useMemo, useState } from "react";

export const useImageEditor = () => {
    const [isPortrait, setIsPortrait] = useState(false);
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePosition, setLastMousePosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setLastMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging && lastMousePosition) {
            const deltaX = event.clientX - lastMousePosition.x;
            const deltaY = event.clientY - lastMousePosition.y;
            setTranslateX((prev: number) => prev + deltaX);
            setTranslateY((prev: number) => prev + deltaY);
            setLastMousePosition({ x: event.clientX, y: event.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setLastMousePosition(null);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 1) {
            setLastMousePosition({ x: event.touches[0].clientX, y: event.touches[0].clientY });
        }
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 1 && lastMousePosition) {
            const deltaX = event.touches[0].clientX - lastMousePosition.x;
            const deltaY = event.touches[0].clientY - lastMousePosition.y;
            setTranslateX((prev) => prev + deltaX);
            setTranslateY((prev) => prev + deltaY);
            setLastMousePosition({ x: event.touches[0].clientX, y: event.touches[0].clientY });
        } else if (event.touches.length === 2) {
            const distance = getDistanceBetweenTouches(event.touches as unknown as Touch[]);
            const center = getCenterPointBetweenTouches(event.touches as unknown as Touch[]);
            if (lastMousePosition) {
                const scaleChange = distance / lastMousePosition.x; // Using the x-coordinate of the lastMousePosition as a base distance
                let newScale = scale * scaleChange;
                newScale = Math.max(0.1, Math.min(3, newScale));
                setScale(newScale);
                setTranslateX((prev) => prev + (center.x - lastMousePosition.x) * (1 - scaleChange));
                setTranslateY((prev) => prev + (center.y - lastMousePosition.y) * (1 - scaleChange));
            }
            setLastMousePosition({ x: distance, y: 0 });
        }
    };

    const handleTouchEnd = () => {
        setLastMousePosition(null);
    };

    const getDistanceBetweenTouches = (touches: Touch[]) => {
        const [touch1, touch2] = touches;
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    interface Touch {
        clientX: number;
        clientY: number;
    }

    const getCenterPointBetweenTouches = (touches: Touch[]): { x: number; y: number } => {
        const [touch1, touch2] = touches;
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
    };

    const rotateImage = () => {
        setRotation((prevRotation) => prevRotation + 90);
    };

    const generateCroppedImage = (img: HTMLImageElement, container: HTMLDivElement, outputWidth = 1000): Promise<string> => {
        return new Promise((resolve, reject) => {
            const aspectRatio = 3 / 2;
            const containerRect = container.getBoundingClientRect();
            const outputHeight = Math.round(outputWidth / aspectRatio);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Set initial canvas size to match container
                canvas.width = containerRect.width;
                canvas.height = containerRect.height;

                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();

                // Move to the center of the canvas
                ctx.translate(canvas.width / 2, canvas.height / 2);

                // Apply scaling
                ctx.scale(scale, scale);

                // Apply translation (adjusted for scale)
                ctx.translate(translateX / scale, translateY / scale);

                // Apply rotation
                ctx.rotate((rotation * Math.PI) / 180);

                // Calculate the position to draw the image centered
                const drawX = -img.naturalWidth / 2;
                const drawY = -img.naturalHeight / 2;

                // Draw the image
                ctx.drawImage(img, drawX, drawY);

                ctx.restore();

                // Create a new canvas for the final sized image
                const outputCanvas = document.createElement('canvas');
                outputCanvas.width = outputWidth;
                outputCanvas.height = outputHeight;
                const outputCtx = outputCanvas.getContext('2d');

                // Draw the original canvas content onto the new canvas
                outputCtx?.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, outputWidth, outputHeight);

                // Convert the output canvas content to a blob and resolve the promise
                outputCanvas.toBlob((blob) => {
                    if (blob) {
                        const imageUrl = URL.createObjectURL(blob);
                        console.log(imageUrl);
                        resolve(imageUrl); // Resolve the promise with the image URL
                    } else {
                        reject(new Error('Blob creation failed'));
                    }
                });
            } else {
                reject(new Error('Could not get canvas context'));
            }
        });
    };

    const transformString = useMemo(() => `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`, [
        rotation, scale, translateX, translateY
    ])

    const handleImageLoad: React.ReactEventHandler<HTMLImageElement> = (e: SyntheticEvent<HTMLImageElement, Event>) => {
        const image = e.currentTarget;
        const container = image.parentElement as HTMLElement;
        // if the image is portrait, set the scale to fit the height of the container
        // if the image is landscape, set the scale to fit the width of the container
        const isPortrait = image.naturalHeight > image.naturalWidth;
        if (isPortrait) {
            setIsPortrait(true);
            setScale(container.clientHeight / image.naturalHeight);
        } else {
            setScale(container.clientWidth / image.naturalWidth);
        }
        setTranslateX(0);
        setTranslateY(0);
    }

    const setPortraitToLandscape = (image: HTMLImageElement, container: HTMLDivElement) => {
        setScale(container.clientWidth / image.naturalWidth);
        setTranslateX(0);
        setTranslateY(0);
    }

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        rotateImage,
        generateCroppedImage,
        setScale,
        handleImageLoad,
        setPortraitToLandscape,
        isPortrait,
        isDragging,
        transformString,
        scale,
    }
}
