"use client";

import React, { useState } from 'react';
import { Download, FileSignature } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export default function WatermarkPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
    const [opacity, setOpacity] = useState<number>(0.3);
    const [fontSize, setFontSize] = useState<number>(60);
    const [rotation, setRotation] = useState<number>(45);
    const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog(`File loaded: ${files[0].name}. Configure watermark and apply.`);
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog("Parsing PDF document...");

        try {
            const fileArrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileArrayBuffer);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const pages = pdfDoc.getPages();
            const numPages = pages.length;
            setProgressLog(`Document loaded. Stamping ${numPages} pages...`);

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                if (watermarkText) {
                    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
                    const textHeight = helveticaFont.heightAtSize(fontSize);

                    // Center the watermark
                    page.drawText(watermarkText, {
                        x: width / 2 - textWidth / 2,
                        y: height / 2 - textHeight / 2,
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0.8, 0.8, 0.8), // Light gray
                        opacity: opacity,
                        rotate: degrees(rotation),
                    });
                }

                if (addPageNumbers) {
                    const numText = `${i + 1} / ${numPages}`;
                    const textWidth = helveticaRegular.widthOfTextAtSize(numText, 12);
                    page.drawText(numText, {
                        x: width / 2 - textWidth / 2,
                        y: 20, // Bottom margin
                        size: 12,
                        font: helveticaRegular,
                        color: rgb(0, 0, 0),
                    });
                }
            }

            setProgressLog("Saving compiled document...");
            const pdfBytes = await pdfDoc.save();

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgressLog(`Done! Watermark stamped on ${numPages} pages.`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Watermark PDF"
            description="Stamp text over your PDF pages and automatically add page numbers."
            icon={<FileSignature size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="application/pdf"
                    onFilesSelected={handleFileSelect}
                    title="Drop your PDF here"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

                        {/* Left Column: Watermark Text */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Watermark Text</label>
                            <input
                                type="text"
                                value={watermarkText}
                                onChange={(e) => setWatermarkText(e.target.value)}
                                placeholder="e.g. CONFIDENTIAL"
                                disabled={isProcessing}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white', fontSize: '1rem', outline: 'none', marginBottom: '16px' }}
                            />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <input
                                    type="checkbox"
                                    checked={addPageNumbers}
                                    onChange={(e) => setAddPageNumbers(e.target.checked)}
                                    disabled={isProcessing}
                                    style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px' }}
                                />
                                Stamp Page Numbers to bottom center
                            </label>
                        </div>

                        {/* Right Column: Appearance */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Opacity</span>
                                    <span>{Math.round(opacity * 100)}%</span>
                                </label>
                                <input
                                    type="range" min="0.1" max="1" step="0.1"
                                    value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    disabled={isProcessing} style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Font Size</span>
                                    <span>{fontSize}px</span>
                                </label>
                                <input
                                    type="range" min="20" max="140" step="5"
                                    value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    disabled={isProcessing} style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Rotation</span>
                                    <span>{rotation}°</span>
                                </label>
                                <input
                                    type="range" min="0" max="360" step="15"
                                    value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))}
                                    disabled={isProcessing} style={{ width: '100%' }}
                                />
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
                                download={`watermarked_${file.name}`}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download Watermarked PDF
                            </a>
                            <button onClick={() => setFile(null)} className="btn-secondary">
                                Watermark Another
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={processFile}
                                disabled={isProcessing || (!watermarkText && !addPageNumbers)}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center', opacity: (isProcessing || (!watermarkText && !addPageNumbers)) ? 0.5 : 1 }}
                            >
                                {isProcessing ? 'Stamping...' : 'Apply Watermark'}
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
