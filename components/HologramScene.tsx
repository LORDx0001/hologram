
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, HandState } from '../types';

interface HologramSceneProps {
  appState: AppState;
}

const PARTICLE_COUNT = 4000;

// --- High-Fidelity Procedural Shape Generators ---

const getMeshPoints = (geometry: THREE.BufferGeometry) => {
  const pos = geometry.attributes.position.array as Float32Array;
  const count = pos.length / 3;
  const result = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = (i % count) * 3;
    result[i * 3] = pos[idx];
    result[i * 3 + 1] = pos[idx + 1];
    result[i * 3 + 2] = pos[idx + 2];
  }
  return result;
};

const generateCrystalline = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const layers = 3;
  const perLayer = PARTICLE_COUNT / layers;
  for (let l = 0; l < layers; l++) {
    const scale = 0.4 + l * 0.25;
    const geom = new THREE.IcosahedronGeometry(scale, 1);
    const layerPts = geom.attributes.position.array as Float32Array;
    for (let p = 0; p < perLayer; p++) {
      const idx = (l * perLayer + p) * 3;
      const srcIdx = (p % (layerPts.length / 3)) * 3;
      pts[idx] = layerPts[srcIdx];
      pts[idx + 1] = layerPts[srcIdx + 1];
      pts[idx + 2] = layerPts[srcIdx + 2];
    }
  }
  return pts;
};

const generateOrbitingRings = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const rings = 5;
  const perRing = PARTICLE_COUNT / rings;
  for (let r = 0; r < rings; r++) {
    const radius = 0.3 + r * 0.15;
    const tilt = r * (Math.PI / rings);
    for (let p = 0; p < perRing; p++) {
      const idx = (r * perRing + p) * 3;
      const t = (p / perRing) * Math.PI * 2;
      const x = Math.cos(t) * radius;
      const y = Math.sin(t) * radius;
      const vec = new THREE.Vector3(x, y, 0).applyEuler(new THREE.Euler(tilt, tilt * 0.5, 0));
      pts[idx] = vec.x;
      pts[idx + 1] = vec.y;
      pts[idx + 2] = vec.z;
    }
  }
  return pts;
};

const generateDoubleHelix = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 10;
    const strand = i % 2 === 0 ? 1 : -1;
    const r = 0.4;
    pts[i * 3] = Math.cos(t + (strand === 1 ? 0 : Math.PI)) * r;
    pts[i * 3 + 1] = (i / PARTICLE_COUNT) * 1.6 - 0.8;
    pts[i * 3 + 2] = Math.sin(t + (strand === 1 ? 0 : Math.PI)) * r;
    // Add data connectors
    if (i % 50 === 0) {
      for (let j = 0; j < 5; j++) {
        const sub = (i + j) % PARTICLE_COUNT;
        pts[sub * 3] *= (j / 5);
        pts[sub * 3 + 2] *= (j / 5);
      }
    }
  }
  return pts;
};

const generateMechanical = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const gears = 3;
  const perGear = PARTICLE_COUNT / gears;
  for (let g = 0; g < gears; g++) {
    const r = 0.4 + g * 0.1;
    const z = (g - 1) * 0.2;
    for (let p = 0; p < perGear; p++) {
      const idx = (g * perGear + p) * 3;
      const t = (p / perGear) * Math.PI * 2;
      const cog = Math.sin(t * 12) > 0 ? 0.05 : 0;
      pts[idx] = Math.cos(t) * (r + cog);
      pts[idx + 1] = Math.sin(t) * (r + cog);
      pts[idx + 2] = z;
    }
  }
  return pts;
};

const generateFractalLattice = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const dim = 6;
  const step = 0.3;
  let count = 0;
  for (let x = 0; x < dim; x++) {
    for (let y = 0; y < dim; y++) {
      for (let z = 0; z < dim; z++) {
        if (count >= PARTICLE_COUNT) break;
        const px = (x - dim/2) * step;
        const py = (y - dim/2) * step;
        const pz = (z - dim/2) * step;
        // Jitter within nodes
        for(let k=0; k<18 && count < PARTICLE_COUNT; k++) {
          pts[count * 3] = px + (Math.random() - 0.5) * 0.05;
          pts[count * 3 + 1] = py + (Math.random() - 0.5) * 0.05;
          pts[count * 3 + 2] = pz + (Math.random() - 0.5) * 0.05;
          count++;
        }
      }
    }
  }
  return pts;
};

