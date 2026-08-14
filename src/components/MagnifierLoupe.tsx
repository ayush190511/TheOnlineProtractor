import React, { useEffect, useRef } from 'react';
import type { Point } from '../utils/types';

interface MagnifierLoupeProps {
  sourceCanvas: HTMLCanvasElement | null;
  targetPoint: Point | null; // Point in canvas coordinates being dragged
  zoomLevel?: number; // Default 2.5
  size?: number; // Default 110px
  activeHandleName?: string;
  activeHandleColor?: string;
}

export const MagnifierLoupe: React.FC<MagnifierLoupeProps> = ({
  sourceCanvas,
  targetPoint,
  zoomLevel = 2.5,
  size = 110,
  activeHandleName = 'Vertex',
  activeHandleColor = '#f97316',
}) => {
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!targetPoint || !sourceCanvas || !loupeCanvasRef.current) return;

    const loupeCanvas = loupeCanvasRef.current;
    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    loupeCanvas.width = size * dpr;
    loupeCanvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Source coordinates on the underlying canvas
    const sampleWidth = size / zoomLevel;
    const sampleHeight = size / zoomLevel;
    const sx = targetPoint.x - sampleWidth / 2;
    const sy = targetPoint.y - sampleHeight / 2;

    // Draw magnified image from source canvas
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      sourceCanvas,
      sx, sy, sampleWidth, sampleHeight,
      0, 0, size, size
    );

    // Subtle grid overlay inside loupe
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 10 * zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Crosshairs
    const center = size / 2;
    ctx.strokeStyle = activeHandleColor;
    ctx.lineWidth = 1.5;

    // Outer reticle circle
    ctx.beginPath();
    ctx.arc(center, center, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Center crosshair lines with gap
    ctx.beginPath();
    // Top
    ctx.moveTo(center, 0);
    ctx.lineTo(center, center - 6);
    // Bottom
    ctx.moveTo(center, center + 6);
    ctx.lineTo(center, size);
    // Left
    ctx.moveTo(0, center);
    ctx.lineTo(center - 6, center);
    // Right
    ctx.moveTo(center + 6, center);
    ctx.lineTo(size, center);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = activeHandleColor;
    ctx.beginPath();
    ctx.arc(center, center, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw lens border
    ctx.save();
    ctx.strokeStyle = '#31302e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Lens glare reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
    ctx.restore();

  }, [sourceCanvas, targetPoint, zoomLevel, size, activeHandleColor]);

  if (!targetPoint) return null;

  // Offset loupe above the cursor/finger so touch input doesn't block visibility
  const offsetX = targetPoint.x;
  const offsetY = Math.max(10, targetPoint.y - size - 25);

  return (
    <div
      className="absolute pointer-events-none z-50 transform -translate-x-1/2 transition-all duration-75 ease-out select-none shadow-2xl rounded-full"
      style={{
        left: `${offsetX}px`,
        top: `${offsetY}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <canvas
        ref={loupeCanvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="rounded-full shadow-lg"
      />
      <div 
        className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1 uppercase tracking-wider"
        style={{ backgroundColor: activeHandleColor }}
      >
        <span>{activeHandleName}</span>
        <span className="opacity-75">{zoomLevel}x</span>
      </div>
    </div>
  );
};
