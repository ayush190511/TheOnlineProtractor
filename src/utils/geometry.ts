import type { Point, AngleInfo, AngleClassification } from './types';

export const COMMON_SNAP_ANGLES = [
  0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 210, 225, 240, 270, 300, 315, 330, 360
];

/**
 * Calculates Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Converts Radians to Degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Converts Degrees to Radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Normalizes angle to [0, 360)
 */
export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Calculates angle in degrees of vector (p - origin) relative to positive X axis
 */
export function getVectorAngle(origin: Point, p: Point): number {
  const angleRad = Math.atan2(p.y - origin.y, p.x - origin.x);
  return normalizeAngle(radToDeg(angleRad));
}

/**
 * Calculates the counter-clockwise sweep angle from Ray (V -> A) to Ray (V -> B)
 */
export function calculateAngle(vertex: Point, armA: Point, armB: Point): number {
  const angleA = getVectorAngle(vertex, armA);
  const angleB = getVectorAngle(vertex, armB);
  
  let diff = angleB - angleA;
  if (diff < 0) diff += 360;
  return normalizeAngle(diff);
}

/**
 * Classifies an angle and returns rich educational context
 */
export function classifyAngle(degrees: number): AngleInfo {
  const rounded = Number(degrees.toFixed(1));
  const radians = degToRad(degrees);
  const gradians = (degrees * 400) / 360;

  let classification: AngleClassification = 'acute';
  let name = 'Acute Angle';
  let badgeColor = '#0284c7'; // Notion sky/blue
  let badgeBg = '#e0f2fe';
  let kidEmoji = '🍕';
  let kidExplanation = 'Sharp and small (less than 90°), just like a tasty slice of pizza!';

  if (rounded === 0 || rounded === 360) {
    if (rounded === 360) {
      classification = 'full';
      name = 'Full Circle Angle';
      badgeColor = '#9333ea';
      badgeBg = '#f3e8ff';
      kidEmoji = '🎡';
      kidExplanation = 'A full 360° spin, all the way around like a ferris wheel!';
    } else {
      classification = 'zero';
      name = 'Zero Angle';
      badgeColor = '#64748b';
      badgeBg = '#f1f5f9';
      kidEmoji = '🎯';
      kidExplanation = '0° — both rays are pointing in the exact same direction!';
    }
  } else if (Math.abs(rounded - 90) < 0.15) {
    classification = 'right';
    name = 'Right Angle (90°)';
    badgeColor = '#16a34a';
    badgeBg = '#dcfce7';
    kidEmoji = '📐';
    kidExplanation = 'A perfect 90° square corner, like the corner of a book or door!';
  } else if (rounded < 90) {
    classification = 'acute';
    name = 'Acute Angle';
    badgeColor = '#0284c7';
    badgeBg = '#e0f2fe';
    kidEmoji = '🍕';
    kidExplanation = 'Sharp and smaller than 90°, just like a slice of pizza or an ice cream cone!';
  } else if (Math.abs(rounded - 180) < 0.15) {
    classification = 'straight';
    name = 'Straight Angle (180°)';
    badgeColor = '#d97706';
    badgeBg = '#fef3c7';
    kidEmoji = '📏';
    kidExplanation = 'A completely straight 180° flat line, like an open ruler or horizon!';
  } else if (rounded < 180) {
    classification = 'obtuse';
    name = 'Obtuse Angle';
    badgeColor = '#ea580c';
    badgeBg = '#ffedd5';
    kidEmoji = '💻';
    kidExplanation = 'Wide open between 90° and 180°, like an open laptop screen!';
  } else {
    classification = 'reflex';
    name = 'Reflex Angle';
    badgeColor = '#7c3aed';
    badgeBg = '#ede9fe';
    kidEmoji = '🟡';
    kidExplanation = 'A giant angle greater than 180°, like Pac-Man opening his mouth wide!';
  }

  const supplementary = Math.max(0, Number((180 - degrees).toFixed(1)));
  const complementary = degrees <= 90 ? Number((90 - degrees).toFixed(1)) : 0;
  const reflex = Number((360 - degrees).toFixed(1));

  return {
    degrees: rounded,
    radians,
    gradians,
    classification,
    name,
    badgeColor,
    badgeBg,
    kidEmoji,
    kidExplanation,
    supplementary,
    complementary,
    reflex,
  };
}

/**
 * Snaps an angle to common values if within threshold
 */
export function checkAngleSnap(currentAngle: number, threshold = 2.0): { snapped: boolean; angle: number } {
  for (const target of COMMON_SNAP_ANGLES) {
    const diff = Math.abs(currentAngle - target);
    if (diff <= threshold || Math.abs(diff - 360) <= threshold) {
      return { snapped: true, angle: target % 360 };
    }
  }
  return { snapped: false, angle: currentAngle };
}

/**
 * Computes the position of a point rotated around a center
 */
export function rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
  const angleRad = degToRad(angleDegrees);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
}

/**
 * Sets a new angle by repositioning Arm B while preserving distance from Vertex
 */
export function setArmAngle(vertex: Point, armA: Point, currentArmB: Point, targetAngleDegrees: number): Point {
  const dist = distance(vertex, currentArmB);
  const angleA = getVectorAngle(vertex, armA);
  const targetAbsoluteAngle = normalizeAngle(angleA + targetAngleDegrees);
  const rad = degToRad(targetAbsoluteAngle);
  
  return {
    x: vertex.x + dist * Math.cos(rad),
    y: vertex.y + dist * Math.sin(rad),
  };
}

/**
 * Generates an SVG path string for an arc sector between Arm A and Arm B
 */
export function createArcPath(
  vertex: Point,
  armA: Point,
  armB: Point,
  radius: number
): { path: string; textPos: Point; sweepAngle: number } {
  const angleA = getVectorAngle(vertex, armA);
  const angleB = getVectorAngle(vertex, armB);
  let sweep = angleB - angleA;
  if (sweep < 0) sweep += 360;

  const startRad = degToRad(angleA);
  const endRad = degToRad(angleB);

  const startX = vertex.x + radius * Math.cos(startRad);
  const startY = vertex.y + radius * Math.sin(startRad);
  const endX = vertex.x + radius * Math.cos(endRad);
  const endY = vertex.y + radius * Math.sin(endRad);

  const largeArcFlag = sweep > 180 ? 1 : 0;
  const sweepFlag = 1; // Counter-clockwise positive in SVG screen coords

  const path = [
    `M ${vertex.x} ${vertex.y}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`,
    'Z'
  ].join(' ');

  // Midpoint angle for placing the degree text label
  const midAngle = normalizeAngle(angleA + sweep / 2);
  const textRadius = radius + 22;
  const textPos = {
    x: vertex.x + textRadius * Math.cos(degToRad(midAngle)),
    y: vertex.y + textRadius * Math.sin(degToRad(midAngle)),
  };

  return { path, textPos, sweepAngle: sweep };
}
