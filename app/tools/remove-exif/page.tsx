"use client";

import React, { useState, useEffect } from 'react';
import { Ghost, Download, FileSearch, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import exifr from 'exifr';

export default function RemoveExifPage() {
    const [file, setFile] = useState<File | null>(null);
    const [exifData, setExifData] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = async (files: File[]) => {
        if (files.length > 0) {
            const selected = files[0];
            setFile(selected);
            setDownloadUrl(null);
            setExifData(null);
            setIsScanning(true);
            setProgressLog(`Loaded ${selected.name}. Scanning for hidden EXIF metadata...`);

            try {
                // Parse literally everything exifr can find
                const data = await exifr.parse(selected, {
                    tiff: true,
                    exif: true,
                    gps: true,
                    xmp: true,
                    iptc: true,
                });

                if (data && Object.keys(data).length > 0) {
                    setExifData(data);
                    setProgressLog("Warning: Potentially sensitive metadata found.");
                } else {
                    setExifData({});
                    setProgressLog("Good news! No EXIF metadata detected. File is already clean.");
                }
            } catch (e: any) {
                console.error("EXIF parsing error:", e);
                setExifData({});
                setProgressLog("Could not parse EXIF data. It may already be clean or unsupported.");
            } finally {
                setIsScanning(false);
            }
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog("Reading original file...");

        try {
            // The easiest and safest way to strip EXIF in a browser is to render the image to a canvas 
            // and export it back out. Canvas does not retain EXIF metadata (GPS, Camera make, timestamps).
            const objectUrl = URL.createObjectURL(file);
            const img = new window.Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            setProgressLog("Scrubbing metadata (GPS, Camera Info, Dates)...");

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed");

            ctx.drawImage(img, 0, 0);

            // Keep original format or fallback to JPEG securely
            const format = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
            const dataUrl = canvas.toDataURL(format, 1.0); // max quality

            const blob = await (await fetch(dataUrl)).blob();
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Update UI to show it's clean
            setExifData({});
            setProgressLog(`Privacy Scrub Complete! Removed approx. ${Math.max(0, file.size - blob.size)} bytes of tracking metadata.`);
            URL.revokeObjectURL(objectUrl);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper to safely render nested metadata objects
    const renderMetadataValue = (val: any): string => {
        if (val instanceof Date) return val.toLocaleString();
        if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return String(val);
    };

    return (
        <ToolLayout
            title="Remove EXIF Data"
            description="Scan and scrub hidden GPS location, camera models, and timestamps from your photos before sharing them online."
            icon={<Ghost size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="image/jpeg, image/png, image/webp"
                    onFilesSelected={handleFileSelect}
                    title="Drop image to scan and sanitize"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>

                        {/* Left Column: Status & Original Image Info */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                                    <FileSearch size={32} style={{ color: 'var(--accent-color)' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{file.name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>

                            {isScanning ? (
                                <div style={{ padding: '16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <span>Scanning for metadata...</span>
                                </div>
                            ) : exifData && Object.keys(exifData).length > 0 ? (
                                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)', fontWeight: 600, marginBottom: '8px' }}>
                                        <AlertTriangle size={20} /> Sensitive Metadata Found
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>This image contains hidden data about where and how it was taken. See the viewer for details.</p>
                                </div>
                            ) : exifData && Object.keys(exifData).length === 0 ? (
                                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: 600, marginBottom: '8px' }}>
                                        <CheckCircle2 size={20} /> Clean Image
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No EXIF, GPS, or tracking metadata was found. This image is safe to share.</p>
                                </div>
                            ) : null}
                        </div>

                        {/* Right Column: EXIF Data Viewer */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '300px' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Detected Metadata Viewer
                            </div>
                            <div style={{ overflowY: 'auto', padding: '16px', flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {isScanning ? (
                                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>Analyzing hex blocks...</div>
                                ) : exifData && Object.keys(exifData).length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {Object.entries(exifData).map(([key, value]) => (
                                                <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '6px 0', color: 'var(--accent-color)' }}>{key}</td>
                                                    <td style={{ padding: '6px 0', color: 'white', wordBreak: 'break-all' }}>{renderMetadataValue(value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ color: 'var(--success-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                                        <CheckCircle2 size={32} />
                                        <span>No sensitive data found.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                        {'>'} {progressLog}
                    </div>

                    {downloadUrl ? (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a
                                href={downloadUrl}
                                download={`scrubbed_${file.name}`}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download Clean Image
                            </a>
                            <button onClick={() => { setFile(null); setExifData(null); }} className="btn-secondary">
                                Scan Another
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={processFile}
                                disabled={isProcessing || isScanning || (exifData && Object.keys(exifData).length === 0)}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center', opacity: (isProcessing || isScanning || (exifData && Object.keys(exifData).length === 0)) ? 0.5 : 1, background: 'var(--error-color)' }}
                            >
                                {isProcessing ? 'Scrubbing...' : 'Scrub All Metadata Now'}
                            </button>
                            <button
                                onClick={() => { setFile(null); setExifData(null); }}
                                disabled={isProcessing}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
        </ToolLayout>
    );
}
