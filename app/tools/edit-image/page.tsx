"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCw, FlipHorizontal, FlipVertical, SlidersHorizontal, Crop as CropIcon, PenTool, Check, X } from 'lucide-react';
import ToolLayout from '../../../components/ToolLayout';
import FileUploadDropzone from '../../../components/FileUploadDropzone';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function EditImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Transform State
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    // Filter State
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [grayscale, setGrayscale] = useState(0);

    // Crop State
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [aspect, setAspect] = useState<number | undefined>(undefined);

    // Draw/Annotate State
    const [drawColor, setDrawColor] = useState('#ff0000');
    const [drawSize, setDrawSize] = useState(5);
    const [lines, setLines] = useState<{ points: { x: number, y: number }[], color: string, size: number }[]>([]);
    const currentLineRef = useRef<{ x: number, y: number }[]>([]);
    const isPointerDownRef = useRef(false);

    const [activeTab, setActiveTab] = useState<'adjust' | 'transform' | 'crop' | 'draw'>('adjust');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            const selected = files[0];
            setFile(selected);
            const url = URL.createObjectURL(selected);
            setImageUrl(url);
            resetDestructiveState();
        }
    };

    const resetDestructiveState = useCallback(() => {
        setRotation(0); setFlipH(false); setFlipV(false);
        setBrightness(100); setContrast(100); setSaturation(100); setGrayscale(0);
        setCrop(undefined); setCompletedCrop(null);
        setLines([]);
    }, []);

    const applyBaseTransformations = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
        const isRotated90 = rotation % 180 !== 0;
        canvas.width = isRotated90 ? img.naturalHeight : img.naturalWidth;
        canvas.height = isRotated90 ? img.naturalWidth : img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`;

        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();
    }, [rotation, flipH, flipV, brightness, contrast, saturation, grayscale]);

    const renderFinalDisplay = useCallback(() => {
        if (!canvasRef.current || !displayCanvasRef.current) return;

        const baseCanvas = canvasRef.current;
        const displayCanvas = displayCanvasRef.current;
        const ctx = displayCanvas.getContext('2d');
        if (!ctx) return;

        displayCanvas.width = baseCanvas.width;
        displayCanvas.height = baseCanvas.height;

        ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        ctx.drawImage(baseCanvas, 0, 0);

        lines.forEach(line => {
            if (line.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }
            ctx.stroke();
        });
    }, [lines]);

    useEffect(() => {
        if (!imageUrl || !canvasRef.current || !imgRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;
        if (!ctx) return;

        if (img.complete) {
            applyBaseTransformations(canvas, ctx, img);
            renderFinalDisplay();
        } else {
            img.onload = () => {
                applyBaseTransformations(canvas, ctx, img);
                renderFinalDisplay();
            };
        }
    }, [imageUrl, applyBaseTransformations, renderFinalDisplay]);

    // Re-render display when lines change
    useEffect(() => { renderFinalDisplay(); }, [lines, renderFinalDisplay]);

    // --- Drawing Logic ---
    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const displayCanvas = displayCanvasRef.current;
        if (!displayCanvas) return { x: 0, y: 0 };

        const rect = displayCanvas.getBoundingClientRect();
        const scaleX = displayCanvas.width / rect.width;
        const scaleY = displayCanvas.height / rect.height;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (activeTab !== 'draw') return;
        e.stopPropagation();
        isPointerDownRef.current = true;
        const coords = getCoordinates(e);
        currentLineRef.current = [coords];

        setLines(prev => [...prev, { points: [...currentLineRef.current], color: drawColor, size: drawSize }]);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isPointerDownRef.current || activeTab !== 'draw') return;
        if ('touches' in e) e.preventDefault();

        const coords = getCoordinates(e);
        currentLineRef.current.push(coords);

        setLines(prev => {
            const newLines = [...prev];
            newLines[newLines.length - 1] = {
                points: [...currentLineRef.current],
                color: drawColor,
                size: drawSize
            };
            return newLines;
        });
    };

    const stopDraw = () => {
        isPointerDownRef.current = false;
        currentLineRef.current = [];
    };

    const clearDrawing = () => setLines([]);

    // --- Export & Crop Logic ---
    const applyCrop = async () => {
        if (!displayCanvasRef.current || !completedCrop || completedCrop.width === 0) return;

        const canvas = displayCanvasRef.current;

        // Scale DOM crop coords to internal canvas resolution
        const scaleX = canvas.width / canvas.clientWidth;
        const scaleY = canvas.height / canvas.clientHeight;

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropW = completedCrop.width * scaleX;
        const cropH = completedCrop.height * scaleY;

        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = cropW;
        tmpCanvas.height = cropH;
        const ctx = tmpCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Destructively bake crop and all earlier layers into the new base image
        const newUrl = tmpCanvas.toDataURL(file?.type || 'image/png', 1.0);
        setImageUrl(newUrl);

        // Reset non-destructive state because they are now baked
        resetDestructiveState();
        setActiveTab('adjust');
    };

    const cancelCrop = () => {
        setCrop(undefined);
        setCompletedCrop(null);
    };

    const downloadImage = () => {
        if (!displayCanvasRef.current || !file) return;
        const dataUrl = displayCanvasRef.current.toDataURL(file.type, 0.95);

        const link = document.createElement('a');
        link.download = `edited_${file.name}`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <ToolLayout
            title="Photo Editor"
            description="A full suite to crop, draw, apply filters, rotate, and flip your images beautifully right in your browser."
            icon={<SlidersHorizontal size={32} />}
        >
            {!file ? (
                <FileUploadDropzone
                    accept="image/*"
                    onFilesSelected={handleFileSelect}
                    title="Drop an image to edit"
                />
            ) : (
                <div className="glass-panel" style={{ padding: '32px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 320px', gap: '32px' }}>

                        {/* Left Column: Interactive Preview Area */}
                        <div style={{
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            minHeight: '500px',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {/* Hidden base Image */}
                            {imageUrl && <img ref={imgRef} src={imageUrl} alt="Source" style={{ display: 'none' }} crossOrigin="anonymous" />}

                            {/* Hidden Base Canvas */}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => { if (activeTab === 'crop') setCrop(percentCrop); }}
                                    onComplete={(c) => { if (activeTab === 'crop') setCompletedCrop(c); }}
                                    locked={activeTab !== 'crop'}
                                    aspect={aspect}
                                    className={activeTab !== 'crop' ? 'hide-react-crop' : ''}
                                >
                                    <canvas
                                        ref={displayCanvasRef}
                                        onMouseDown={startDraw}
                                        onMouseMove={draw}
                                        onMouseUp={stopDraw}
                                        onMouseOut={stopDraw}
                                        onTouchStart={startDraw}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDraw}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '600px',
                                            display: 'block',
                                            objectFit: 'contain',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                            borderRadius: '4px',
                                            cursor: activeTab === 'draw' ? 'crosshair' : 'default',
                                            touchAction: activeTab === 'draw' ? 'none' : 'auto'
                                        }}
                                    />
                                </ReactCrop>
                            </div>
                        </div>

                        {/* Right Column: Controls Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                                <button
                                    onClick={() => setActiveTab('crop')}
                                    style={{ flex: '1 1 40%', padding: '8px 4px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: activeTab === 'crop' ? 'var(--surface-color)' : 'transparent', color: activeTab === 'crop' ? 'white' : 'var(--text-secondary)' }}
                                ><CropIcon size={16} /> Crop</button>
                                <button
                                    onClick={() => setActiveTab('draw')}
                                    style={{ flex: '1 1 40%', padding: '8px 4px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: activeTab === 'draw' ? 'var(--surface-color)' : 'transparent', color: activeTab === 'draw' ? 'white' : 'var(--text-secondary)' }}
                                ><PenTool size={16} /> Draw</button>
                                <button
                                    onClick={() => setActiveTab('adjust')}
                                    style={{ flex: '1 1 40%', padding: '8px 4px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: activeTab === 'adjust' ? 'var(--surface-color)' : 'transparent', color: activeTab === 'adjust' ? 'white' : 'var(--text-secondary)' }}
                                ><SlidersHorizontal size={16} /> Adjust</button>
                                <button
                                    onClick={() => setActiveTab('transform')}
                                    style={{ flex: '1 1 40%', padding: '8px 4px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: activeTab === 'transform' ? 'var(--surface-color)' : 'transparent', color: activeTab === 'transform' ? 'white' : 'var(--text-secondary)' }}
                                ><RotateCw size={16} /> Transf.</button>
                            </div>

                            {activeTab === 'crop' && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select a ratio or drag freely to crop.</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button onClick={() => setAspect(undefined)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1, background: !aspect ? 'var(--surface-hover)' : 'transparent' }}>Free</button>
                                        <button onClick={() => setAspect(1)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1, background: aspect === 1 ? 'var(--surface-hover)' : 'transparent' }}>1:1</button>
                                        <button onClick={() => setAspect(16 / 9)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1, background: aspect === 16 / 9 ? 'var(--surface-hover)' : 'transparent' }}>16:9</button>
                                        <button onClick={() => setAspect(4 / 3)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1, background: aspect === 4 / 3 ? 'var(--surface-hover)' : 'transparent' }}>4:3</button>
                                        <button onClick={() => setAspect(3 / 2)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1, background: aspect === 3 / 2 ? 'var(--surface-hover)' : 'transparent' }}>3:2</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                                        <button onClick={applyCrop} disabled={!completedCrop?.width} className="btn-primary" style={{ padding: '12px', justifyContent: 'center', opacity: !completedCrop?.width ? 0.5 : 1 }}>
                                            <Check size={18} /> Apply
                                        </button>
                                        <button onClick={cancelCrop} className="btn-secondary" style={{ padding: '12px', justifyContent: 'center' }}>
                                            <X size={18} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'draw' && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Draw freely directly on your image.</p>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px' }}>Brush Color</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }} />
                                            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                                                {['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'].map(c => (
                                                    <button key={c} onClick={() => setDrawColor(c)} style={{ flex: 1, height: '40px', borderRadius: '4px', background: c, border: drawColor === c ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', cursor: 'pointer' }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <span>Brush Size</span><span>{drawSize}px</span>
                                        </div>
                                        <input type="range" min="1" max="50" value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                    <button onClick={clearDrawing} disabled={lines.length === 0} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                        Clear Drawing
                                    </button>
                                </div>
                            )}

                            {activeTab === 'adjust' && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <span>Brightness</span><span>{brightness}%</span>
                                        </div>
                                        <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <span>Contrast</span><span>{contrast}%</span>
                                        </div>
                                        <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <span>Saturation</span><span>{saturation}%</span>
                                        </div>
                                        <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <span>Grayscale</span><span>{grayscale}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={grayscale} onChange={e => setGrayscale(Number(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transform' && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Note: Transformations apply to the base image and will reset recent crops and drawings if not applied.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <button onClick={() => { setRotation(r => r - 90); cancelCrop(); clearDrawing(); }} className="btn-secondary" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <RotateCw size={20} style={{ transform: 'scaleX(-1)' }} /> Rotate Left
                                        </button>
                                        <button onClick={() => { setRotation(r => r + 90); cancelCrop(); clearDrawing(); }} className="btn-secondary" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <RotateCw size={20} /> Rotate Right
                                        </button>
                                        <button onClick={() => { setFlipH(!flipH); cancelCrop(); clearDrawing(); }} className="btn-secondary" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: flipH ? 'rgba(59,130,246,0.2)' : '' }}>
                                            <FlipHorizontal size={20} /> Flip Horizontal
                                        </button>
                                        <button onClick={() => { setFlipV(!flipV); cancelCrop(); clearDrawing(); }} className="btn-secondary" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: flipV ? 'rgba(59,130,246,0.2)' : '' }}>
                                            <FlipVertical size={20} /> Flip Vertical
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ flex: 1 }} />

                            <button onClick={downloadImage} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <Download size={20} /> Download Result
                            </button>
                            <button onClick={() => { setFile(null); resetDestructiveState(); }} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Start Over
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-react-crop .ReactCrop__crop-selection,
                .hide-react-crop .ReactCrop__drag-elements,
                .hide-react-crop .ReactCrop__drag-handle {
                    display: none !important;
                }
                .hide-react-crop {
                    pointer-events: none !important;
                }
                .hide-react-crop canvas {
                    pointer-events: auto !important;
                }
            `}} />
        </ToolLayout>
    );
}
