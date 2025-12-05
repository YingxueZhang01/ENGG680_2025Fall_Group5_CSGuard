export enum SafetyStatus {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Detection {
  label: string; // 'Person', 'Hardhat', 'Mask', 'Safety Vest'
  confidence: number;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
}

export interface AnalysisResult {
  detections: Detection[];
  violations: string[];
  timestamp: string;
}

export interface Camera {
  id: string;
  name: string;
  type: 'USB' | 'NETWORK';
  deviceId?: string; // For USB cameras
  url?: string; // For RTSP/HTTP streams
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'VIOLATION' | 'INFO' | 'SYSTEM';
  message: string;
  details?: string;
  snapshot?: string; // Base64 image of the violation
  cameraName?: string;
}

export interface AppSettings {
  detectionInterval: number; // ms
  confidenceThreshold: number;
  enableAudioAlerts: boolean;
  autoRecordEvidence: boolean;
  customModelName?: string | null;
  cameras: Camera[];
}

export type TimeRange = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';
