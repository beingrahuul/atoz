"use client";

import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from './FileUploadDropzone.module.css';

interface FileUploadDropzoneProps {
    accept: string;
    multiple?: boolean;
    onFilesSelected: (files: File[]) => void;
    title?: string;
    subtitle?: string;
}

export default function FileUploadDropzone({
    accept,
    multiple = false,
    onFilesSelected,
    title = "Choose or drop files here",
    subtitle = "All processing happens securely in your browser"
}: FileUploadDropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const filesArray = Array.from(e.dataTransfer.files);
            onFilesSelected(multiple ? filesArray : [filesArray[0]]);
        }
    }, [multiple, onFilesSelected]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            onFilesSelected(multiple ? filesArray : [filesArray[0]]);
        }
    }, [multiple, onFilesSelected]);

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
        >
            <input
                type="file"
                ref={inputRef}
                onChange={handleChange}
                accept={accept}
                multiple={multiple}
                className={styles.hiddenInput}
            />
            <UploadCloud className={styles.icon} />
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{subtitle}</p>

            <div style={{ marginTop: '16px' }}>
                <span className="btn-primary">Select {multiple ? 'Files' : 'File'}</span>
            </div>
        </div>
    );
}
