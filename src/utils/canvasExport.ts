import type { AngleInfo } from './types';

/**
 * Composites the active canvas, SVG protractor overlay, and angle info into a high-res PNG download
 */
export async function exportProtractorImage(
  canvasEl: HTMLCanvasElement | null,
  svgEl: SVGSVGElement | null,
  angleInfo: AngleInfo,
  filename = 'TheOnlineProtractor-measurement.png'
): Promise<void> {
  if (!canvasEl || !svgEl) return;

  const width = canvasEl.width;
  const height = canvasEl.height;

  // Create an offscreen composite canvas
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw bottom canvas
  ctx.drawImage(canvasEl, 0, 0);

  // 2. Serialize SVG overlay to Image
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(blobURL);
      resolve();
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(blobURL);
      reject(e);
    };
    img.src = blobURL;
  });

  // 3. Draw Watermark & Angle Badge Card at bottom-right
  const padding = 16;
  const badgeWidth = 280;
  const badgeHeight = 68;
  const badgeX = width - badgeWidth - padding;
  const badgeY = height - badgeHeight - padding;

  // Card background
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Inter, -apple-system, sans-serif';
  ctx.fillText(`Angle: ${angleInfo.degrees}°`, badgeX + 16, badgeY + 28);

  ctx.fillStyle = '#0075de';
  ctx.font = 'bold 12px Inter, -apple-system, sans-serif';
  ctx.fillText(`${angleInfo.name}`, badgeX + 16, badgeY + 46);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px Inter, -apple-system, sans-serif';
  ctx.fillText(`Measured with TheOnlineProtractor.com`, badgeX + 16, badgeY + 60);

  // Trigger Download
  const dataURL = exportCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
