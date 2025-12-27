
export interface HandState {
  isActive: boolean;
  isFist: boolean;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number };
  shapeIndex: number;
}

export interface AppState {
  leftHand: HandState;
  rightHand: HandState;
  cameraOrbit: number;
}
