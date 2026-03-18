"use client";

import React, { useState } from 'react';
import { Layers, Download, GripVertical, Trash2 } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import { PDFDocument } from 'pdf-lib';


interface PageData {
    originalIndex: number;
    previewUrl: string;
}

export default function OrganizePdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog("Loading document pages for preview...");

            try {
                // Dynamically import pdfjs-dist to avoid DOMMatrix error during SSR/prerender
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

                const fileArrayBuffer = await files[0].arrayBuffer();
                const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;
                const numPages = pdf.numPages;

                const newPages: PageData[] = [];

                // Generate small thumbnail previews for the grid
                for (let i = 1; i <= numPages; i++) {
                    setProgressLog(`Extracting thumbnail ${i} of ${numPages}...`);
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        await page.render({ canvasContext: context, viewport } as any).promise;
                        newPages.push({
                            originalIndex: i - 1,
                            previewUrl: canvas.toDataURL('image/jpeg', 0.5)
                        });
                    }
                }

                setPages(newPages);
                setProgressLog(`Loaded ${newPages.length} pages. Drag to reorder or click trash to remove.`);
            } catch (e: any) {
                setProgressLog(`Error reading PDF: ${e.message}`);
            }
        }
    };

    const removePage = (index: number) => {
        setPages(prev => prev.filter((_, i) => i !== index));
        if (pages.length <= 1) setDownloadUrl(null);
    };

    const movePage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === pages.length - 1) return;

        const newPages = [...pages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
        setPages(newPages);
    };

    const processFile = async () => {
        if (!file || pages.length === 0) return;
        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog(`Compiling new document with ${pages.length} pages...`);

        try {
            const fileArrayBuffer = await file.arrayBuffer();
            const originalPdf = await PDFDocument.load(fileArrayBuffer);

            const newPdf = await PDFDocument.create();

            // Order requested by user
            const copyIndices = pages.map(p => p.originalIndex);
            const copiedPages = await newPdf.copyPages(originalPdf, copyIndices);

            copiedPages.forEach((page) => newPdf.addPage(page));

            setProgressLog("Saving compiled document...");
            const pdfBytes = await newPdf.save();

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgressLog(`Done! Reorganized PDF created successfully.`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Organize PDF"
            description="Sort, reorder, or delete PDF pages visually."
            icon={<Layers size={32} />}
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
                        <span style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                            {pages.length} Pages Currently
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '16px',
                        marginBottom: '32px',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '12px'
                    }}>
                        {pages.map((p, idx) => (
                            <div key={`${p.originalIndex}-${idx}`} style={{
                                background: 'var(--surface-color)',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                position: 'relative',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {idx + 1}
                                </div>

                                <img src={p.previewUrl} alt={`Page ${idx + 1}`} style={{ width: '100%', height: '180px', objectFit: 'contain', background: 'white' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button disabled={idx === 0} onClick={() => movePage(idx, 'up')} style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>←</button>
                                        <button disabled={idx === pages.length - 1} onClick={() => movePage(idx, 'down')} style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: idx === pages.length - 1 ? 'not-allowed' : 'pointer' }}>→</button>
                                    </div>
                                    <button onClick={() => removePage(idx)} style={{ padding: '4px', color: 'var(--error-color)' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                        {'>'} {progressLog}
                    </div>

                    {downloadUrl ? (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a
                                href={downloadUrl}
                                download={`organized_${file.name}`}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download PDF
                            </a>
                            <button onClick={() => { setFile(null); setPages([]); }} className="btn-secondary">
                                Organize Another
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={processFile}
                                disabled={isProcessing || pages.length === 0}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center', opacity: (isProcessing || pages.length === 0) ? 0.7 : 1 }}
                            >
                                {isProcessing ? 'Processing...' : `Save File (${pages.length} Pages)`}
                            </button>
                            <button
                                onClick={() => { setFile(null); setPages([]); }}
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
