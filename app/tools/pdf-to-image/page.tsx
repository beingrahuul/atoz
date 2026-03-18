"use client";

import React, { useState } from 'react';
import { FileImage, Download } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import JSZip from 'jszip';

export default function PdfToImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState<number>(2.0); // Scale factor for rendering (higher = better res)
    const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState<string>("");

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog(`File loaded: ${files[0].name}`);
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDownloadUrl(null);

        try {
            // Dynamically import pdfjs-dist to avoid DOMMatrix error during SSR/prerender
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const fileArrayBuffer = await file.arrayBuffer();
            setProgressLog("Loading PDF engine...");
            const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;
            const numPages = pdf.numPages;

            setProgressLog(`Document loaded. Extracting ${numPages} pages as high-res images...`);

            const zip = new JSZip();
            const ext = format === 'image/jpeg' ? 'jpg' : 'png';

            for (let i = 1; i <= numPages; i++) {
                setProgressLog(`Rendering page ${i} of ${numPages}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: quality });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                } as any;

                await page.render(renderContext).promise;

                const imgDataUrl = canvas.toDataURL(format, 0.95);
                // Remove the data:image/jpeg;base64, prefix for JSZip
                const base64Data = imgDataUrl.split(',')[1];

                const padIndex = String(i).padStart(3, '0');
                zip.file(`page_${padIndex}.${ext}`, base64Data, { base64: true });
            }

            setProgressLog("Zipping images into an archive...");
            const zipBlob = await zip.generateAsync({ type: 'blob' });

            const url = URL.createObjectURL(zipBlob);
            const outputName = file.name.substring(0, file.name.lastIndexOf('.')) + '_images.zip';

            setDownloadName(outputName);
            setDownloadUrl(url);

            setProgressLog(`Done! Images packed into ZIP. Size: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="PDF to Image"
            description="Extract every page of your PDF into high-quality JPG or PNG images, securely zipped."
            icon={<FileImage size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="application/pdf"
                    onFilesSelected={handleFileSelect}
                    title="Drop your PDF here"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{file.name}</h3>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            Organizing output as ZIP
                        </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Image Quality / Resolution</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="4.0"
                                    step="0.5"
                                    value={quality}
                                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                                    disabled={isProcessing}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontWeight: 800, color: 'var(--accent-color)', width: '40px' }}>{quality}x</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Higher scales produce sharper images but larger ZIP files.</p>
                        </div>

                        <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Output Format</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value="image/jpeg"
                                        checked={format === 'image/jpeg'}
                                        onChange={() => setFormat('image/jpeg')}
                                        disabled={isProcessing}
                                        style={{ accentColor: 'var(--accent-color)' }}
                                    /> JPG
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value="image/png"
                                        checked={format === 'image/png'}
                                        onChange={() => setFormat('image/png')}
                                        disabled={isProcessing}
                                        style={{ accentColor: 'var(--accent-color)' }}
                                    /> PNG
                                </label>
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
                                download={downloadName}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download Images (ZIP)
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
                                style={{ flex: 1, justifyContent: 'center', opacity: isProcessing ? 0.7 : 1 }}
                            >
                                {isProcessing ? 'Converting...' : 'Extract to Images'}
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
