import React, { useMemo } from 'react';
import type { Point, ProtractorMode, HandleType } from '../utils/types';
import { degToRad, radToDeg, normalizeAngle, createArcPath } from '../utils/geometry';

interface ProtractorDialSvgProps {
  mode: ProtractorMode;
  radius: number; // e.g. 190
  center: Point; // Protractor dial center (where 0 point is)
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  vertex: Point;
  armA: Point;
  armB: Point;
  activeHandle: HandleType | null;
  onPointerDownHandle: (e: React.PointerEvent, handle: HandleType) => void;
  showDegreesOnArc?: boolean;
  angleValue: number;
}

export const ProtractorDialSvg: React.FC<ProtractorDialSvgProps> = ({
  mode,
  radius,
  center,
  rotation,
  opacity,
  vertex,
  armA,
  armB,
  activeHandle,
  onPointerDownHandle,
  showDegreesOnArc = true,
  angleValue,
}) => {
  const is360 = mode === '360';
  const innerRadius = radius * 0.45;
  const tickOuterRadius = radius;

  // Generate tick marks and numbers for vector dial
  const ticks = useMemo(() => {
    const tickList: React.ReactNode[] = [];
    const maxDegree = is360 ? 360 : 180;
    const step = 1;

    for (let deg = 0; deg <= maxDegree; deg += step) {
      const isTen = deg % 10 === 0;
      const isFive = deg % 5 === 0 && !isTen;
      
      let tickLength = 6;
      let strokeWidth = 0.75;
      let strokeColor = 'rgba(49, 48, 46, 0.45)';

      if (isTen) {
        tickLength = 14;
        strokeWidth = 1.4;
        strokeColor = 'rgba(0, 0, 0, 0.85)';
      } else if (isFive) {
        tickLength = 10;
        strokeWidth = 1;
        strokeColor = 'rgba(49, 48, 46, 0.65)';
      }

      // Angle in radians (0 at right, counter-clockwise)
      // Note: Protractor 0° is conventionally at right (horizontal baseline)
      const rad = degToRad(deg);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Outer edge tick
      const x1 = cos * tickOuterRadius;
      const y1 = -sin * tickOuterRadius; // SVG Y is down, so negate sin for standard math up
      const x2 = cos * (tickOuterRadius - tickLength);
      const y2 = -sin * (tickOuterRadius - tickLength);

      tickList.push(
        <line
          key={`tick-${deg}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );

      // Degree labels at 10° intervals
      if (isTen && (is360 || deg <= 180)) {
        // Outer scale label (e.g. 0 to 180)
        const outerLabelR = tickOuterRadius - 24;
        const lx = cos * outerLabelR;
        const ly = -sin * outerLabelR;

        tickList.push(
          <text
            key={`outer-txt-${deg}`}
            x={lx}
            y={ly}
            fontSize="9.5"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="600"
            fill="#1e293b"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${-deg + 90}, ${lx}, ${ly})`}
            className="select-none pointer-events-none"
          >
            {deg}
          </text>
        );

        // Inner scale label for 180 mode (reverse: 180 down to 0)
        if (!is360) {
          const innerDeg = 180 - deg;
          const innerLabelR = tickOuterRadius - 38;
          const ilx = cos * innerLabelR;
          const ily = -sin * innerLabelR;

          tickList.push(
            <text
              key={`inner-txt-${deg}`}
              x={ilx}
              y={ily}
              fontSize="8.5"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              fill="#0075de"
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${-deg + 90}, ${ilx}, ${ily})`}
              className="select-none pointer-events-none"
            >
              {innerDeg}
            </text>
          );
        }
      }
    }

    return tickList;
  }, [is360, tickOuterRadius]);

  // Baseline ruler centimeter / millimeter marks along bottom straight edge (for 180° mode)
  const rulerMarks = useMemo(() => {
    if (is360) return null;
    const marks: React.ReactNode[] = [];
    const width = radius * 2;
    const mmSpacing = radius / 10; // 10 main divisions
    for (let i = -10; i <= 10; i++) {
      const x = i * mmSpacing;
      const isMajor = i % 5 === 0;
      const isCenter = i === 0;
      const h = isCenter ? 12 : isMajor ? 8 : 4;

      marks.push(
        <line
          key={`ruler-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={h}
          stroke={isMajor ? '#0f172a' : '#64748b'}
          strokeWidth={isMajor ? 1.2 : 0.75}
        />
      );

      if (isMajor && !isCenter) {
        marks.push(
          <text
            key={`ruler-txt-${i}`}
            x={x}
            y={h + 7}
            fontSize="8"
            fontFamily="Inter, sans-serif"
            fill="#475569"
            textAnchor="middle"
          >
            {Math.abs(i)}
          </text>
        );
      }
    }
    return marks;
  }, [is360, radius]);

  // Dynamic Arc between Arm A and Arm B
  const arcData = useMemo(() => {
    const arcRadius = Math.min(80, Math.max(35, radius * 0.35));
    return createArcPath(vertex, armA, armB, arcRadius);
  }, [vertex, armA, armB, radius]);

  // Rotation Handle coordinates for protractor
  const rotateHandlePos = {
    x: 0,
    y: is360 ? -radius - 24 : -radius - 20,
  };

  return (
    <g className="protractor-dial-group select-none">
      {/* 1. Protractor Body (Semi-circle or Full Circle) */}
      <g
        transform={`translate(${center.x}, ${center.y}) rotate(${rotation})`}
        style={{ opacity }}
        className="transition-opacity duration-150"
      >
        {/* Background Acrylic Shadow & Fill */}
        {is360 ? (
          <circle
            r={radius}
            fill="rgba(255, 255, 255, 0.88)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="filter drop-shadow-md backdrop-blur-xs"
          />
        ) : (
          <path
            d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0 L ${radius} 18 L ${-radius} 18 Z`}
            fill="rgba(255, 255, 255, 0.88)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="filter drop-shadow-md backdrop-blur-xs"
          />
        )}

        {/* Inner Cutout Hole */}
        <circle
          r={innerRadius}
          fill="none"
          stroke="rgba(203, 213, 225, 0.6)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Center Target & Alignment Crosshair */}
        <line x1={-18} y1={0} x2={18} y2={0} stroke="#f97316" strokeWidth="1.5" />
        <line x1={0} y1={-18} x2={0} y2={18} stroke="#f97316" strokeWidth="1.5" />
        <circle r="4" fill="none" stroke="#f97316" strokeWidth="1.5" />
        <circle r="1" fill="#f97316" />

        {/* Ticks and Degree Numbers */}
        {ticks}

        {/* Baseline ruler for 180° */}
        {rulerMarks}

        {/* Scale direction indicators */}
        {!is360 && (
          <g opacity="0.7">
            <text x={radius - 40} y={-10} fontSize="7" fill="#64748b" textAnchor="end">0° → 180° (Inner)</text>
            <text x={-radius + 40} y={-10} fontSize="7" fill="#0075de" textAnchor="start">180° ← 0° (Outer)</text>
          </g>
        )}

        {/* Protractor Center Drag Touch Target */}
        <g
          className="cursor-move group"
          onPointerDown={(e) => onPointerDownHandle(e, 'protractorCenter')}
          aria-label="Drag Protractor Body"
        >
          <circle r={innerRadius - 6} fill="transparent" />
          <circle
            r="16"
            fill="rgba(0, 117, 222, 0.08)"
            stroke="#0075de"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            className="group-hover:fill-blue-100 transition-colors"
          />
          <text
            y="26"
            fontSize="8"
            fontWeight="600"
            fill="#0075de"
            textAnchor="middle"
            className="pointer-events-none font-sans"
          >
            DRAG DIAL
          </text>
        </g>

        {/* Protractor Dial Rotation Handle */}
        <g
          transform={`translate(${rotateHandlePos.x}, ${rotateHandlePos.y})`}
          className="cursor-grab active:cursor-grabbing group"
          onPointerDown={(e) => onPointerDownHandle(e, 'protractorRotate')}
          aria-label="Rotate Protractor Dial"
        >
          <line x1={0} y1={is360 ? 24 : 20} x2={0} y2={0} stroke="#0075de" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle
            r="11"
            fill="#0075de"
            stroke="#ffffff"
            strokeWidth="2.5"
            className="filter drop-shadow-md group-hover:scale-110 transition-transform"
          />
          {/* Curved rotation arrows icon inside handle */}
          <path
            d="M -4 -2 A 5 5 0 0 1 4 -2 M 4 -2 L 1 -4 M 4 -2 L 1 0"
            stroke="#ffffff"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* 2. Dynamic Angle Arc Sector & Label */}
      <path
        d={arcData.path}
        fill="rgba(0, 117, 222, 0.18)"
        stroke="#0075de"
        strokeWidth="2"
        className="transition-all duration-75"
      />
      {showDegreesOnArc && (
        <g
          transform={`translate(${arcData.textPos.x}, ${arcData.textPos.y})`}
          className="pointer-events-none select-none"
        >
          <rect
            x="-26"
            y="-12"
            width="52"
            height="24"
            rx="6"
            fill="#1e293b"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
          />
          <text
            x="0"
            y="4"
            fontSize="12"
            fontWeight="bold"
            fontFamily="Inter, system-ui, sans-serif"
            fill="#ffffff"
            textAnchor="middle"
          >
            {angleValue.toFixed(1)}°
          </text>
        </g>
      )}

      {/* 3. Connecting Ray Lines (V -> A and V -> B) */}
      {/* Ray A (Bright Blue) */}
      <line
        x1={vertex.x}
        y1={vertex.y}
        x2={armA.x}
        y2={armA.y}
        stroke="#3b82f6"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Ray B (Emerald Green) */}
      <line
        x1={vertex.x}
        y1={vertex.y}
        x2={armB.x}
        y2={armB.y}
        stroke="#10b981"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* 4. Draggable Handle Pins: V, A, B */}

      {/* Arm A Handle (Blue) */}
      <g
        transform={`translate(${armA.x}, ${armA.y})`}
        className="cursor-pointer group"
        onPointerDown={(e) => onPointerDownHandle(e, 'armA')}
        aria-label="Drag Arm A Pin"
      >
        {/* Generous touch target (48px) for kids and mobile touch */}
        <circle r="24" fill="transparent" />
        <circle
          r={activeHandle === 'armA' ? '18' : '15'}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth="3"
          className="filter drop-shadow-lg transition-transform group-hover:scale-110"
        />
        <text
          x="0"
          y="4.5"
          fontSize="11"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
          fill="#ffffff"
          textAnchor="middle"
          className="pointer-events-none select-none"
        >
          A
        </text>
        <circle r="2" fill="#ffffff" />
      </g>

      {/* Arm B Handle (Emerald Green) */}
      <g
        transform={`translate(${armB.x}, ${armB.y})`}
        className="cursor-pointer group"
        onPointerDown={(e) => onPointerDownHandle(e, 'armB')}
        aria-label="Drag Arm B Pin"
      >
        <circle r="24" fill="transparent" />
        <circle
          r={activeHandle === 'armB' ? '18' : '15'}
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="3"
          className="filter drop-shadow-lg transition-transform group-hover:scale-110"
        />
        <text
          x="0"
          y="4.5"
          fontSize="11"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
          fill="#ffffff"
          textAnchor="middle"
          className="pointer-events-none select-none"
        >
          B
        </text>
        <circle r="2" fill="#ffffff" />
      </g>

      {/* Vertex Handle (Bright Orange V) - Placed last so it's on top of rays */}
      <g
        transform={`translate(${vertex.x}, ${vertex.y})`}
        className="cursor-pointer group"
        onPointerDown={(e) => onPointerDownHandle(e, 'vertex')}
        aria-label="Drag Vertex Pin"
      >
        <circle r="26" fill="transparent" />
        {/* Pulsing ring indicator */}
        <circle
          r="20"
          fill="none"
          stroke="#f97316"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          className="opacity-60 animate-spin-slow"
        />
        <circle
          r={activeHandle === 'vertex' ? '18' : '15'}
          fill="#f97316"
          stroke="#ffffff"
          strokeWidth="3"
          className="filter drop-shadow-lg transition-transform group-hover:scale-110"
        />
        <text
          x="0"
          y="4.5"
          fontSize="11"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
          fill="#ffffff"
          textAnchor="middle"
          className="pointer-events-none select-none"
        >
          V
        </text>
        <circle r="2.5" fill="#ffffff" />
      </g>
    </g>
  );
};
