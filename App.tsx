
import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { HandTracker } from './components/HandTracker';
import { HologramScene } from './components/HologramScene';
import { AppState, HandState } from './types';

const INITIAL_HAND_STATE: HandState = {
  isActive: false,
  isFist: false,
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0 },
  shapeIndex: 0
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    leftHand: { ...INITIAL_HAND_STATE },
    rightHand: { ...INITIAL_HAND_STATE },
    cameraOrbit: 0,
  });

  const fistCount = useRef(0);

  const handleHandUpdate = useCallback((left: HandState | null, right: HandState | null) => {
    setAppState(prev => {
      const newState = { ...prev };
      
      const updateHand = (current: HandState | null, prevHand: HandState) => {
        if (current) {
          if (current.isFist && !prevHand.isFist) {
            fistCount.current += 1;
            // Now 65 unique shapes available
            current.shapeIndex = (fistCount.current - 1) % 65;
          } else {
            current.shapeIndex = prevHand.shapeIndex;
          }
          return current;
        }
        return { ...INITIAL_HAND_STATE };
      };

      newState.leftHand = updateHand(left, prev.leftHand);
      newState.rightHand = updateHand(right, prev.rightHand);

      // Orbital responsiveness based on active hand positioning
      let targetOrbit = 0;
      let activeCount = 0;
      if (newState.leftHand.isActive) {
        targetOrbit += newState.leftHand.position.x;
        activeCount++;
      }
      if (newState.rightHand.isActive) {
        targetOrbit += newState.rightHand.position.x;
        activeCount++;
      }
      
      if (activeCount > 0) {
        targetOrbit /= activeCount;
        newState.cameraOrbit = prev.cameraOrbit * 0.94 + (targetOrbit * 0.4) * 0.06;
      } else {
        newState.cameraOrbit = prev.cameraOrbit * 0.96;
      }

      return newState;
    });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 36 }}
          dpr={[1, 2.5]}
          gl={{ 
            antialias: true, 
            alpha: false, 
            stencil: false, 
            depth: true,
            powerPreference: "high-performance" 
          }}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0} />
          <pointLight position={[2, 2, 5]} intensity={1.5} color="#00ffff" />
          
          <HologramScene appState={appState} />

          <EffectComposer multisampling={8}>
            <Bloom 
              intensity={3.5} 
              luminanceThreshold={0.01} 
              luminanceSmoothing={0.9} 
              height={720} 
            />
          </EffectComposer>
        </Canvas>
      </div>

      <HandTracker onUpdate={handleHandUpdate} />
    </div>
  );
};

export default App;
