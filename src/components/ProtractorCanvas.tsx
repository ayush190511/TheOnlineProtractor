import React, { useEffect, useRef, useState } from 'react';
import type { Point, AppToolMode } from '../utils/types';
import { UploadCloud, Camera, RefreshCw, ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';

interface ProtractorCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  toolMode: AppToolMode;
  showGrid: boolean;
  onImageLoaded?: (img: HTMLImageElement) => void;
  isCameraActive: boolean;
  onCameraError?: (error: string) => void;
}

export const ProtractorCanvas: React.FC<ProtractorCanvasProps> = ({
  canvasRef,
  toolMode,
  showGrid,
  onImageLoaded,
  isCameraActive,
  onCameraError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Handle global paste event (Ctrl+V / Cmd+V anywhere on page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            loadImageFromFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // WebCam Stream handler
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isCameraActive && videoRef.current) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error('Camera access failed:', err);
          onCameraError?.('Unable to access webcam. Please check browser permissions.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive]);

  // Load image helper
  const loadImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        setZoomLevel(1.0);
        setPanOffset({ x: 0, y: 0 });
        onImageLoaded?.(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        loadImageFromFile(file);
      }
    }
  };

  // High-DPI canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Resize backing store for crisp Retina rendering
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // 1. Draw Background Grid
      if (showGrid) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Major & Minor grid lines
        const gridSize = 20;
        ctx.lineWidth = 0.5;

        // Minor grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.beginPath();
        for (let x = 0; x <= displayWidth; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, displayHeight);
        }
        for (let y = 0; y <= displayHeight; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(displayWidth, y);
        }
        ctx.stroke();

        // Major grid every 100px
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= displayWidth; x += gridSize * 5) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, displayHeight);
        }
        for (let y = 0; y <= displayHeight; y += gridSize * 5) {
          ctx.moveTo(0, y);
          ctx.lineTo(displayWidth, y);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }

      // 2. Draw Camera Video Stream if active
      if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.drawImage(videoRef.current, 0, 0, displayWidth, displayHeight);
        ctx.restore();
      }

      // 3. Draw Loaded User Image with Pan & Zoom
      if (loadedImage) {
        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);

        // Center image on canvas
        const imgAspect = loadedImage.width / loadedImage.height;
        const canvasAspect = displayWidth / displayHeight;
        let drawWidth = displayWidth;
        let drawHeight = displayHeight;

        if (imgAspect > canvasAspect) {
          drawWidth = displayWidth;
          drawHeight = displayWidth / imgAspect;
        } else {
          drawHeight = displayHeight;
          drawWidth = displayHeight * imgAspect;
        }

        const dx = (displayWidth - drawWidth) / 2;
        const dy = (displayHeight - drawHeight) / 2;

        ctx.drawImage(loadedImage, dx, dy, drawWidth, drawHeight);
        ctx.restore();
      }

      ctx.restore();

      if (isCameraActive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [showGrid, loadedImage, isCameraActive, zoomLevel, panOffset]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[520px] sm:h-[600px] border border-neutral-200/80 rounded-2xl overflow-hidden shadow-inner bg-white select-none transition-all ${
        isDragOver ? 'ring-4 ring-blue-400 bg-blue-50/20' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden Video element for webcam streaming */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Layer 1: HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none cursor-default"
      />

      {/* Image Dropzone Overlay if in Image Mode and No Image Loaded */}
      {toolMode === 'image' && !loadedImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/85 backdrop-blur-xs text-center z-10 pointer-events-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-sm animate-bounce-subtle">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-1">
            Measure Angle from Any Image or Photo
          </h3>
          <p className="text-sm text-neutral-500 max-w-md mb-5">
            Drag & drop a geometry homework sheet, screenshot, or blueprint here, or paste directly with <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono font-bold text-neutral-700">Ctrl + V</kbd>
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold cursor-pointer shadow-md transition-all">
            <UploadCloud className="w-4 h-4" />
            <span>Choose Image File</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  loadImageFromFile(e.target.files[0]);
                }
              }}
            />
          </label>
          <span className="text-[11px] text-neutral-400 mt-3">
            🔒 100% Private — Processed strictly on your device, never uploaded to any server.
          </span>
        </div>
      )}

      {/* Floating Canvas Controls (When Image is Loaded) */}
      {loadedImage && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-neutral-200/80 rounded-lg p-1 shadow-sm z-30">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.2))}
            title="Zoom In"
            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.2))}
            title="Zoom Out"
            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1.0);
              setPanOffset({ x: 0, y: 0 });
            }}
            title="Reset Zoom & Pan"
            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setLoadedImage(null)}
            title="Remove Image"
            className="p-1.5 hover:bg-red-50 text-red-600 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
