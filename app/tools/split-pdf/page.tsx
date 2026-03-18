"use client";

import React, { useState } from 'react';
import { FileMinus, Download, Scissors } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import { PDFDocument } from 'pdf-lib';

export default function SplitPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [rangeInput, setRangeInput] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setProgressLog("Reading document structure...");

            try {
                const fileArrayBuffer = await files[0].arrayBuffer();
                const pdf = await PDFDocument.load(fileArrayBuffer);
                const count = pdf.getPageCount();
                setTotalPages(count);
                setRangeInput(`1-${count}`);
                setProgressLog(`Document loaded. Found ${count} pages.`);
            } catch (e: any) {
                setProgressLog(`Error reading PDF: ${e.message}`);
            }
        }
    };

    const processFile = async () => {
        if (!file || !rangeInput.trim()) return;
        setIsProcessing(true);
        setDownloadUrl(null);

        try {
            // Parse range string (e.g., "1-3, 5, 8-10")
            // Quick naive parser
            const parts = rangeInput.split(',').map(p => p.trim());
            const pageIndicesToKeep = new Set<number>();

            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-');
                    const s = parseInt(start);
                    const e = parseInt(end);
                    if (!isNaN(s) && !isNaN(e) && s <= e && s >= 1 && e <= totalPages) {
                        for (let i = s; i <= e; i++) pageIndicesToKeep.add(i - 1); // 0-indexed
                    }
                } else {
                    const num = parseInt(part);
                    if (!isNaN(num) && num >= 1 && num <= totalPages) pageIndicesToKeep.add(num - 1);
                }
            }

            const indicesArray = Array.from(pageIndicesToKeep).sort((a, b) => a - b);

            if (indicesArray.length === 0) {
                setProgressLog("Invalid page range. Please use format like '1-5, 8, 11-13'");
                setIsProcessing(false);
                return;
            }

            setProgressLog(`Extracting ${indicesArray.length} pages...`);

            const fileArrayBuffer = await file.arrayBuffer();
            const originalPdf = await PDFDocument.load(fileArrayBuffer);

            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(originalPdf, indicesArray);
            copiedPages.forEach((page) => newPdf.addPage(page));

            setProgressLog("Saving compiled document...");
            const pdfBytes = await newPdf.save();

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgressLog(`Done! Extracted ${indicesArray.length} pages into new file.`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Split PDF"
            description="Extract specific pages or separate one big document into multiple smaller files."
            icon={<FileMinus size={32} />}
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
                            {totalPages} Pages
                        </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Pages to Extract</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Example: 1-5, 8, 11-13</p>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Scissors size={20} style={{ color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                value={rangeInput}
                                onChange={(e) => setRangeInput(e.target.value)}
                                placeholder={`e.g., 1-${totalPages}`}
                                disabled={isProcessing}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white', fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                        {'>'} {progressLog}
                    </div>

                    {downloadUrl ? (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a
                                href={downloadUrl}
                                download={`split_${file.name}`}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download Extracted PDF
                            </a>
                            <button onClick={() => { setFile(null); setTotalPages(0); }} className="btn-secondary">
                                Split Another
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
                                {isProcessing ? 'Extracting...' : 'Extract Pages'}
                            </button>
                            <button
                                onClick={() => { setFile(null); setTotalPages(0); }}
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
