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

    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    const pos = getCanvasCoordinates(e);
    setActiveHandle(handle);
    setDragStartPoint(pos);
    setInitialVertexAtDrag({ ...state.vertex });
    setInitialArmAAtDrag({ ...state.armA });
    setInitialArmBAtDrag({ ...state.armB });
    setInitialCenterAtDrag({ ...state.protractorCenter });
    setInitialRotationAtDrag(state.protractorRotation);
  };

  // Pointer Move on SVG Canvas
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle) return;
    e.preventDefault();

    const currentPos = getCanvasCoordinates(e);
    const dx = currentPos.x - dragStartPoint.x;
    const dy = currentPos.y - dragStartPoint.y;

    if (activeHandle === 'vertex') {
      const newV = { x: initialVertexAtDrag.x + dx, y: initialVertexAtDrag.y + dy };
      const newA = { x: initialArmAAtDrag.x + dx, y: initialArmAAtDrag.y + dy };
      const newB = { x: initialArmBAtDrag.x + dx, y: initialArmBAtDrag.y + dy };
      const newCenter = { x: initialCenterAtDrag.x + dx, y: initialCenterAtDrag.y + dy };

      setState((prev) => ({
        ...prev,
        vertex: newV,
        armA: newA,
        armB: newB,
        protractorCenter: newCenter,
      }));
    } else if (activeHandle === 'armA') {
      let finalA = { x: currentPos.x, y: currentPos.y };

      if (snapEnabled) {
        const rawAngle = calculateAngle(state.vertex, finalA, state.armB);
        const snapped = checkAngleSnap(rawAngle, 2.0);
        if (snapped.snapped) {
          const armLen = Math.hypot(finalA.x - state.vertex.x, finalA.y - state.vertex.y);
          const angleB = getVectorAngle(state.vertex, state.armB);
          finalA = setArmAngle(state.vertex, angleB + snapped.angle, armLen);
        }
      }

      setState((prev) => ({
        ...prev,
        armA: finalA,
      }));
    } else if (activeHandle === 'armB') {
      let finalB = { x: currentPos.x, y: currentPos.y };

      if (snapEnabled) {
        const rawAngle = calculateAngle(state.vertex, state.armA, finalB);
        const snapped = checkAngleSnap(rawAngle, 2.0);
        if (snapped.snapped) {
          const armLen = Math.hypot(finalB.x - state.vertex.x, finalB.y - state.vertex.y);
          const angleA = getVectorAngle(state.vertex, state.armA);
          finalB = setArmAngle(state.vertex, angleA - snapped.angle, armLen);
        }
      }

      setState((prev) => ({
        ...prev,
        armB: finalB,
      }));
    } else if (activeHandle === 'protractorCenter') {
      setState((prev) => ({
        ...prev,
        protractorCenter: { x: initialCenterAtDrag.x + dx, y: initialCenterAtDrag.y + dy },
      }));
    } else if (activeHandle === 'protractorRotate') {
      const angleRad = Math.atan2(currentPos.y - state.protractorCenter.y, currentPos.x - state.protractorCenter.x);
      const angleDeg = (angleRad * 180) / Math.PI;
      setState((prev) => ({
        ...prev,
        protractorRotation: angleDeg,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setActiveHandle(null);
    }
  };

  const handleNudgeAngle = (deltaDegrees: number) => {
    const angleA = getVectorAngle(state.vertex, state.armA);
    const armLenB = Math.hypot(state.armB.x - state.vertex.x, state.armB.y - state.vertex.y);
    const newAngle = normalizeAngle(currentAngle + deltaDegrees);
    const newB = setArmAngle(state.vertex, angleA - newAngle, armLenB);

    setState((prev) => ({
      ...prev,
      armB: newB,
    }));
  };

  const handleResetPins = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = Math.floor(rect.width / 2);
      const cy = Math.floor(rect.height / 2 + 30);
      const r = Math.min(180, Math.floor(rect.width * 0.38));
      const armLength = r * 0.9;
      const deg45Rad = (-45 * Math.PI) / 180;

      setState({
        vertex: { x: cx, y: cy },
        armA: { x: cx + armLength, y: cy },
        armB: { x: cx + armLength * Math.cos(deg45Rad), y: cy + armLength * Math.sin(deg45Rad) },
        protractorCenter: { x: cx, y: cy },
        protractorRadius: r,
        protractorRotation: 0,
        mode: protractorMode,
        opacity: opacity,
        snapToCommonAngles: snapEnabled,
        showGrid: showGrid,
        showMagnifier: showMagnifier,
        showDegreesOnArc: true,
        displayAngleType: 'interior',
        scale: 1,
        pan: { x: 0, y: 0 },
      });
    }
  };

  const handleFlipProtractor = () => {
    setState((prev) => ({
      ...prev,
      protractorRotation: (prev.protractorRotation + 180) % 360,
    }));
  };

  const handleExportImage = () => {
    exportProtractorImage(canvasRef.current, svgRef.current, angleInfo);
  };

  let magnifierTargetPoint: Point | null = null;
  let magnifierHandleName = '';
  let magnifierHandleColor = '#f97316';

  if (showMagnifier && activeHandle) {
    if (activeHandle === 'vertex') {
      magnifierTargetPoint = state.vertex;
      magnifierHandleName = 'Vertex (V)';
      magnifierHandleColor = '#f97316';
    } else if (activeHandle === 'armA') {
      magnifierTargetPoint = state.armA;
      magnifierHandleName = 'Baseline Arm (A)';
      magnifierHandleColor = '#3b82f6';
    } else if (activeHandle === 'armB') {
      magnifierTargetPoint = state.armB;
      magnifierHandleName = 'Angle Ray (B)';
      magnifierHandleColor = '#10b981';
    }
  }

  return (
    <div className="w-full flex flex-col gap-3 font-sans">
      {/* 1. Real-time Angle Readout & Badge */}
      <AngleReadout
        angleInfo={angleInfo}
        displayAngleType={displayAngleType}
        onAngleTypeChange={setDisplayAngleType}
        snapEnabled={snapEnabled}
      />

      {/* 2. Interactive Protractor Viewport (Stacked Layers 1, 2, 3) */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#141414] transition-colors"
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
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-xs border border-neutral-200/80 dark:border-neutral-700 px-3 py-1 rounded-full text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 shadow-xs pointer-events-none flex items-center gap-1.5 hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Drag Orange <strong className="text-orange-600 dark:text-orange-400">V</strong>, Blue <strong className="text-blue-600 dark:text-sky-400">A</strong>, or Green <strong className="text-emerald-600 dark:text-emerald-400">B</strong></span>
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
