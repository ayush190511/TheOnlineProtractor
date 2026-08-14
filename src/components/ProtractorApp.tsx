import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  Point,
  HandleType,
  ProtractorMode,
  AppToolMode,
  ProtractorState,
} from '../utils/types';
import {
  calculateAngle,
  classifyAngle,
  checkAngleSnap,
  setArmAngle,
  rotatePoint,
  getVectorAngle,
  normalizeAngle,
} from '../utils/geometry';
import { exportProtractorImage } from '../utils/canvasExport';
import { ProtractorCanvas } from './ProtractorCanvas';
import { ProtractorDialSvg } from './ProtractorDialSvg';
import { MagnifierLoupe } from './MagnifierLoupe';
import { AngleReadout } from './AngleReadout';
import { Toolbar } from './Toolbar';

interface ProtractorAppProps {
  initialToolMode?: AppToolMode;
  initialProtractorMode?: ProtractorMode;
}

export const ProtractorApp: React.FC<ProtractorAppProps> = ({
  initialToolMode = 'standard',
  initialProtractorMode = '180',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Core Modes
  const [toolMode, setToolMode] = useState<AppToolMode>(initialToolMode);
  const [protractorMode, setProtractorMode] = useState<ProtractorMode>(initialProtractorMode);
  const [opacity, setOpacity] = useState<number>(0.85);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showMagnifier, setShowMagnifier] = useState<boolean>(true);
  const [displayAngleType, setDisplayAngleType] = useState<'interior' | 'supplementary' | 'reflex'>('interior');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Coordinates State
  // Initial default layout centered around (350, 320)
  const [state, setState] = useState<ProtractorState>({
    vertex: { x: 340, y: 320 },
    armA: { x: 500, y: 320 },
    armB: { x: 453, y: 207 }, // default 45° angle
    protractorCenter: { x: 340, y: 320 },
    protractorRadius: 180,
    protractorRotation: 0,
    mode: initialProtractorMode,
    opacity: 0.85,
    snapToCommonAngles: true,
    showGrid: true,
    showMagnifier: true,
    showDegreesOnArc: true,
    displayAngleType: 'interior',
    scale: 1,
    pan: { x: 0, y: 0 },
  });

  // Active dragging handle & Pointer capture tracking
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [initialVertexAtDrag, setInitialVertexAtDrag] = useState<Point>({ x: 0, y: 0 });
  const [initialArmAAtDrag, setInitialArmAAtDrag] = useState<Point>({ x: 0, y: 0 });
  const [initialArmBAtDrag, setInitialArmBAtDrag] = useState<Point>({ x: 0, y: 0 });
  const [initialCenterAtDrag, setInitialCenterAtDrag] = useState<Point>({ x: 0, y: 0 });
  const [initialRotationAtDrag, setInitialRotationAtDrag] = useState<number>(0);

  // Dynamic Angle Calculation
  const currentAngle = calculateAngle(state.vertex, state.armA, state.armB);
  const angleInfo = classifyAngle(currentAngle);

  // Adjust center position on initial container mount / resize
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = Math.max(160, Math.floor(rect.width / 2));
      const cy = Math.max(200, Math.floor(rect.height / 2 + 30));

      const r = Math.min(180, Math.floor(rect.width * 0.38));
      const armLength = r * 0.9;
      const deg45Rad = (-45 * Math.PI) / 180;

      setState((prev) => ({
        ...prev,
        vertex: { x: cx, y: cy },
        armA: { x: cx + armLength, y: cy },
        armB: { x: cx + armLength * Math.cos(deg45Rad), y: cy + armLength * Math.sin(deg45Rad) },
        protractorCenter: { x: cx, y: cy },
        protractorRadius: r,
      }));
    }
  }, []);

  // Helper to convert screen pointer clientX/clientY to SVG/Canvas coordinates
  const getCanvasCoordinates = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    if (!svgRef.current) return { x: e.clientX, y: e.clientY };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Pointer Down on a Handle Pin
  const handlePointerDownHandle = (e: React.PointerEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();

    // Set pointer capture on target element so dragging remains smooth even if pointer leaves handle
    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    const pt = getCanvasCoordinates(e);
    setActiveHandle(handle);
    setDragStartPoint(pt);
    setInitialVertexAtDrag({ ...state.vertex });
    setInitialArmAAtDrag({ ...state.armA });
    setInitialArmBAtDrag({ ...state.armB });
    setInitialCenterAtDrag({ ...state.protractorCenter });
    setInitialRotationAtDrag(state.protractorRotation);
  };

  // Pointer Move on SVG Viewport
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeHandle) return;
    const pt = getCanvasCoordinates(e);

    if (activeHandle === 'vertex') {
      // Move Vertex and translate Arm A, Arm B and Protractor Center together
      const dx = pt.x - dragStartPoint.x;
      const dy = pt.y - dragStartPoint.y;

      setState((prev) => ({
        ...prev,
        vertex: { x: initialVertexAtDrag.x + dx, y: initialVertexAtDrag.y + dy },
        armA: { x: initialArmAAtDrag.x + dx, y: initialArmAAtDrag.y + dy },
        armB: { x: initialArmBAtDrag.x + dx, y: initialArmBAtDrag.y + dy },
        protractorCenter: { x: initialCenterAtDrag.x + dx, y: initialCenterAtDrag.y + dy },
      }));
    } else if (activeHandle === 'armA') {
      // Drag Arm A
      setState((prev) => ({
        ...prev,
        armA: { x: pt.x, y: pt.y },
      }));
    } else if (activeHandle === 'armB') {
      // Drag Arm B with Angle Snapping
      let targetPt = { x: pt.x, y: pt.y };

      if (snapEnabled) {
        const rawAngle = calculateAngle(state.vertex, state.armA, targetPt);
        const { snapped, angle: snapAngle } = checkAngleSnap(rawAngle, 2.5);
        if (snapped) {
          targetPt = setArmAngle(state.vertex, state.armA, targetPt, snapAngle);
        }
      }

      setState((prev) => ({
        ...prev,
        armB: targetPt,
      }));
    } else if (activeHandle === 'protractorCenter') {
      // Move protractor dial body independently
      const dx = pt.x - dragStartPoint.x;
      const dy = pt.y - dragStartPoint.y;

      setState((prev) => ({
        ...prev,
        protractorCenter: { x: initialCenterAtDrag.x + dx, y: initialCenterAtDrag.y + dy },
      }));
    } else if (activeHandle === 'protractorRotate') {
      // Rotate protractor dial
      const currentAngleFromCenter = getVectorAngle(state.protractorCenter, pt);
      const startAngleFromCenter = getVectorAngle(state.protractorCenter, dragStartPoint);
      const deltaAngle = currentAngleFromCenter - startAngleFromCenter;

      setState((prev) => ({
        ...prev,
        protractorRotation: normalizeAngle(initialRotationAtDrag + deltaAngle),
      }));
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeHandle) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch if element was uncaptured
      }
      setActiveHandle(null);
    }
  };

  // Fine-Tune Nudge Angle Button
  const handleNudgeAngle = (delta: number) => {
    const newAngle = normalizeAngle(currentAngle + delta);
    const newArmB = setArmAngle(state.vertex, state.armA, state.armB, newAngle);
    setState((prev) => ({ ...prev, armB: newArmB }));
  };

  // Reset Handles to Default 45°
  const handleResetPins = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = Math.floor(rect.width / 2);
    const cy = Math.floor(rect.height / 2 + 30);
    const r = state.protractorRadius;
    const armLen = r * 0.9;
    const rad45 = (-45 * Math.PI) / 180;

    setState((prev) => ({
      ...prev,
      vertex: { x: cx, y: cy },
      armA: { x: cx + armLen, y: cy },
      armB: { x: cx + armLen * Math.cos(rad45), y: cy + armLen * Math.sin(rad45) },
      protractorCenter: { x: cx, y: cy },
      protractorRotation: 0,
    }));
  };

  // Flip Protractor Baseline
  const handleFlipProtractor = () => {
    setState((prev) => ({
      ...prev,
      protractorRotation: normalizeAngle(prev.protractorRotation + 180),
    }));
  };

  // Export Composite High-Res Image
  const handleExportImage = () => {
    exportProtractorImage(canvasRef.current, svgRef.current, angleInfo);
  };

  // Point tracked by Magnifier Loupe (if active)
  const magnifierTargetPoint = (() => {
    if (!showMagnifier || !activeHandle) return null;
    if (activeHandle === 'vertex') return state.vertex;
    if (activeHandle === 'armA') return state.armA;
    if (activeHandle === 'armB') return state.armB;
    return null;
  })();

  const magnifierHandleColor = (() => {
    if (activeHandle === 'vertex') return '#f97316';
    if (activeHandle === 'armA') return '#3b82f6';
    if (activeHandle === 'armB') return '#10b981';
    return '#0075de';
  })();

  const magnifierHandleName = (() => {
    if (activeHandle === 'vertex') return 'Vertex (V)';
    if (activeHandle === 'armA') return 'Arm A (Ray)';
    if (activeHandle === 'armB') return 'Arm B (Ray)';
    return 'Handle';
  })();

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* 1. Angle Readout Header Card */}
      <AngleReadout
        angleInfo={angleInfo}
        displayAngleType={displayAngleType}
        onAngleTypeChange={setDisplayAngleType}
        snapEnabled={snapEnabled}
      />

      {/* 2. Interactive Protractor Viewport (Stacked Layers 1, 2, 3) */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-white"
        style={{ touchAction: 'none' }}
      >
        {/* Layer 1: Bottom Canvas (Hardware-accelerated Image/Grid/Webcam) */}
        <ProtractorCanvas
          canvasRef={canvasRef}
          toolMode={toolMode}
          showGrid={showGrid}
          isCameraActive={isCameraActive}
        />

        {/* Layer 2: Interactive SVG Protractor Overlay */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-auto select-none touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <ProtractorDialSvg
            mode={protractorMode}
            radius={state.protractorRadius}
            center={state.protractorCenter}
            rotation={state.protractorRotation}
            opacity={opacity}
            vertex={state.vertex}
            armA={state.armA}
            armB={state.armB}
            activeHandle={activeHandle}
            onPointerDownHandle={handlePointerDownHandle}
            showDegreesOnArc={true}
            angleValue={currentAngle}
          />
        </svg>

        {/* Layer 3: Magnifier Loupe (2.5x Zoom following active pin) */}
        <MagnifierLoupe
          sourceCanvas={canvasRef.current}
          targetPoint={magnifierTargetPoint}
          zoomLevel={2.5}
          size={110}
          activeHandleName={magnifierHandleName}
          activeHandleColor={magnifierHandleColor}
        />

        {/* Quick Instructions Pill on Top-Right */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs border border-neutral-200/80 px-3 py-1 rounded-full text-[11px] font-semibold text-neutral-600 shadow-xs pointer-events-none flex items-center gap-1.5 hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Drag Orange <strong className="text-orange-600">V</strong>, Blue <strong className="text-blue-600">A</strong>, or Green <strong className="text-emerald-600">B</strong></span>
        </div>
      </div>

      {/* 3. Toolbar & Mode Switcher */}
      <Toolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        protractorMode={protractorMode}
        onProtractorModeChange={setProtractorMode}
        opacity={opacity}
        onOpacityChange={setOpacity}
        snapEnabled={snapEnabled}
        onSnapToggle={() => setSnapEnabled(!snapEnabled)}
        showGrid={showGrid}
        onGridToggle={() => setShowGrid(!showGrid)}
        showMagnifier={showMagnifier}
        onMagnifierToggle={() => setShowMagnifier(!showMagnifier)}
        onNudgeAngle={handleNudgeAngle}
        onResetPins={handleResetPins}
        onFlipProtractor={handleFlipProtractor}
        onExportImage={handleExportImage}
        isCameraActive={isCameraActive}
        onToggleCamera={() => setIsCameraActive(!isCameraActive)}
      />
    </div>
  );
};
