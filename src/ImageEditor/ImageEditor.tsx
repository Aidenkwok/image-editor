import { useEffect, useRef, useState } from 'react';
import { useImageEditor } from './useImageEditor';

const ImageEditor = () => {
    const [selectedImg, setSelectedImg] = useState<string>('');
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const [croppedImage, setCroppedImage] = useState<string>('');

    const {
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
        isPortrait,
        transformString,
        scale,
        isDragging,
        setPortraitToLandscape,
    } = useImageEditor();

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const { deltaY } = event;
            let newScale = scale - deltaY / 500;
            newScale = Math.max(0.1, Math.min(3, newScale));
            setScale(newScale);
        };

        const container = containerRef.current as HTMLElement | null;
        if (container) {
            container.addEventListener('wheel', handleWheel);
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [scale, setScale]);


    const handleCropImage = async () => {
        const image = imageRef.current as HTMLImageElement | null
        const container = containerRef.current as HTMLDivElement | null
        if (image !== null && container !== null) {
            setCroppedImage(await generateCroppedImage(image, container));
        }
    }

    const handleSetLandscape = () => {
        const image = imageRef.current as HTMLImageElement | null
        const container = containerRef.current as HTMLDivElement | null
        if (image !== null && container !== null) {
            setPortraitToLandscape(image, container);
        }
    }

    return (
        <>{
            !selectedImg ? (
                <div>
                    <input type="file" onChange={(e) => setSelectedImg(URL.createObjectURL(e.target.files![0]))} accept='.jpg, .png' />
                </div>
            ) : (
                <div className="page">
                    <div
                        ref={containerRef}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className='container'
                    >
                        <img
                            onLoad={handleImageLoad}
                            crossOrigin="anonymous"
                            ref={imageRef}
                            src={selectedImg}
                            alt="Editable"
                            draggable="false"
                            style={{
                                cursor: isDragging ? 'grabbing' : 'grab',
                                transform: transformString,
                                transformOrigin: 'center center',
                                touchAction: 'none',
                                userSelect: 'none',
                            }}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleTouchStart}
                        />

                    </div >

                    <div className="cropped-image">
                        {croppedImage && <img style={{ border: "1px solid black", width: 'auto', height: "500px" }} src={croppedImage} alt="Cropped" />}
                    </div>

                    <div className="controls">
                        <div>
                            <label>Adjust zoom</label>
                            <input
                                type="range"
                                min="0.15"
                                max="3"
                                step="0.01"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                style={{ width: '80%' }}
                            />
                        </div>
                        <div>
                            {isPortrait && <button onClick={handleSetLandscape}>set landscape</button>}
                            <button onClick={rotateImage}>Rotate 90°</button>
                            <button onClick={handleCropImage}>Crop</button>
                        </div>
                    </div>
                </div >
            )}
        </>
    );
};

export default ImageEditor;
