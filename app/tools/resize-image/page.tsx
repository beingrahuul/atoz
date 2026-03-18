"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Crop, Download } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';

export default function ResizeImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);

    const [targetWidth, setTargetWidth] = useState<number>(0);
    const [targetHeight, setTargetHeight] = useState<number>(0);
    const [maintainRatio, setMaintainRatio] = useState<boolean>(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [ratio, setRatio] = useState<number>(1); // w/h

    const imgRef = useRef<HTMLImageElement>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setDownloadUrl(null);

            const objectUrl = URL.createObjectURL(selectedFile);
            const img = new window.Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
                setTargetWidth(img.width);
                setTargetHeight(img.height);
                setRatio(img.width / img.height);
            };
            img.src = objectUrl;
        }
    };

    const handleWidthChange = (val: number) => {
        setTargetWidth(val);
        if (maintainRatio && imageDimensions) {
            setTargetHeight(Math.round(val / ratio));
        }
    };

    const handleHeightChange = (val: number) => {
        setTargetHeight(val);
        if (maintainRatio && imageDimensions) {
            setTargetWidth(Math.round(val * ratio));
        }
    };

    const handlePercentageChange = (pct: number) => {
        if (imageDimensions) {
            setTargetWidth(Math.round(imageDimensions.width * (pct / 100)));
            setTargetHeight(Math.round(imageDimensions.height * (pct / 100)));
        }
    }

    const processFile = async () => {
        if (!file || !imageDimensions) return;
        setIsProcessing(true);
        setDownloadUrl(null);

        try {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Draw resized
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Export preserving original mime type if possible, default to png for transparency
            const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
            const dataUrl = canvas.toDataURL(mimeType, 0.95);

            const blob = await (await fetch(dataUrl)).blob();
            const url = URL.createObjectURL(blob);

            setDownloadUrl(url);
            URL.revokeObjectURL(objectUrl);

        } catch (error: any) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Resize Image"
            description="Change dimensions exactly by pixels or maintain aspect ratio percentages safely in your browser."
            icon={<Crop size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="image/*"
                    onFilesSelected={handleFileSelect}
                    title="Drop your Image here"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{file.name}</h3>
                        {imageDimensions && (
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Original: {imageDimensions.width} x {imageDimensions.height} px
                            </span>
                        )}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                        {/* Dimensions Control */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Resize Settings</label>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Width (px)</label>
                                    <input
                                        type="number"
                                        value={targetWidth}
                                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                                        className="glass"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white', fontSize: '1rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Height (px)</label>
                                    <input
                                        type="number"
                                        value={targetHeight}
                                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                                        className="glass"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <input
                                    type="checkbox"
                                    checked={maintainRatio}
                                    onChange={(e) => setMaintainRatio(e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)' }}
                                />
                                Maintain Aspect Ratio
                            </label>
                        </div>

                        {/* Quick Presets */}
                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Presets</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[25, 50, 75, 125, 150, 200].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => handlePercentageChange(pct)}
                                        className="btn-secondary"
                                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {downloadUrl ? (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a
                                href={downloadUrl}
                                download={`resized_${file.name}`}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                <Download size={20} /> Download Resized Image
                            </a>
                            <button onClick={() => setFile(null)} className="btn-secondary">
                                Resize Another
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
                                {isProcessing ? 'Resizing...' : 'Resize Image'}
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