const generateVortex = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 40;
    const r = (i / PARTICLE_COUNT) * 0.8;
    pts[i * 3] = Math.cos(t) * r;
    pts[i * 3 + 1] = Math.sin(t) * r;
    pts[i * 3 + 2] = (i / PARTICLE_COUNT) * 1.8 - 0.9;
  }
  return pts;
};

const generateMolecule = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const atoms = 15;
  const perAtom = Math.floor(PARTICLE_COUNT / atoms);
  const centers = Array.from({ length: atoms }, () => new THREE.Vector3(
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5
  ));
  for (let a = 0; a < atoms; a++) {
    const c = centers[a];
    const nextC = centers[(a + 1) % atoms];
    for (let p = 0; p < perAtom; p++) {
      const idx = (a * perAtom + p) * 3;
      if (p < perAtom * 0.7) {
        const r = 0.12;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        pts[idx] = c.x + r * Math.sin(theta) * Math.cos(phi);
        pts[idx + 1] = c.y + r * Math.sin(theta) * Math.sin(phi);
        pts[idx + 2] = c.z + r * Math.cos(theta);
      } else {
        const t = (p - perAtom * 0.7) / (perAtom * 0.3);
        pts[idx] = THREE.MathUtils.lerp(c.x, nextC.x, t);
        pts[idx + 1] = THREE.MathUtils.lerp(c.y, nextC.y, t);
        pts[idx + 2] = THREE.MathUtils.lerp(c.z, nextC.z, t);
      }
    }
  }
  return pts;
};

const generateCityscape = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const buildings = 25;
  const perB = Math.floor(PARTICLE_COUNT / buildings);
  for (let b = 0; b < buildings; b++) {
    const bx = (Math.random() - 0.5) * 1.4;
    const bz = (Math.random() - 0.5) * 1.4;
    const h = 0.3 + Math.random() * 1.2;
    const w = 0.1 + Math.random() * 0.15;
    for (let p = 0; p < perB; p++) {
      const idx = (b * perB + p) * 3;
      const t = p / perB;
      if (t < 0.2) {
        pts[idx] = bx + (Math.random() - 0.5) * w;
        pts[idx + 1] = h - 0.8;
        pts[idx + 2] = bz + (Math.random() - 0.5) * w;
      } else {
        const side = Math.floor(Math.random() * 4);
        pts[idx + 1] = Math.random() * h - 0.8;
        if (side === 0) { pts[idx] = bx - w/2; pts[idx + 2] = bz + (Math.random()-0.5)*w; }
        else if (side === 1) { pts[idx] = bx + w/2; pts[idx + 2] = bz + (Math.random()-0.5)*w; }
        else if (side === 2) { pts[idx] = bx + (Math.random()-0.5)*w; pts[idx + 2] = bz - w/2; }
        else { pts[idx] = bx + (Math.random()-0.5)*w; pts[idx + 2] = bz + w/2; }
      }
    }
  }
  return pts;
};

const generateSacredGeometry = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const nodes = 12;
  const perNode = PARTICLE_COUNT / nodes;
  for (let n = 0; n < nodes; n++) {
    const angle = (n / nodes) * Math.PI * 2;
    const r = 0.6;
    const cx = Math.cos(angle) * r;
    const cy = Math.sin(angle) * r;
    for (let p = 0; p < perNode; p++) {
      const idx = (n * perNode + p) * 3;
      const t = (p / perNode) * Math.PI * 2;
      pts[idx] = cx + Math.cos(t) * 0.3;
      pts[idx + 1] = cy + Math.sin(t) * 0.3;
      pts[idx + 2] = Math.sin(t * 3) * 0.1;
    }
  }
  return pts;
};

// --- Sub-Components ---

