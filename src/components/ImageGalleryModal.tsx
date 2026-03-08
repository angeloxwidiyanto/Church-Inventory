'use client';

import { useState } from 'react';

export default function ImageGalleryModal({
    isOpen,
    onClose,
    images = [],
    initialIndex = 0,
}: {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    initialIndex?: number;
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    if (!isOpen || images.length === 0) return null;

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>
            </div>

            <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center p-8 pointer-events-none">
                {images.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className="absolute left-8 p-4 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all pointer-events-auto cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_left</span>
                    </button>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={images[currentIndex]}
                    alt={`Gallery Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                />

                {images.length > 1 && (
                    <button
                        onClick={handleNext}
                        className="absolute right-8 p-4 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all pointer-events-auto cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_right</span>
                    </button>
                )}
            </div>

            {images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 p-3 rounded-2xl backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all cursor-pointer border-2 ${idx === currentIndex ? 'border-primary ring-2 ring-primary/50' : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
