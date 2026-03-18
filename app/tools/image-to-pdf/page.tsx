"use client";

import React, { useState } from 'react';
import { Image as ImageIcon, Download, GripVertical, Trash2 } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import { PDFDocument } from 'pdf-lib';

export default function ImageToPdfPage() {
    const [images, setImages] = useState<{ file: File, objectUrl: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLog, setProgressLog] = useState<string>("Waiting to start...");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileSelect = (newFiles: File[]) => {
        const newItems = newFiles.map(f => ({
            file: f,
            objectUrl: URL.createObjectURL(f)
        }));
        setImages(prev => [...prev, ...newItems]);
        setDownloadUrl(null);
        setProgressLog(`${newFiles.length} images added. You can reorder or add more.`);
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(images[index].objectUrl);
        setImages(prev => prev.filter((_, i) => i !== index));
        if (images.length <= 1) setDownloadUrl(null);
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === images.length - 1) return;

        const newImgs = [...images];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newImgs[index], newImgs[targetIndex]] = [newImgs[targetIndex], newImgs[index]];
        setImages(newImgs);
    };

    const processImages = async () => {
        if (images.length === 0) return;

        setIsProcessing(true);
        setDownloadUrl(null);
        setProgressLog(`Starting compilation of ${images.length} images into PDF...`);

        try {
            const pdfDoc = await PDFDocument.create();

            for (let i = 0; i < images.length; i++) {
                setProgressLog(`Processing image ${i + 1} of ${images.length}...`);

                const fileArrayBuffer = await images[i].file.arrayBuffer();
                let pdfImage;

                if (images[i].file.type === 'image/png') {
                    pdfImage = await pdfDoc.embedPng(fileArrayBuffer);
                } else {
                    // Assume JPEG or convertable
                    pdfImage = await pdfDoc.embedJpg(fileArrayBuffer);
                }

                const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
                page.drawImage(pdfImage, {
                    x: 0,
                    y: 0,
                    width: pdfImage.width,
                    height: pdfImage.height,
                });
            }

            setProgressLog("Saving compiled document...");
            const pdfBytes = await pdfDoc.save();

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgressLog(`Done! Successfully merged into 1 PDF.`);

        } catch (error: any) {
            console.error(error);
            setProgressLog(`Error: ${error.message} (Note: Only standard JPG/PNG are supported natively for this tool currently)`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Image to PDF"
            description="Compile a collection of images into one single PDF document effortlessly."
            icon={<ImageIcon size={32} />}
        >
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: images.length > 0 ? '1fr 1fr' : '1fr' }}>

                <div>
                    <FileUploadDropzone
                        accept="image/jpeg, image/png"
                        multiple={true}
                        onFilesSelected={handleFileSelect}
                        title={images.length > 0 ? "Add more Images" : "Drop Images here"}
                    />
                </div>

                {images.length > 0 && (
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Image Order</h3>

                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                            {images.map((img, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <GripVertical size={16} style={{ color: 'var(--text-secondary)', cursor: 'grab' }} />

                                    <img src={img.objectUrl} alt={img.file.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />

                                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                        <span style={{ color: 'var(--accent-color)', marginRight: '8px' }}>{idx + 1}.</span>
                                        {img.file.name}
                                    </div>

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button disabled={idx === 0} onClick={() => moveImage(idx, 'up')} style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                                        <button disabled={idx === images.length - 1} onClick={() => moveImage(idx, 'down')} style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: idx === images.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
                                        <button onClick={() => removeImage(idx)} style={{ padding: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', borderRadius: '4px' }}><Trash2 size={14} /></button>
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
                                download="images_compiled.pdf"
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <Download size={20} /> Download PDF
                            </a>
                        ) : (
                            <button
                                onClick={processImages}
                                disabled={isProcessing || images.length === 0}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', opacity: (isProcessing || images.length === 0) ? 0.5 : 1 }}
                            >
                                {isProcessing ? 'Compiling...' : `Convert ${images.length} Images to PDF`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
