"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Type, Download, Settings } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';

export default function WatermarkImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const [watermarkText, setWatermarkText] = useState("© COPYRIGHT");
    const [fontSize, setFontSize] = useState(48);
    const [opacity, setOpacity] = useState(50);
    const [color, setColor] = useState("#ffffff");
    const [position, setPosition] = useState<'center' | 'bottomRight' | 'tiled'>('center');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            const selected = files[0];
            setFile(selected);
            const url = URL.createObjectURL(selected);
            setImageUrl(url);
        }
    };

    useEffect(() => {
        if (!imageUrl || !canvasRef.current || !imgRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;

        if (!ctx) return;

        if (img.complete) {
            drawWatermark(canvas, ctx, img);
        } else {
            img.onload = () => drawWatermark(canvas, ctx, img);
        }
    }, [imageUrl, watermarkText, fontSize, opacity, color, position]);

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
    };

    const drawWatermark = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Setup Text styling
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = hexToRgba(color, opacity);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (position === 'center') {
            ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
        } else if (position === 'bottomRight') {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            // Add padding
            ctx.fillText(watermarkText, canvas.width - 40, canvas.height - 40);
        } else if (position === 'tiled') {
            ctx.save();
            ctx.rotate((-45 * Math.PI) / 180);

            const textMetrics = ctx.measureText(watermarkText);
            const textWidth = textMetrics.width + 100;
            const textHeight = fontSize + 100;

            // Expanded bounds to cover rotated canvas
            const bounds = Math.max(canvas.width, canvas.height) * 2;

            for (let x = -bounds; x < bounds; x += textWidth) {
                for (let y = -bounds; y < bounds; y += textHeight) {
                    ctx.fillText(watermarkText, x, y);
                }
            }
            ctx.restore();
        }
    };

    const downloadImage = () => {
        if (!canvasRef.current || !file) return;
        // Use original image format
        const dataUrl = canvasRef.current.toDataURL(file.type, 0.95);

        const link = document.createElement('a');
        link.download = `watermarked_${file.name}`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <ToolLayout
            title="Watermark Image"
            description="Stamp your photos with text or repetitive tiled watermarks to protect your work."
            icon={<Type size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="image/*"
                    onFilesSelected={handleFileSelect}
                    title="Drop an image to watermark"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>

                        {/* Preview Area */}
                        <div style={{
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            minHeight: '400px',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden'
                        }}>
                            {imageUrl && <img ref={imgRef} src={imageUrl} alt="Source" style={{ display: 'none' }} crossOrigin="anonymous" />}
                            <canvas
                                ref={canvasRef}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '600px',
                                    objectFit: 'contain',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        {/* Controls Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-color)' }}>
                                <Settings size={18} /> <h4 style={{ fontWeight: 600 }}>Watermark Settings</h4>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Text</label>
                                <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={e => setWatermarkText(e.target.value)}
                                    className="glass"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Position Layout</label>
                                <select
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value as any)}
                                    className="glass"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
                                >
                                    <option value="center" style={{ color: 'black' }}>Center Fixed</option>
                                    <option value="bottomRight" style={{ color: 'black' }}>Bottom Right Corner</option>
                                    <option value="tiled" style={{ color: 'black' }}>Tiled (Full Coverage)</option>
                                </select>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Size</span><span>{fontSize}px</span>
                                </div>
                                <input type="range" min="12" max="200" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%' }} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Opacity</span><span>{opacity}%</span>
                                </div>
                                <input type="range" min="5" max="100" value={opacity} onChange={e => setOpacity(Number(e.target.value))} style={{ width: '100%' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Color</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }} />
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div style={{ flex: 1 }} />

                            <button onClick={downloadImage} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <Download size={20} /> Stamp & Download
                            </button>
                            <button onClick={() => setFile(null)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Start Over
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
