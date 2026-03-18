"use client";

import React, { useState } from 'react';
import { RefreshCw, Download, ArrowRight } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
// heic2any is dynamically imported in processFile to avoid SSR errors

type TargetFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export default function ConvertImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/jpeg');
    const [jpegQuality, setJpegQuality] = useState<number>(0.92);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState<string>("");

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog(`File loaded: ${files[0].type || 'Unknown type'}`);
        }
    };

    const getExtension = (mime: TargetFormat) => {
        if (mime === 'image/jpeg') return 'jpg';
        if (mime === 'image/png') return 'png';
        if (mime === 'image/webp') return 'webp';
        return 'img';
    }

    const getFormatLabel = (mime: TargetFormat) => {
        if (mime === 'image/jpeg') return 'JPG';
        if (mime === 'image/png') return 'PNG';
        if (mime === 'image/webp') return 'WebP';
        return 'Unknown';
    }

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDownloadUrl(null);

        try {
            let fileToConvert = file;

            // Handle HEIC Safari/iPhone format first via heic2any
            if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                setProgressLog("Detected HEIC format. Converting to standard image buffer first...");
                const heic2any = (await import('heic2any')).default;
                const result = await heic2any({
                    blob: file,
                    toType: "image/png",
                    quality: 1
                });
                // heic2any can return an array of blobs if multiple images are in a file
                fileToConvert = Array.isArray(result)
                    ? new File([result[0]], file.name, { type: 'image/png' })
                    : new File([result], file.name, { type: 'image/png' });
            }

            setProgressLog(`Loading image logic for conversion to ${getFormatLabel(targetFormat)}...`);

            const img = new window.Image();
            const objectUrl = URL.createObjectURL(fileToConvert);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            canvas.width = img.width;
            canvas.height = img.height;

            // If converting to JPEG, we need to fill the background white
            // otherwise transparent pixels become black in JPEG.
            if (targetFormat === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            setProgressLog(`Encoding to ${getFormatLabel(targetFormat)}...`);

            const dataUrl = canvas.toDataURL(targetFormat, jpegQuality);

            const blob = await (await fetch(dataUrl)).blob();
            const url = URL.createObjectURL(blob);

            const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + getExtension(targetFormat);
            setDownloadName(newName);
            setDownloadUrl(url);

            URL.revokeObjectURL(objectUrl);
            setProgressLog(`Done! Final size: ${(blob.size / 1024).toFixed(2)} KB`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Format Converter"
            description="Convert any image format to JPG, PNG, or WebP seamlessly in your browser. Fully supports Apple HEIC."
            icon={<RefreshCw size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="image/*,.heic,.heif"
                    onFilesSelected={handleFileSelect}
                    title="Drop any image here"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '32px' }}>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Original ({file.type.split('/')[1]?.toUpperCase() || 'File'})</div>
                            <div style={{ fontWeight: 600, fontSize: '1.25rem', color: 'white' }}>{(file.size / 1024).toFixed(2)} KB</div>
                        </div>

                        <ArrowRight size={24} style={{ color: 'var(--accent-color)' }} />

                        <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', textAlign: 'center', minWidth: '150px', border: '1px solid var(--accent-color)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Format</div>
                            <select
                                value={targetFormat}
                                onChange={(e) => setTargetFormat(e.target.value as TargetFormat)}
                                disabled={isProcessing}
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.25rem', marginTop: '4px', cursor: 'pointer', outline: 'none' }}
                            >
                                <option value="image/jpeg" style={{ background: 'var(--surface-color)', color: 'white' }}>JPG</option>
                                <option value="image/png" style={{ background: 'var(--surface-color)', color: 'white' }}>PNG</option>
                                <option value="image/webp" style={{ background: 'var(--surface-color)', color: 'white' }}>WebP</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 600 }}>
                            <span>Quality</span>
                            <span style={{ color: 'var(--accent-color)' }}>{Math.round(jpegQuality * 100)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={jpegQuality}
                            onChange={(e) => setJpegQuality(parseFloat(e.target.value))}
                            disabled={isProcessing || targetFormat === 'image/png'} // PNG is lossless in the canvas encoder
                            style={{ width: '100%', opacity: targetFormat === 'image/png' ? 0.3 : 1 }}
                        />
                        {targetFormat === 'image/png' && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>PNG is lossless; quality slider is disabled.</p>}
                    </div>

                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                        {'>'} {progressLog}
                    </div>

                    {downloadUrl ? (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a
                                href={downloadUrl}
                                download={downloadName}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                <Download size={20} /> Download {getFormatLabel(targetFormat)}
                            </a>
                            <button onClick={() => setFile(null)} className="btn-secondary">
                                Convert Another
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={processFile}
                                disabled={isProcessing}
                                className="btn-primary"
                                style={{ flex: 1, opacity: isProcessing ? 0.7 : 1 }}
                            >
                                {isProcessing ? 'Converting...' : 'Convert Image'}
                            </button>
                            <button
                                onClick={() => setFile(null)}
                                disabled={isProcessing}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </ToolLayout>
    );
}
