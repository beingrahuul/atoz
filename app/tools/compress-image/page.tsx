"use client";

import React, { useState } from 'react';
import { Minimize, Download } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import imageCompression from 'browser-image-compression';

export default function CompressImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [targetSizeKB, setTargetSizeKB] = useState<number>(200);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [resultScale, setResultScale] = useState<number | null>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog("Image loaded. Set target size and compress.");
            // Automatically suggest a target size (half of current in KB)
            const currentKB = files[0].size / 1024;
            setTargetSizeKB(Math.max(10, Math.floor(currentKB * 0.5)));
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog(`Starting compression. Target: ${targetSizeKB} KB`);

        try {
            if (file.size <= targetSizeKB * 1024) {
                // Upscaling Request: Target is LARGER than original
                setProgressLog(`Upscaling image to target: ${targetSizeKB} KB...`);

                // Use an iterative canvas approach to increase file size by bumping resolution/quality artificially
                const img = new window.Image();
                const objectUrl = URL.createObjectURL(file);

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = objectUrl;
                });

                // Create canvas and scale it up drastically to intentionally bloat the file
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Determine a bloated scale factor to try and hit the target
                const scaleFactor = Math.sqrt((targetSizeKB * 1024) / file.size) * 1.5;

                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }

                // Export at max quality
                const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

                // Check resultant size
                const blob = await (await fetch(dataUrl)).blob();

                const finalSizeKB = (blob.size / 1024).toFixed(2);
                const url = URL.createObjectURL(blob);
                setDownloadUrl(url);

                const ratio = ((blob.size / file.size) * 100).toFixed(1);
                setResultScale(parseFloat(ratio));
                setProgressLog(`Done Upscaling! Final size: ${finalSizeKB} KB (${ratio}% of original)`);

                URL.revokeObjectURL(objectUrl);
                setIsProcessing(false);
                return;
            }

            // Normal Downward Compression Request
            const options = {
                maxSizeMB: targetSizeKB / 1024,
                maxWidthOrHeight: 4096, // Keep original dimensions mostly
                useWebWorker: true,
                onProgress: (progress: number) => {
                    setProgressLog(`Compressing... ${progress}%`);
                }
            };

            const compressedFile = await imageCompression(file, options);

            const finalSizeKB = (compressedFile.size / 1024).toFixed(2);

            const url = URL.createObjectURL(compressedFile);
            setDownloadUrl(url);

            const ratio = ((compressedFile.size / file.size) * 100).toFixed(1);
            setResultScale(parseFloat(ratio));
            setProgressLog(`Done! Final size: ${finalSizeKB} KB (${ratio}% of original)`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Compress Image"
            description="Hit an exact target file size for JPG, PNG, and WebP images locally."
            icon={<Minimize size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="image/*"
                    onFilesSelected={handleFileSelect}
                    title="Drop your Images here"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{file.name}</h3>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            Original: {(file.size / 1024).toFixed(2)} KB
                        </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Target Size (KB)</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <input
                                type="range"
                                min="10"
                                max={Math.floor(file.size / 1024 + 1000)}
                                step="5"
                                value={targetSizeKB}
                                onChange={(e) => setTargetSizeKB(parseInt(e.target.value))}
                                disabled={isProcessing}
                                style={{ flex: 1 }}
                            />
                            <input
                                type="number"
                                value={targetSizeKB}
                                onChange={(e) => setTargetSizeKB(parseInt(e.target.value))}
                                disabled={isProcessing}
                                style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }}
                            />
                            KB
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                        {'>'} {progressLog}
                    </div>

                    {downloadUrl ? (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a
                                href={downloadUrl}
                                download={`compressed_${file.name}`}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                <Download size={20} /> Download Compressed Image
                            </a>
                            <button onClick={() => setFile(null)} className="btn-secondary">
                                Compress Another
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
                                {isProcessing ? 'Compressing...' : 'Compress Image'}
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
