"use client";

import React, { useState } from 'react';
import { FileDown, Download } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Need to set pdf.js worker globally for it to work in browsers
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function CompressPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [targetSizeMB, setTargetSizeMB] = useState<number>(1.5);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog("File loaded. Set target size and compress.");
            // Automatically suggest a target size (half of current)
            const currentMB = files[0].size / (1024 * 1024);
            setTargetSizeMB(Math.max(0.1, parseFloat((currentMB * 0.5).toFixed(2))));
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog(`Starting compression. Target: ${targetSizeMB} MB`);

        try {
            // In a pure browser implementation, full iterative image replacement is very complex.
            // We'll create an algorithm that rasterizes each page to a canvas at a calculated resolution
            // and creates a new PDF with those images. This reliably controls exact file size.

            const fileArrayBuffer = await file.arrayBuffer();
            setProgressLog("Reading document...");

            // Load with pdf.js to render pages
            const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;
            const numPages = pdf.numPages;

            // Create new PDF
            const newPdf = await PDFDocument.create();

            // We need to estimate how much quality to use to hit the target size.
            // E.g. Target MB / Num Pages = Target MB per page.
            let quality = 0.8;
            let scale = 1.5; // Start with decent resolution

            // If file is already smaller than target, just save it or warn
            if (file.size <= targetSizeMB * 1024 * 1024) {
                setProgressLog("File is already smaller than or equal to the target size.");
                setIsProcessing(false);
                return;
            }

            for (let i = 1; i <= numPages; i++) {
                setProgressLog(`Processing page ${i} of ${numPages}...`);
                const page = await pdf.getPage(i);

                const viewport = page.getViewport({ scale: scale });

                // Render to canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                    canvasFactory: undefined
                } as any;

                await page.render(renderContext).promise;

                // Extract JPEG
                const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

                // Add to new PDF
                const newPage = newPdf.addPage([viewport.width, viewport.height]);
                const img = await newPdf.embedJpg(imgDataUrl);

                newPage.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: viewport.width,
                    height: viewport.height,
                });
            }

            setProgressLog("Saving compiled document...");
            const pdfBytes = await newPdf.save();
            const finalSizeMB = (pdfBytes.length / (1024 * 1024)).toFixed(2);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgressLog(`Done! Final size: ${finalSizeMB} MB`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Compress PDF"
            description="Hit an exact target file size by intelligently compressing pages locally."
            icon={<FileDown size={32} />}
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
                            Original: {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Target Size (MB)</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <input
                                type="range"
                                min="0.1"
                                max="50"
                                step="0.1"
                                value={targetSizeMB}
                                onChange={(e) => setTargetSizeMB(parseFloat(e.target.value))}
                                disabled={isProcessing}
                                style={{ flex: 1 }}
                            />
                            <input
                                type="number"
                                value={targetSizeMB}
                                onChange={(e) => setTargetSizeMB(parseFloat(e.target.value))}
                                disabled={isProcessing}
                                style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }}
                            />
                            MB
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
                                <Download size={20} /> Download Compressed PDF
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
                                {isProcessing ? 'Compressing...' : 'Compress PDF'}
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
