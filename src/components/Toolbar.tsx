import React from 'react';
import type { AppToolMode, ProtractorMode } from '../utils/types';
import {
  Compass,
  Image as ImageIcon,
  Camera,
  Printer,
  Sparkles,
  Download,
  RotateCcw,
  Plus,
  Minus,
  Eye,
  Grid,
  Search,
  FlipHorizontal,
  Circle,
} from 'lucide-react';

interface ToolbarProps {
  toolMode: AppToolMode;
  onToolModeChange: (mode: AppToolMode) => void;
  protractorMode: ProtractorMode;
  onProtractorModeChange: (mode: ProtractorMode) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  snapEnabled: boolean;
  onSnapToggle: () => void;
  showGrid: boolean;
  onGridToggle: () => void;
  showMagnifier: boolean;
  onMagnifierToggle: () => void;
  onNudgeAngle: (delta: number) => void;
  onResetPins: () => void;
  onFlipProtractor: () => void;
  onExportImage: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  onToolModeChange,
  protractorMode,
  onProtractorModeChange,
  opacity,
  onOpacityChange,
  snapEnabled,
  onSnapToggle,
  showGrid,
  onGridToggle,
  showMagnifier,
  onMagnifierToggle,
  onNudgeAngle,
  onResetPins,
  onFlipProtractor,
  onExportImage,
  isCameraActive,
  onToggleCamera,
}) => {
  return (
    <div className="w-full bg-[#fcfbf9] border border-neutral-200/80 rounded-xl p-3 shadow-xs select-none flex flex-col gap-3">
      {/* Top Row: Primary Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200/70 shadow-xs flex-wrap">
          <button
            type="button"
            onClick={() => onToolModeChange('standard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              toolMode === 'standard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Standard</span>
          </button>

          <button
            type="button"
            onClick={() => onToolModeChange('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              toolMode === 'image'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image / Paste</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onToolModeChange('camera');
              if (!isCameraActive) onToggleCamera();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              toolMode === 'camera'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => onToolModeChange('print')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              toolMode === 'print'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Printable</span>
          </button>
        </div>

        {/* 180° vs 360° Dial Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200/70 shadow-xs">
          <button
            type="button"
            onClick={() => onProtractorModeChange('180')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
              protractorMode === '180'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            180° Half
          </button>
          <button
            type="button"
            onClick={() => onProtractorModeChange('360')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
              protractorMode === '360'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            360° Full
          </button>
        </div>
      </div>

      {/* Middle Row: Fine-Tune Nudge Buttons & Angle Snapping */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-200/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-neutral-500 mr-1">Nudge:</span>
          <button
            type="button"
            onClick={() => onNudgeAngle(-1)}
            title="Decrease by 1 degree"
            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-md text-xs font-semibold text-neutral-800 shadow-2xs transition-colors"
          >
            -1.0°
          </button>
          <button
            type="button"
            onClick={() => onNudgeAngle(-0.1)}
            title="Decrease by 0.1 degree"
            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-md text-xs font-semibold text-neutral-800 shadow-2xs transition-colors"
          >
            -0.1°
          </button>
          <button
            type="button"
            onClick={() => onNudgeAngle(0.1)}
            title="Increase by 0.1 degree"
            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-md text-xs font-semibold text-neutral-800 shadow-2xs transition-colors"
          >
            +0.1°
          </button>
          <button
            type="button"
            onClick={() => onNudgeAngle(1)}
            title="Increase by 1 degree"
            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-md text-xs font-semibold text-neutral-800 shadow-2xs transition-colors"
          >
            +1.0°
          </button>

          {/* Snap Angle Button */}
          <button
            type="button"
            onClick={onSnapToggle}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
              snapEnabled
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-neutral-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Snap Angles (45°, 90°)</span>
          </button>
        </div>

        {/* Action buttons: Reset, Flip, Export */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onFlipProtractor}
            title="Flip Protractor Baseline"
            className="p-1.5 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-md text-neutral-700 shadow-2xs transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onResetPins}
            title="Reset Handle Pins to 45°"
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-md text-xs font-medium text-neutral-700 shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onExportImage}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Image (PNG)</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Sliders & View Toggles */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-neutral-200/50 text-xs text-neutral-600">
        {/* Opacity Slider */}
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold">Protractor Opacity:</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-24 accent-blue-600 cursor-pointer"
          />
          <span className="font-mono text-[11px] text-neutral-500 w-8">
            {Math.round(opacity * 100)}%
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGridToggle}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
              showGrid
                ? 'bg-neutral-200 text-neutral-900 border-neutral-300'
                : 'bg-white text-neutral-500 border-neutral-200/60'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={onMagnifierToggle}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
              showMagnifier
                ? 'bg-neutral-200 text-neutral-900 border-neutral-300'
                : 'bg-white text-neutral-500 border-neutral-200/60'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Loupe (2.5x)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
