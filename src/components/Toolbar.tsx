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
    <div className="w-full bg-[#fcfbf9] dark:bg-[#181818] border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3 shadow-xs select-none flex flex-col gap-3">
      {/* Top Row: Primary Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-[#202020] p-1 rounded-lg border border-neutral-200/70 dark:border-neutral-700 shadow-xs flex-wrap">
          <button
            type="button"
            onClick={() => onToolModeChange('standard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              toolMode === 'standard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Standard</span>
          </button>

          <button
            type="button"
            onClick={() => onToolModeChange('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              toolMode === 'image'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              toolMode === 'camera'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
        </div>

        {/* 180° vs 360° Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#202020] p-1 rounded-lg border border-neutral-200/70 dark:border-neutral-700 shadow-xs">
          <button
            type="button"
            onClick={() => onProtractorModeChange('180')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              protractorMode === '180'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            180° Half
          </button>
          <button
            type="button"
            onClick={() => onProtractorModeChange('360')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              protractorMode === '360'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            360° Full
          </button>
        </div>
      </div>

      {/* Second Row: Precision Controls & Toggles */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800 text-xs">
        {/* Left Side: Snapping, Grid, Loupe, Opacity */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Snap Button */}
          <button
            type="button"
            onClick={onSnapToggle}
            title="Snap to common angles (30°, 45°, 90°, etc.)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              snapEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-bold'
                : 'bg-white dark:bg-[#202020] border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Snap Angles</span>
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={onGridToggle}
            title="Toggle background grid"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showGrid
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-sky-300 font-bold'
                : 'bg-white dark:bg-[#202020] border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          {/* Loupe Toggle */}
          <button
            type="button"
            onClick={onMagnifierToggle}
            title="Toggle 2.5x magnifying loupe while dragging"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showMagnifier
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-300 font-bold'
                : 'bg-white dark:bg-[#202020] border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>2.5x Loupe</span>
          </button>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#202020] px-3 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
            <Eye className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[11px] font-medium">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[11px] font-mono w-7 text-right">{Math.round(opacity * 100)}%</span>
          </div>
        </div>

        {/* Right Side: Angle Nudges & Export */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nudge Buttons */}
          <div className="flex items-center bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onNudgeAngle(-1.0)}
              title="Nudge angle -1.0°"
              className="px-2 py-1 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              -1°
            </button>
            <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-700"></span>
            <button
              type="button"
              onClick={() => onNudgeAngle(-0.1)}
              title="Nudge angle -0.1°"
              className="px-2 py-1 text-[11px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              -0.1°
            </button>
            <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-700"></span>
            <button
              type="button"
              onClick={() => onNudgeAngle(0.1)}
              title="Nudge angle +0.1°"
              className="px-2 py-1 text-[11px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              +0.1°
            </button>
            <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-700"></span>
            <button
              type="button"
              onClick={() => onNudgeAngle(1.0)}
              title="Nudge angle +1.0°"
              className="px-2 py-1 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              +1°
            </button>
          </div>

          {/* Flip Protractor */}
          <button
            type="button"
            onClick={onFlipProtractor}
            title="Flip Protractor Orientation"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onResetPins}
            title="Reset Protractor and Pins to Default"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={onExportImage}
            title="Save annotated high-resolution PNG image"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