const HandParticles: React.FC<{ 
  hand: HandState, 
  otherHand: HandState,
  color: string,
  shapes: Float32Array[]
}> = ({ hand, otherHand, color, shapes }) => {
  const meshRef = useRef<THREE.Points>(null);
  const particlesPosition = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const lerpSpeeds = useMemo(() => new Float32Array(PARTICLE_COUNT).map(() => 0.07 + Math.random() * 0.08), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    // Follow wrist
    meshRef.current.position.x += (hand.position.x - meshRef.current.position.x) * 0.15;
    meshRef.current.position.y += (hand.position.y - meshRef.current.position.y) * 0.15;
    meshRef.current.position.z += (hand.position.z - meshRef.current.position.z) * 0.15;
    meshRef.current.rotation.y += delta * 0.4;

    if (!hand.isActive) { meshRef.current.visible = false; return; }
    meshRef.current.visible = true;

    if (hand.isFist) {
      const target = shapes[hand.shapeIndex % shapes.length];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const s = lerpSpeeds[i];
        pos[i * 3] += (target[i * 3] - pos[i * 3]) * s;
        pos[i * 3 + 1] += (target[i * 3 + 1] - pos[i * 3 + 1]) * s;
        pos[i * 3 + 2] += (target[i * 3 + 2] - pos[i * 3 + 2]) * s;
      }
    } else {
      // Cloud expansion logic
      const dist = Math.sqrt(Math.pow(hand.position.x - otherHand.position.x, 2) + Math.pow(hand.position.y - otherHand.position.y, 2));
      const spread = otherHand.isActive && !otherHand.isFist ? 1.0 + Math.min(dist * 0.5, 3.0) : 1.0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const seed = i * 0.42;
        const tx = Math.sin(seed + time * 0.35) * 1.8 * spread;
        const ty = Math.cos(seed * 0.85 + time * 0.45) * 1.8 * spread;
        const tz = Math.sin(seed * 1.15 + time * 0.25) * 1.2;
        pos[i * 3] += (tx - pos[i * 3]) * 0.05;
        pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * 0.05;
        pos[i * 3 + 2] += (tz - pos[i * 3 + 2]) * 0.05;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={particlesPosition} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.014} color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation={true} />
    </points>
  );
};

export const HologramScene: React.FC<HologramSceneProps> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const shapes = useMemo(() => {
    const list = [];
    // Sequential library from simple to hyper-complex
    list.push(getMeshPoints(new THREE.IcosahedronGeometry(0.7, 1)));
    list.push(getMeshPoints(new THREE.TorusGeometry(0.6, 0.1, 8, 32)));
    list.push(getMeshPoints(new THREE.BoxGeometry(0.8, 0.8, 0.8, 6, 6, 6)));
    list.push(getMeshPoints(new THREE.DodecahedronGeometry(0.8, 0)));
    list.push(generateCrystalline()); // Faceted crystalline
    list.push(generateOrbitingRings()); // Concentric Rings
    list.push(getMeshPoints(new THREE.TorusKnotGeometry(0.5, 0.12, 128, 16)));
    list.push(generateDoubleHelix()); // Double Helix
    list.push(generateMechanical()); // Gears
    list.push(generateFractalLattice()); // Lattice
    list.push(generateSacredGeometry()); // Sacred Geometry
    list.push(getMeshPoints(new THREE.SphereGeometry(0.7, 32, 32))); // Living Sphere
    list.push(generateVortex()); // Vortex
    list.push(generateMolecule()); // Molecule
    list.push(generateCityscape()); // City fragment
    list.push(getMeshPoints(new THREE.CapsuleGeometry(0.4, 0.8, 8, 32)));
    list.push(getMeshPoints(new THREE.OctahedronGeometry(0.8, 2)));
    list.push(getMeshPoints(new THREE.TorusGeometry(0.6, 0.2, 4, 8))); // Cyber Cube base
    list.push(generateCrystalline()); // Complex Crystal
    list.push(generateDoubleHelix()); // Data Helix
    list.push(generateMechanical()); // Clockwork
    list.push(generateFractalLattice()); // Quantum Grid
    list.push(generateCityscape()); // Mega City
    list.push(generateVortex()); // Singularity
    list.push(generateMolecule()); // DNA Lattice
    return list;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      // Dynamic camera orbit based on hand position
      groupRef.current.rotation.y = appState.cameraOrbit * 0.5;
      groupRef.current.rotation.x = -Math.abs(appState.cameraOrbit) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <HandParticles hand={appState.leftHand} otherHand={appState.rightHand} color="#00eeff" shapes={shapes} />
      <HandParticles hand={appState.rightHand} otherHand={appState.leftHand} color="#00eeff" shapes={shapes} />
    </group>
  );
};
