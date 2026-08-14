export interface Point {
  x: number;
  y: number;
}

export type HandleType = 'vertex' | 'armA' | 'armB' | 'protractorCenter' | 'protractorRotate';

export type ProtractorMode = '180' | '360';

export type AppToolMode = 'standard' | 'image' | 'camera' | 'print';

export type AngleClassification = 
  | 'zero'
  | 'acute'
  | 'right'
  | 'obtuse'
  | 'straight'
  | 'reflex'
  | 'full';

export interface AngleInfo {
  degrees: number;
  radians: number;
  gradians: number;
  classification: AngleClassification;
  name: string;
  badgeColor: string;
  badgeBg: string;
  kidEmoji: string;
  kidExplanation: string;
  supplementary: number; // 180 - θ
  complementary: number; // 90 - θ (clamped to 0 if > 90)
  reflex: number; // 360 - θ
}

export interface ProtractorState {
  // Pins coordinates (in canvas space)
  vertex: Point;
  armA: Point;
  armB: Point;
  
  // Protractor dial position & rotation
  protractorCenter: Point;
  protractorRadius: number;
  protractorRotation: number; // in degrees
  
  // Display settings
  mode: ProtractorMode; // 180 or 360
  opacity: number; // 0 to 1
  snapToCommonAngles: boolean;
  showGrid: boolean;
  showMagnifier: boolean;
  showDegreesOnArc: boolean;
  displayAngleType: 'interior' | 'supplementary' | 'reflex';
  
  // Canvas viewport transform
  scale: number;
  pan: Point;
}
