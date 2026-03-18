"use client";

import React, { useCallback, useRef, useState } from 'react';
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

    const emitFiles = useCallback((fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) {
            return;
        }

        const filesArray = Array.from(fileList);
        onFilesSelected(multiple ? filesArray : [filesArray[0]]);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, [multiple, onFilesSelected]);

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
        emitFiles(e.dataTransfer.files);
    }, [emitFiles]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        emitFiles(e.target.files);
    }, [emitFiles]);

    const onButtonClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onButtonClick();
        }
    }, [onButtonClick]);

    return (
        <div
            className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={title}
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
