import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { AngleInfo } from '../utils/types';
import { Sparkles, Info, HelpCircle } from 'lucide-react';

interface AngleReadoutProps {
  angleInfo: AngleInfo;
  displayAngleType: 'interior' | 'supplementary' | 'reflex';
  onAngleTypeChange: (type: 'interior' | 'supplementary' | 'reflex') => void;
  snapEnabled: boolean;
}

export const AngleReadout: React.FC<AngleReadoutProps> = ({
  angleInfo,
  displayAngleType,
  onAngleTypeChange,
  snapEnabled,
}) => {
  const prevDegreesRef = useRef(angleInfo.degrees);

  // Trigger kid-friendly confetti burst when landing on 90°, 180°, or 360°
  useEffect(() => {
    const isSpecialAngle = [90, 180, 270, 360, 45].some(
      (val) => Math.abs(angleInfo.degrees - val) < 0.1
    );
    const wasSpecialAngle = [90, 180, 270, 360, 45].some(
      (val) => Math.abs(prevDegreesRef.current - val) < 0.1
    );

    if (isSpecialAngle && !wasSpecialAngle) {
      confetti({
        particleCount: 28,
        spread: 50,
        origin: { y: 0.3, x: 0.5 },
        colors: ['#0075de', '#f97316', '#10b981', '#f59e0b'],
        disableForReducedMotion: true,
      });
    }
    prevDegreesRef.current = angleInfo.degrees;
  }, [angleInfo.degrees]);

  // Display value based on selected angle type
  let displayValue = angleInfo.degrees;
  let angleLabel = 'Interior Angle';

  if (displayAngleType === 'supplementary') {
    displayValue = angleInfo.supplementary;
    angleLabel = 'Supplementary Angle (180° - θ)';
  } else if (displayAngleType === 'reflex') {
    displayValue = angleInfo.reflex;
    angleLabel = 'Reflex Angle (360° - θ)';
  }

  return (
    <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs select-none">
      {/* Top Bar: Angle Type Selector Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onAngleTypeChange('interior')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              displayAngleType === 'interior'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Angle (θ)
          </button>
          <button
            type="button"
            onClick={() => onAngleTypeChange('supplementary')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              displayAngleType === 'supplementary'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Supplementary (180° - θ)
          </button>
          <button
            type="button"
            onClick={() => onAngleTypeChange('reflex')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              displayAngleType === 'reflex'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Reflex (360° - θ)
          </button>
        </div>

        {/* Snap Indicator */}
        {snapEnabled && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/60">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Snap Active</span>
          </div>
        )}
      </div>

      {/* Main Big Readout and Badge */}
      <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 font-mono">
            {displayValue.toFixed(1)}°
          </span>
          <span className="text-sm font-semibold text-neutral-500 font-sans">
            {angleLabel}
          </span>
        </div>

        {/* Classification Badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all"
          style={{
            backgroundColor: angleInfo.badgeBg,
            borderColor: `${angleInfo.badgeColor}40`,
            color: angleInfo.badgeColor,
          }}
        >
          <span className="text-base">{angleInfo.kidEmoji}</span>
          <span>{angleInfo.name}</span>
        </div>
      </div>

      {/* Kid-friendly fun explanation banner */}
      <div className="bg-[#fcfbf9] border border-amber-200/50 rounded-lg p-2.5 flex items-start gap-2 text-xs text-neutral-700 mt-2">
        <span className="text-base shrink-0 select-none">💡</span>
        <div className="flex-1">
          <span className="font-semibold text-neutral-900">4th Grade Tip: </span>
          <span>{angleInfo.kidExplanation}</span>
        </div>
      </div>

      {/* Secondary Unit Readouts */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-neutral-100 text-center">
        <div className="bg-neutral-50 rounded-md py-1 px-2">
          <span className="block text-[10px] uppercase font-bold text-neutral-600">Radians</span>
          <span className="text-xs font-mono font-bold text-neutral-800">
            {(angleInfo.radians / Math.PI).toFixed(2)}π rad
          </span>
        </div>
        <div className="bg-neutral-50 rounded-md py-1 px-2">
          <span className="block text-[10px] uppercase font-bold text-neutral-600">Gradians</span>
          <span className="text-xs font-mono font-bold text-neutral-800">
            {angleInfo.gradians.toFixed(1)} gon
          </span>
        </div>
        <div className="bg-neutral-50 rounded-md py-1 px-2">
          <span className="block text-[10px] uppercase font-bold text-neutral-600">Complementary</span>
          <span className="text-xs font-mono font-bold text-neutral-800">
            {angleInfo.degrees <= 90 ? `${angleInfo.complementary}°` : 'N/A (>90°)'}
          </span>
        </div>
      </div>
    </div>
  );
};
