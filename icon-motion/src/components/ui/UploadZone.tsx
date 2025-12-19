'use client';

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import '../../styles.css';

interface UploadZoneProps {
    onFileSelect: (content: string) => void;
    className?: string;
}

/**
 * UploadZone Component
 * 
 * A button for uploading SVG files with drag-and-drop support.
 * 
 * CSS Classes used (see styles.css for customization):
 * - .upload-button: Outer button container
 * - .upload-button-inner: Inner white frame with shadow
 * - .upload-button-text: "Upload SVG" text
 * 
 * Accepts: .svg files only
 */
export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, className = '' }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                onFileSelect(content);
            };
            reader.readAsText(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                onFileSelect(content);
            };
            reader.readAsText(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className={className}>
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileChange}
                className="sr-only"
            />

            {/* Visible upload button */}
            <button
                className="upload-button"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div className="upload-button-inner">
                    <Upload style={{ width: 14, height: 14 }} />
                    <span className="upload-button-text">Upload SVG</span>
                </div>
            </button>
        </div>
    );
};
