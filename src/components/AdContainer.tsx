import React from 'react';

interface AdContainerProps {
  slot: 'top-leaderboard' | 'sidebar' | 'bottom-leaderboard';
  className?: string;
}

export const AdContainer: React.FC<AdContainerProps> = ({ slot, className = '' }) => {
  let minHeight = 'min-h-[90px]';
  let maxWidth = 'max-w-[728px]';
  let slotLabel = 'Leaderboard Ad Space (728x90)';

  if (slot === 'sidebar') {
    minHeight = 'min-h-[280px]';
    maxWidth = 'max-w-[300px]';
    slotLabel = 'Sidebar Ad Space (300x250)';
  } else if (slot === 'bottom-leaderboard') {
    minHeight = 'min-h-[90px]';
    maxWidth = 'max-w-[728px]';
    slotLabel = 'Bottom Ad Space (728x90)';
  }

  return (
    <div
      className={`w-full flex flex-col items-center justify-center my-4 overflow-hidden no-print ${className}`}
      aria-label="Advertisement Container"
    >
      <div
        className={`w-full ${maxWidth} ${minHeight} bg-[#fdfcfb] border border-neutral-200/60 rounded-lg flex flex-col items-center justify-center text-center p-3 transition-colors select-none`}
      >
        <span className="text-[10px] tracking-wider uppercase text-neutral-400 font-semibold mb-1">
          Advertisement
        </span>
        <div className="w-full flex-1 border border-dashed border-neutral-200 rounded flex items-center justify-center bg-white/60">
          <p className="text-xs text-neutral-400 font-mono">
            {slotLabel}
          </p>
        </div>
      </div>
    </div>
  );
};
