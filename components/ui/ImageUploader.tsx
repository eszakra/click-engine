import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
    selectedImage: string | null;
    onImageSelect: (dataUrl: string | null, mimeType: string | null) => void;
    disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ selectedImage, onImageSelect, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            onImageSelect(result, file.type);
        };
        reader.readAsDataURL(file);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [disabled]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    if (selectedImage) {
        return (
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-700 group">
                <img
                    src={selectedImage}
                    alt="Reference"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                        onClick={() => onImageSelect(null, null)}
                        className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                        disabled={disabled}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`
                relative w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer
                ${isDragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={disabled}
            />
            <div className="p-3 bg-slate-800 rounded-full text-indigo-400">
                <Upload size={24} />
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-slate-300">
                    Click or drag image here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP
                </p>
            </div>
        </div>
    );
};

export default ImageUploader;
