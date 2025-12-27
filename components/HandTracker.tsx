
import React, { useEffect, useRef } from 'react';
import { HandState } from '../types';

const HANDS_BUNDLE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
const CAMERA_BUNDLE = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils';

interface HandTrackerProps {
  onUpdate: (left: HandState | null, right: HandState | null) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    const initTracking = async () => {
      // @ts-ignore
      const { Hands, Camera } = window;
      if (!Hands || !Camera) {
        setTimeout(initTracking, 500);
        return;
      }

      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      hands.onResults((results: any) => {
        let leftHand: HandState | null = null;
        let rightHand: HandState | null = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const handedness = results.multiHandedness[index].label;
            const wrist = landmarks[0];
            const palmCenter = landmarks[9];
            
            // Refined fist detection
            const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
            const avgDist = tips.reduce((acc, tip) => {
              return acc + Math.sqrt(Math.pow(tip.x - palmCenter.x, 2) + Math.pow(tip.y - palmCenter.y, 2));
            }, 0) / 4;

            const isFist = avgDist < 0.11;

            const handState: HandState = {
              isActive: true,
              isFist: isFist,
              // Map 0-1 (MediaPipe) to centered -4 to 4 approximately
              position: {
                x: (0.5 - wrist.x) * 8.5, 
                y: (0.5 - wrist.y) * 6,
                z: isFist ? 0.5 : 0
              },
              velocity: { x: 0, y: 0 },
              shapeIndex: 0
            };

            if (handedness === 'Left') leftHand = handState;
            else rightHand = handState;
          });
        }
        onUpdate(leftHand, rightHand);
      });

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            await hands.send({ image: videoRef.current! });
          },
          width: 640,
          height: 480
        });
        camera.start();
        cameraRef.current = camera;
      }
      handsRef.current = hands;
    };

    const s1 = document.createElement('script');
    s1.src = HANDS_BUNDLE;
    s1.async = true;
    const s2 = document.createElement('script');
    s2.src = CAMERA_BUNDLE;
    s2.async = true;
    document.body.appendChild(s1);
    document.body.appendChild(s2);
    s2.onload = initTracking;

    return () => {
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, [onUpdate]);

  return (
    <video
      ref={videoRef}
      className="fixed opacity-0 pointer-events-none"
      style={{ transform: 'scaleX(-1)' }}
      playsInline
    />
  );
};
