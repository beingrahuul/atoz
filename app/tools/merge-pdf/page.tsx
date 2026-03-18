"use client";

import React, { useState } from 'react';
import { FilePlus, Download, GripVertical, Trash2 } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import { PDFDocument } from 'pdf-lib';

export default function MergePdfPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
        setDownloadUrl(null);
        setProgressLog(`${newFiles.length} files added. You can reorder or add more.`);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (files.length <= 1) setDownloadUrl(null);
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === files.length - 1) return;

        const newFiles = [...files];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
        setFiles(newFiles);
    };

    const processFiles = async () => {
        if (files.length < 2) {
            setProgressLog("Please add at least 2 PDF files to merge.");
            return;
        }

        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog(`Starting merge of ${files.length} documents...`);

        try {
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < files.length; i++) {
                setProgressLog(`Processing file ${i + 1} of ${files.length}: ${files[i].name}...`);

                const fileArrayBuffer = await files[i].arrayBuffer();
                const pdf = await PDFDocument.load(fileArrayBuffer);

                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
            }

            setProgressLog("Saving compiled document...");
            const pdfBytes = await mergedPdf.save();

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgressLog(`Done! Successfully merged into 1 PDF.`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Merge PDF"
            description="Combine multiple PDF files into one single document. Order them exactly how you need."
            icon={<FilePlus size={32} />}
        >
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: files.length > 0 ? '1fr 1fr' : '1fr' }}>

                <div>
                    <FileUploadDropzone
                        accept="application/pdf"
                        multiple={true}
                        onFilesSelected={handleFileSelect}
                        title={files.length > 0 ? "Add more PDFs" : "Drop PDFs here"}
                    />
                </div>

                {files.length > 0 && (
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Document Order</h3>

                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                            {files.map((file, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <GripVertical size={16} style={{ color: 'var(--text-secondary)', cursor: 'grab' }} />

                                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                        <span style={{ color: 'var(--accent-color)', marginRight: '8px' }}>{idx + 1}.</span>
                                        {file.name}
                                    </div>

                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button disabled={idx === 0} onClick={() => moveFile(idx, 'up')} style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                                        <button disabled={idx === files.length - 1} onClick={() => moveFile(idx, 'down')} style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: idx === files.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
                                        <button onClick={() => removeFile(idx)} style={{ padding: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', borderRadius: '4px' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-color)' }}>
                            {'>'} {progressLog}
                        </div>

                        {downloadUrl ? (
                            <a
                                href={downloadUrl}
                                download="merged_document.pdf"
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download Merged PDF
                            </a>
                        ) : (
                            <button
                                onClick={processFiles}
                                disabled={isProcessing || files.length < 2}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', opacity: (isProcessing || files.length < 2) ? 0.5 : 1 }}
                            >
                                {isProcessing ? 'Merging...' : `Merge ${files.length} PDFs`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
