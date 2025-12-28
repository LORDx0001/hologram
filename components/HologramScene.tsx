
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, HandState } from '../types';

interface HologramSceneProps {
  appState: AppState;
}

const PARTICLE_COUNT = 4000;

// --- Helper for Mesh Point Sampling ---
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

// --- Generator Functions ---

const generateCrystalline = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const layers = 3;
  for (let l = 0; l < layers; l++) {
    const scale = 0.4 + l * 0.25;
    const geom = new THREE.IcosahedronGeometry(scale, 1);
    const layerPts = geom.attributes.position.array as Float32Array;
    for (let p = 0; p < Math.floor(PARTICLE_COUNT / layers); p++) {
      const idx = (l * Math.floor(PARTICLE_COUNT / layers) + p) * 3;
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
  for (let r = 0; r < 5; r++) {
    const radius = 0.3 + r * 0.15;
    const tilt = r * (Math.PI / 5);
    const per = Math.floor(PARTICLE_COUNT / 5);
    for (let p = 0; p < per; p++) {
      const idx = (r * per + p) * 3;
      const t = (p / per) * Math.PI * 2;
      const vec = new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0).applyEuler(new THREE.Euler(tilt, tilt * 0.5, 0));
      pts[idx] = vec.x; pts[idx + 1] = vec.y; pts[idx + 2] = vec.z;
    }
  }
  return pts;
};

const generateDoubleHelix = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 10;
    const strand = i % 2 === 0 ? 1 : -1;
    pts[i * 3] = Math.cos(t + (strand === 1 ? 0 : Math.PI)) * 0.4;
    pts[i * 3 + 1] = (i / PARTICLE_COUNT) * 1.6 - 0.8;
    pts[i * 3 + 2] = Math.sin(t + (strand === 1 ? 0 : Math.PI)) * 0.4;
  }
  return pts;
};

const generateMechanical = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let g = 0; g < 3; g++) {
    const r = 0.4 + g * 0.1;
    const per = Math.floor(PARTICLE_COUNT / 3);
    for (let p = 0; p < per; p++) {
      const idx = (g * per + p) * 3;
      const t = (p / per) * Math.PI * 2;
      const cog = Math.sin(t * 12) > 0 ? 0.05 : 0;
      pts[idx] = Math.cos(t) * (r + cog);
      pts[idx + 1] = Math.sin(t) * (r + cog);
      pts[idx + 2] = (g - 1) * 0.2;
    }
  }
  return pts;
};

const generateFractalLattice = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  let count = 0;
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 6; y++) {
      for (let z = 0; z < 6; z++) {
        if (count >= PARTICLE_COUNT) break;
        for (let k = 0; k < 18 && count < PARTICLE_COUNT; k++) {
          pts[count * 3] = (x - 3) * 0.3 + (Math.random() - 0.5) * 0.05;
          pts[count * 3 + 1] = (y - 3) * 0.3 + (Math.random() - 0.5) * 0.05;
          pts[count * 3 + 2] = (z - 3) * 0.3 + (Math.random() - 0.5) * 0.05;
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
  const centers = Array.from({ length: 15 }, () => new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5));
  for (let a = 0; a < 15; a++) {
    const per = Math.floor(PARTICLE_COUNT / 15);
    for (let p = 0; p < per; p++) {
      const idx = (a * per + p) * 3;
      const r = 0.12, phi = Math.random() * Math.PI * 2, theta = Math.random() * Math.PI;
      pts[idx] = centers[a].x + r * Math.sin(theta) * Math.cos(phi);
      pts[idx + 1] = centers[a].y + r * Math.sin(theta) * Math.sin(phi);
      pts[idx + 2] = centers[a].z + r * Math.cos(theta);
    }
  }
  return pts;
};

const generateCityscape = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let b = 0; b < 25; b++) {
    const bx = (Math.random() - 0.5) * 1.4, bz = (Math.random() - 0.5) * 1.4;
    const h = 0.3 + Math.random() * 1.2, w = 0.1 + Math.random() * 0.15;
    const per = Math.floor(PARTICLE_COUNT / 25);
    for (let p = 0; p < per; p++) {
      const idx = (b * per + p) * 3;
      pts[idx + 1] = Math.random() * h - 0.8;
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { pts[idx] = bx - w / 2; pts[idx + 2] = bz + (Math.random() - 0.5) * w; }
      else if (side === 1) { pts[idx] = bx + w / 2; pts[idx + 2] = bz + (Math.random() - 0.5) * w; }
      else if (side === 2) { pts[idx] = bx + (Math.random() - 0.5) * w; pts[idx + 2] = bz - w / 2; }
      else { pts[idx] = bx + (Math.random() - 0.5) * w; pts[idx + 2] = bz + w / 2; }
    }
  }
  return pts;
};

const generateSacredGeometry = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let n = 0; n < 12; n++) {
    const angle = (n / 12) * Math.PI * 2, r = 0.6;
    const per = Math.floor(PARTICLE_COUNT / 12);
    for (let p = 0; p < per; p++) {
      const idx = (n * per + p) * 3, t = (p / per) * Math.PI * 2;
      pts[idx] = Math.cos(angle) * r + Math.cos(t) * 0.2;
      pts[idx + 1] = Math.sin(angle) * r + Math.sin(t) * 0.2;
      pts[idx + 2] = Math.sin(t * 3) * 0.1;
    }
  }
  return pts;
};

const generateTesseract = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const v = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  let count = 0;
  for (let i = 0; i < 8; i++) {
    const per = Math.floor(PARTICLE_COUNT / 8);
    for (let p = 0; p < per; p++) {
      if (count >= PARTICLE_COUNT) break;
      const t = p / per;
      pts[count*3] = THREE.MathUtils.lerp(v[i][0]*0.3, v[i][0]*0.7, t);
      pts[count*3+1] = THREE.MathUtils.lerp(v[i][1]*0.3, v[i][1]*0.7, t);
      pts[count*3+2] = THREE.MathUtils.lerp(v[i][2]*0.3, v[i][2]*0.7, t);
      count++;
    }
  }
  return pts;
};

const generateNeuralNetwork = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const nodes = Array.from({ length: 25 }, () => new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const n1 = nodes[i % nodes.length];
    const n2 = nodes[(i + 3) % nodes.length];
    const t = Math.random();
    pts[i * 3] = THREE.MathUtils.lerp(n1.x, n2.x, t);
    pts[i * 3 + 1] = THREE.MathUtils.lerp(n1.y, n2.y, t);
    pts[i * 3 + 2] = THREE.MathUtils.lerp(n1.z, n2.z, t);
  }
  return pts;
};

const generateDigitalSingularity = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.7) {
      const r = 0.05 + Math.random() * 0.1;
      const phi = Math.random() * Math.PI * 2, theta = Math.random() * Math.PI;
      pts[i*3] = r * Math.sin(theta) * Math.cos(phi);
      pts[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
      pts[i*3+2] = r * Math.cos(theta);
    } else {
      const r = 0.2 + Math.random() * 1.2;
      const angle = Math.random() * Math.PI * 2;
      pts[i*3] = Math.cos(angle) * r;
      pts[i*3+1] = Math.sin(angle) * r;
      pts[i*3+2] = (Math.random() - 0.5) * 0.05;
    }
  }
  return pts;
};

const generateCyberEye = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const layer = i % 3;
    if (layer === 0) {
      const r = 0.4 + Math.random() * 0.2;
      const t = Math.random() * Math.PI * 2;
      pts[i*3] = Math.cos(t) * r; pts[i*3+1] = Math.sin(t) * r; pts[i*3+2] = Math.sqrt(Math.max(0, 0.64 - r*r)) - 0.4;
    } else {
      const phi = Math.random() * Math.PI * 2, theta = Math.random() * Math.PI * 0.5;
      const r = 0.8;
      pts[i*3] = r * Math.sin(theta) * Math.cos(phi);
      pts[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
      pts[i*3+2] = r * Math.cos(theta) - 0.4;
    }
  }
  return pts;
};

const generateCrystallineFlower = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 2;
    const petals = 6;
    const r = 0.3 + 0.5 * Math.abs(Math.cos(t * petals / 2));
    pts[i*3] = Math.cos(t) * r;
    pts[i*3+1] = Math.sin(t) * r;
    pts[i*3+2] = Math.sin(t * petals) * 0.1;
  }
  return pts;
};

const generateInterferenceWave = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 2;
    const z = (Math.random() - 0.5) * 2;
    const r = Math.sqrt(x*x + z*z);
    const y = Math.sin(r * 10) * 0.3 * Math.exp(-r);
    pts[i*3] = x; pts[i*3+1] = y; pts[i*3+2] = z;
  }
  return pts;
};

const generateVoxelMonolith = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pts[i*3] = (Math.random() - 0.5) * 0.6;
    pts[i*3+1] = (Math.random() - 0.5) * 1.4;
    pts[i*3+2] = (Math.random() - 0.5) * 0.3;
  }
  return pts;
};

const generateRibbonSpiral = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 8;
    const r = 0.5;
    const off = (Math.random() - 0.5) * 0.2;
    pts[i*3] = Math.cos(t) * (r + off);
    pts[i*3+1] = t * 0.1 - 1.2;
    pts[i*3+2] = Math.sin(t) * (r + off);
  }
  return pts;
};

const generateGeometricGeode = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = i < PARTICLE_COUNT * 0.5 ? 0.8 : 0.4 + Math.random() * 0.2;
    const phi = Math.random() * Math.PI * 2, theta = Math.random() * Math.PI;
    pts[i*3] = r * Math.sin(theta) * Math.cos(phi);
    pts[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
    pts[i*3+2] = r * Math.cos(theta);
  }
  return pts;
};

const generateQuantumEntanglement = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const side = i < PARTICLE_COUNT * 0.4 ? -1 : (i < PARTICLE_COUNT * 0.8 ? 1 : 0);
    if (side !== 0) {
      const r = Math.random() * 0.3;
      const p = Math.random() * Math.PI * 2, t = Math.random() * Math.PI;
      pts[i*3] = side * 0.7 + r * Math.sin(t) * Math.cos(p);
      pts[i*3+1] = r * Math.sin(t) * Math.sin(p);
      pts[i*3+2] = r * Math.cos(t);
    } else {
      const t = (Math.random() - 0.5) * 1.4;
      pts[i*3] = t;
      pts[i*3+1] = Math.sin(t * 10) * 0.1;
      pts[i*3+2] = Math.cos(t * 10) * 0.1;
    }
  }
  return pts;
};

const generateStarGate = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = i < PARTICLE_COUNT * 0.8 ? 0.9 : 0.8;
    const t = Math.random() * Math.PI * 2;
    pts[i*3] = Math.cos(t) * r;
    pts[i*3+1] = Math.sin(t) * r;
    pts[i*3+2] = (Math.random() - 0.5) * 0.1;
  }
  return pts;
};

const generatePyramidFractal = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const v = [[0,1,0], [1,-1,1], [-1,-1,1], [-1,-1,-1], [1,-1,-1]];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const edge = i % 8;
    const t = Math.random();
    let p1, p2;
    if (edge < 4) { p1 = v[0]; p2 = v[edge+1]; }
    else { p1 = v[edge-3]; p2 = v[edge === 7 ? 1 : edge-2]; }
    pts[i*3] = THREE.MathUtils.lerp(p1[0], p2[0], t) * 0.6;
    pts[i*3+1] = THREE.MathUtils.lerp(p1[1], p2[1], t) * 0.6;
    pts[i*3+2] = THREE.MathUtils.lerp(p1[2], p2[2], t) * 0.6;
  }
  return pts;
};

const generateDNALattice = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 10;
    const strand = i % 3;
    if (strand < 2) {
      const s = strand === 0 ? 1 : -1;
      pts[i*3] = Math.cos(t + (s === 1 ? 0 : Math.PI)) * 0.4;
      pts[i*3+1] = (i / PARTICLE_COUNT) * 1.6 - 0.8;
      pts[i*3+2] = Math.sin(t + (s === 1 ? 0 : Math.PI)) * 0.4;
    } else {
      const lerpT = Math.random();
      pts[i*3] = THREE.MathUtils.lerp(Math.cos(t)*0.4, Math.cos(t+Math.PI)*0.4, lerpT);
      pts[i*3+1] = (i / PARTICLE_COUNT) * 1.6 - 0.8;
      pts[i*3+2] = THREE.MathUtils.lerp(Math.sin(t)*0.4, Math.sin(t+Math.PI)*0.4, lerpT);
    }
  }
  return pts;
};

const generateSupernova = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.pow(Math.random(), 2) * 1.5;
    const p = Math.random() * Math.PI * 2, t = Math.random() * Math.PI;
    pts[i*3] = r * Math.sin(t) * Math.cos(p);
    pts[i*3+1] = r * Math.sin(t) * Math.sin(p);
    pts[i*3+2] = r * Math.cos(t);
  }
  return pts;
};

const generateHyperCore = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = (i % 3 + 1) * 0.25;
    const p = Math.random() * Math.PI * 2, t = Math.random() * Math.PI;
    pts[i*3] = r * Math.sin(t) * Math.cos(p);
    pts[i*3+1] = r * Math.sin(t) * Math.sin(p);
    pts[i*3+2] = r * Math.cos(t);
  }
  return pts;
};

const generateSpikyUrchin = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = Math.random() * Math.PI * 2, t = Math.random() * Math.PI;
    const isSpike = i % 10 === 0;
    const r = isSpike ? 0.3 + Math.random() * 0.7 : 0.3;
    pts[i*3] = r * Math.sin(t) * Math.cos(p);
    pts[i*3+1] = r * Math.sin(t) * Math.sin(p);
    pts[i*3+2] = r * Math.cos(t);
  }
  return pts;
};

const generateDataStream = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % 10;
    pts[i*3] = (col - 5) * 0.2;
    pts[i*3+1] = (Math.random() * 2) - 1;
    pts[i*3+2] = (Math.random() - 0.5) * 0.1;
  }
  return pts;
};

const generateWarpTunnel = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const z = (i / PARTICLE_COUNT) * 4 - 2;
    const r = 0.5 + Math.abs(z) * 0.2;
    const t = Math.random() * Math.PI * 2;
    pts[i*3] = Math.cos(t) * r;
    pts[i*3+1] = Math.sin(t) * r;
    pts[i*3+2] = z;
  }
  return pts;
};

const generateFloatingIslands = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const centers = Array.from({ length: 5 }, () => new THREE.Vector3((Math.random()-0.5)*1.8, (Math.random()-0.5)*1.2, (Math.random()-0.5)*1.2));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const c = centers[i % 5];
    pts[i*3] = c.x + (Math.random()-0.5)*0.4;
    pts[i*3+1] = c.y + (Math.random()-0.5)*0.2;
    pts[i*3+2] = c.z + (Math.random()-0.5)*0.4;
  }
  return pts;
};

const generateAuraShield = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = 0.8 + (i % 2) * 0.05;
    const p = Math.random() * Math.PI * 2, t = Math.random() * Math.PI;
    pts[i*3] = r * Math.sin(t) * Math.cos(p);
    pts[i*3+1] = r * Math.sin(t) * Math.sin(p);
    pts[i*3+2] = r * Math.cos(t);
  }
  return pts;
};

// --- NEW SHAPES 45-54 ---

const generateCyberDisc = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const layer = i % 4;
    const r = 0.3 + layer * 0.15;
    const t = (i / PARTICLE_COUNT) * Math.PI * 2 * 4;
    pts[i*3] = Math.cos(t) * r;
    pts[i*3+1] = Math.sin(t) * r;
    pts[i*3+2] = (Math.random() - 0.5) * 0.05;
  }
  return pts;
};

const generateMobiusStrip = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = (i / PARTICLE_COUNT) * Math.PI * 2;
    const v = (Math.random() - 0.5) * 0.4;
    pts[i*3] = (1 + v * Math.cos(u / 2)) * Math.cos(u) * 0.8;
    pts[i*3+1] = (1 + v * Math.cos(u / 2)) * Math.sin(u) * 0.8;
    pts[i*3+2] = v * Math.sin(u / 2) * 0.8;
  }
  return pts;
};

const generateVoronoiShell = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const phi = Math.random() * Math.PI * 2, theta = Math.random() * Math.PI;
    const r = 0.7 + Math.sin(phi * 5) * Math.cos(theta * 5) * 0.1;
    pts[i*3] = r * Math.sin(theta) * Math.cos(phi);
    pts[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
    pts[i*3+2] = r * Math.cos(theta);
  }
  return pts;
};

const generateBinaryPillar = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % 8;
    pts[i*3] = (col - 4) * 0.18;
    pts[i*3+1] = (Math.random() * 1.6) - 0.8;
    pts[i*3+2] = (Math.random() - 0.5) * 0.2;
    if (Math.random() > 0.95) pts[i*3+1] = 100; // Fake "glitch" out of view
  }
  return pts;
};

const generateMagneticField = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT);
    const angle = t * Math.PI * 2;
    const loop = (i % 5) * 0.2;
    pts[i*3] = Math.sin(angle) * (0.3 + loop);
    pts[i*3+1] = Math.cos(angle) * (0.6 + loop);
    pts[i*3+2] = Math.sin(angle * 2) * 0.3;
  }
  return pts;
};

const generateHelixSphere = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = i / PARTICLE_COUNT;
    const phi = t * Math.PI * 20;
    const theta = t * Math.PI;
    const r = 0.7;
    pts[i*3] = r * Math.sin(theta) * Math.cos(phi);
    pts[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
    pts[i*3+2] = r * Math.cos(theta);
  }
  return pts;
};

const generatePulsarCore = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.4) {
      const r = Math.random() * 0.2;
      const p = Math.random() * Math.PI * 2;
      pts[i*3] = Math.cos(p) * r; pts[i*3+1] = Math.sin(p) * r; pts[i*3+2] = (Math.random()-0.5)*0.2;
    } else {
      const jet = i % 2 === 0 ? 1 : -1;
      const t = Math.random() * 1.5;
      pts[i*3] = (Math.random() - 0.5) * 0.05;
      pts[i*3+1] = jet * t;
      pts[i*3+2] = (Math.random() - 0.5) * 0.05;
    }
  }
  return pts;
};

const generateDigitalWeb = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const nodes = Array.from({ length: 20 }, () => new THREE.Vector3((Math.random()-0.5)*1.5, (Math.random()-0.5)*1.2, (Math.random()-0.5)*1.2));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const n1 = nodes[i % nodes.length];
    const n2 = nodes[(i + 1) % nodes.length];
    const t = Math.random();
    pts[i*3] = THREE.MathUtils.lerp(n1.x, n2.x, t);
    pts[i*3+1] = THREE.MathUtils.lerp(n1.y, n2.y, t);
    pts[i*3+2] = THREE.MathUtils.lerp(n1.z, n2.z, t);
  }
  return pts;
};

const generateExplodedCube = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const face = i % 6;
    const r = 0.6 + Math.random() * 0.4;
    let x=0, y=0, z=0;
    if (face === 0) { x=r; y=(Math.random()-0.5); z=(Math.random()-0.5); }
    else if (face === 1) { x=-r; y=(Math.random()-0.5); z=(Math.random()-0.5); }
    else if (face === 2) { y=r; x=(Math.random()-0.5); z=(Math.random()-0.5); }
    else if (face === 3) { y=-r; x=(Math.random()-0.5); z=(Math.random()-0.5); }
    else if (face === 4) { z=r; x=(Math.random()-0.5); y=(Math.random()-0.5); }
    else { z=-r; x=(Math.random()-0.5); y=(Math.random()-0.5); }
    pts[i*3]=x; pts[i*3+1]=y; pts[i*3+2]=z;
  }
  return pts;
};

const generateCloverKnot = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 2;
    pts[i*3] = (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.3;
    pts[i*3+1] = (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.3;
    pts[i*3+2] = -Math.sin(3 * t) * 0.3;
  }
  return pts;
};

// --- NEW SHAPES 55-64 (The additional 10) ---

const generateKleinBottle = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = (i / PARTICLE_COUNT) * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    let x, y, z;
    if (u < Math.PI) {
      x = 6 * Math.cos(u) * (1 + Math.sin(u)) + 4 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v);
      y = 16 * Math.sin(u) + 4 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
    } else {
      x = 6 * Math.cos(u) * (1 + Math.sin(u)) + 4 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI);
      y = 16 * Math.sin(u);
    }
    z = 4 * (1 - Math.cos(u) / 2) * Math.sin(v);
    pts[i*3] = x * 0.05; pts[i*3+1] = y * 0.05; pts[i*3+2] = z * 0.05;
  }
  return pts;
};

const generateHyperboloid = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const z = (i / PARTICLE_COUNT) * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = 0.4 * Math.sqrt(1 + z * z);
    pts[i*3] = r * Math.cos(theta);
    pts[i*3+1] = z * 0.8;
    pts[i*3+2] = r * Math.sin(theta);
  }
  return pts;
};

const generateFractalTree = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const nodes: THREE.Vector3[] = [new THREE.Vector3(0, -0.8, 0)];
  const stack: { p: THREE.Vector3, dir: THREE.Vector3, len: number, depth: number }[] = [{ 
    p: new THREE.Vector3(0, -0.8, 0), 
    dir: new THREE.Vector3(0, 1, 0), 
    len: 0.4, 
    depth: 0 
  }];
  
  while (stack.length > 0 && nodes.length < 100) {
    const { p, dir, len, depth } = stack.pop()!;
    if (depth > 5) continue;
    const nextP = p.clone().add(dir.clone().multiplyScalar(len));
    nodes.push(nextP);
    
    const count = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < count; j++) {
      const nextDir = dir.clone().applyAxisAngle(new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), 0.5 + Math.random() * 0.5);
      stack.push({ p: nextP, dir: nextDir, len: len * 0.7, depth: depth + 1 });
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const n1 = nodes[i % nodes.length];
    const n2 = nodes[(i + 1) % nodes.length];
    const t = Math.random();
    pts[i*3] = THREE.MathUtils.lerp(n1.x, n2.x, t);
    pts[i*3+1] = THREE.MathUtils.lerp(n1.y, n2.y, t);
    pts[i*3+2] = THREE.MathUtils.lerp(n1.z, n2.z, t);
  }
  return pts;
};

const generateGalacticSpiral = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const arms = 4;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const arm = i % arms;
    const t = Math.random();
    const angle = t * Math.PI * 4 + (arm * Math.PI * 2) / arms;
    const r = t * 1.2;
    const spread = (1 - t) * 0.2;
    pts[i*3] = Math.cos(angle) * r + (Math.random() - 0.5) * spread;
    pts[i*3+1] = (Math.random() - 0.5) * 0.1 * (1 - t);
    pts[i*3+2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread;
  }
  return pts;
};

const generateCalyx = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 2;
    const petals = 5;
    const r = Math.sin(t * petals) * 0.4 + 0.5;
    const h = Math.cos(t * petals) * 0.2 + t * 0.1;
    pts[i*3] = Math.cos(t) * r;
    pts[i*3+1] = h - 0.4;
    pts[i*3+2] = Math.sin(t) * r;
  }
  return pts;
};

const generateGyroid = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  let count = 0;
  while (count < PARTICLE_COUNT) {
    const x = (Math.random() - 0.5) * Math.PI * 2;
    const y = (Math.random() - 0.5) * Math.PI * 2;
    const z = (Math.random() - 0.5) * Math.PI * 2;
    const val = Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x);
    if (Math.abs(val) < 0.1) {
      pts[count*3] = x * 0.25; pts[count*3+1] = y * 0.25; pts[count*3+2] = z * 0.25;
      count++;
    }
  }
  return pts;
};

const generateSierpinskiCube = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const corners = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
  ];
  let curr = [0,0,0];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const target = corners[Math.floor(Math.random() * 8)];
    curr[0] = (curr[0] + target[0]) / 3;
    curr[1] = (curr[1] + target[1]) / 3;
    curr[2] = (curr[2] + target[2]) / 3;
    pts[i*3] = curr[0] * 1.5; pts[i*3+1] = curr[1] * 1.5; pts[i*3+2] = curr[2] * 1.5;
  }
  return pts;
};

const generateNautilusShell = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 8;
    const r = 0.1 * Math.exp(0.15 * t);
    const theta = Math.random() * Math.PI * 2;
    const ringR = r * 0.2;
    pts[i*3] = (r + ringR * Math.cos(theta)) * Math.cos(t) * 0.4;
    pts[i*3+1] = ringR * Math.sin(theta) * 0.4;
    pts[i*3+2] = (r + ringR * Math.cos(theta)) * Math.sin(t) * 0.4;
  }
  return pts;
};

const generateRibbonKnot = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (i / PARTICLE_COUNT) * Math.PI * 2;
    const x = Math.sin(t) + 2 * Math.sin(2 * t);
    const y = Math.cos(t) - 2 * Math.cos(2 * t);
    const z = -Math.sin(3 * t);
    const off = (Math.random() - 0.5) * 0.15;
    pts[i*3] = (x + off) * 0.3; pts[i*3+1] = (y + off) * 0.3; pts[i*3+2] = (z + off) * 0.3;
  }
  return pts;
};

const generateDataFountain = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sin(t * Math.PI) * 0.4;
    pts[i*3] = Math.cos(angle) * r;
    pts[i*3+1] = (t * 2 - 1) * 0.8;
    pts[i*3+2] = Math.sin(angle) * r;
  }
  return pts;
};

// --- Periodic LORDx Assembly ---
const generateLORDx = () => {
  const pts = new Float32Array(PARTICLE_COUNT * 3);
  const s: { start?: THREE.Vector3, end?: THREE.Vector3, isCurve?: boolean, center?: THREE.Vector3, radius?: number, startA?: number, endA?: number }[] = [];
  s.push({ start: new THREE.Vector3(-1.4, 0.5, 0), end: new THREE.Vector3(-1.4, -0.5, 0) });
  s.push({ start: new THREE.Vector3(-1.4, -0.5, 0), end: new THREE.Vector3(-1.0, -0.5, 0) });
  s.push({ isCurve: true, center: new THREE.Vector3(-0.5, 0, 0), radius: 0.4, startA: 0, endA: Math.PI * 2 });
  s.push({ start: new THREE.Vector3(0.2, 0.5, 0), end: new THREE.Vector3(0.2, -0.5, 0) });
  s.push({ isCurve: true, center: new THREE.Vector3(0.2, 0.25, 0), radius: 0.25, startA: -Math.PI/2, endA: Math.PI/2 });
  s.push({ start: new THREE.Vector3(0.2, 0, 0), end: new THREE.Vector3(0.6, -0.5, 0) });
  s.push({ start: new THREE.Vector3(0.9, 0.5, 0), end: new THREE.Vector3(0.9, -0.5, 0) });
  s.push({ isCurve: true, center: new THREE.Vector3(0.9, 0, 0), radius: 0.5, startA: -Math.PI/2, endA: Math.PI/2 });
  s.push({ start: new THREE.Vector3(1.6, 0.2, 0), end: new THREE.Vector3(2.0, -0.2, 0) });
  s.push({ start: new THREE.Vector3(2.0, 0.2, 0), end: new THREE.Vector3(1.6, -0.2, 0) });

  const per = Math.floor(PARTICLE_COUNT / s.length);
  let count = 0;
  s.forEach(seg => {
    for (let i = 0; i < per; i++) {
      if (count >= PARTICLE_COUNT) break;
      const t = i / per;
      // 3D volumetric effect: randomize Z coordinate per segment/particle
      const zDepth = (Math.random() - 0.5) * 0.25;
      
      if (seg.isCurve) {
        const a = seg.startA! + t * (seg.endA! - seg.startA!);
        pts[count*3] = seg.center!.x + Math.cos(a)*seg.radius!;
        pts[count*3+1] = seg.center!.y + Math.sin(a)*seg.radius!;
        pts[count*3+2] = zDepth;
      } else {
        pts[count*3] = THREE.MathUtils.lerp(seg.start!.x, seg.end!.x, t);
        pts[count*3+1] = THREE.MathUtils.lerp(seg.start!.y, seg.end!.y, t);
        pts[count*3+2] = zDepth;
      }
      count++;
    }
  });
  return pts;
};

// --- Sub-Components ---

const HandParticles: React.FC<{ 
  hand: HandState, 
  otherHand: HandState,
  color: string,
  shapes: Float32Array[],
  isShowingText: boolean,
  textShape: Float32Array
}> = ({ hand, otherHand, color, shapes, isShowingText, textShape }) => {
  const meshRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const particlesPosition = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const lerpSpeeds = useMemo(() => new Float32Array(PARTICLE_COUNT).map(() => 0.07 + Math.random() * 0.08), []);
  const shimmerValue = useRef(0);
  const prevIsFist = useRef(false);

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return;
    const posAttr = meshRef.current.geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    if (hand.isFist && !prevIsFist.current) shimmerValue.current = 1.0;
    prevIsFist.current = hand.isFist;
    shimmerValue.current = Math.max(0, shimmerValue.current - delta * 2.5);

    matRef.current.size = 0.014 * (1.0 + shimmerValue.current * 1.5);
    matRef.current.opacity = 0.85 + shimmerValue.current * 0.15;

    meshRef.current.position.x += (hand.position.x - meshRef.current.position.x) * 0.15;
    meshRef.current.position.y += (hand.position.y - meshRef.current.position.y) * 0.15;
    meshRef.current.position.z += (hand.position.z - meshRef.current.position.z) * 0.15;
    meshRef.current.rotation.y += delta * 0.4;

    if (!hand.isActive) { meshRef.current.visible = false; return; }
    meshRef.current.visible = true;

    if (hand.isFist) {
      const target = shapes[hand.shapeIndex % shapes.length];
      if (target) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const s = lerpSpeeds[i];
          pos[i * 3] += (target[i * 3] - pos[i * 3]) * s;
          pos[i * 3 + 1] += (target[i * 3 + 1] - pos[i * 3 + 1]) * s;
          pos[i * 3 + 2] += (target[i * 3 + 2] - pos[i * 3 + 2]) * s;
        }
      }
    } else if (isShowingText) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const s = lerpSpeeds[i] * 1.5;
        pos[i * 3] += (textShape[i * 3] - pos[i * 3]) * s;
        pos[i * 3 + 1] += (textShape[i * 3 + 1] - pos[i * 3 + 1]) * s;
        pos[i * 3 + 2] += (textShape[i * 3 + 2] - pos[i * 3 + 2]) * s;
      }
    } else {
      const dist = Math.sqrt(Math.pow(hand.position.x - otherHand.position.x, 2) + Math.pow(hand.position.y - otherHand.position.y, 2));
      const spread = otherHand.isActive && !otherHand.isFist ? 1.0 + Math.min(dist * 0.5, 3.0) : 1.0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const seed = i * 0.42;
        const tx = Math.sin(seed + time * 0.35) * 1.8 * spread;
        const ty = Math.cos(seed * 0.85 + time * 0.45) * 1.8 * spread;
        const tz = Math.sin(seed * 1.15 + time * 0.25) * 1.2;
        
        // Subtle ambient drift movement
        const driftX = Math.sin(time * 0.15 + seed * 2) * 0.15;
        const driftY = Math.cos(time * 0.2 + seed * 3) * 0.15;
        const driftZ = Math.sin(time * 0.1 + seed * 1.5) * 0.15;
        
        pos[i * 3] += (tx + driftX - pos[i * 3]) * 0.05;
        pos[i * 3 + 1] += (ty + driftY - pos[i * 3 + 1]) * 0.05;
        pos[i * 3 + 2] += (tz + driftZ - pos[i * 3 + 2]) * 0.05;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={particlesPosition} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.014} color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation={true} />
    </points>
  );
};

export const HologramScene: React.FC<HologramSceneProps> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isShowingText, setIsShowingText] = useState(false);
  
  const shapes = useMemo(() => {
    const list = [];
    list.push(getMeshPoints(new THREE.IcosahedronGeometry(0.7, 1)));
    list.push(getMeshPoints(new THREE.TorusGeometry(0.6, 0.1, 8, 32)));
    list.push(getMeshPoints(new THREE.BoxGeometry(0.8, 0.8, 0.8, 6, 6, 6)));
    list.push(getMeshPoints(new THREE.DodecahedronGeometry(0.8, 0)));
    list.push(generateCrystalline());
    list.push(generateOrbitingRings());
    list.push(getMeshPoints(new THREE.TorusKnotGeometry(0.5, 0.12, 128, 16)));
    list.push(generateDoubleHelix());
    list.push(generateMechanical());
    list.push(generateFractalLattice());
    list.push(generateSacredGeometry());
    list.push(getMeshPoints(new THREE.SphereGeometry(0.7, 32, 32)));
    list.push(generateVortex());
    list.push(generateMolecule());
    list.push(generateCityscape());
    list.push(getMeshPoints(new THREE.CapsuleGeometry(0.4, 0.8, 8, 32)));
    list.push(getMeshPoints(new THREE.OctahedronGeometry(0.8, 2)));
    list.push(generateTesseract());
    list.push(generateNeuralNetwork());
    list.push(generateDigitalSingularity());
    list.push(generateCyberEye());
    list.push(generateCrystallineFlower());
    list.push(generateInterferenceWave());
    list.push(generateVoxelMonolith());
    list.push(generateRibbonSpiral());
    list.push(generateGeometricGeode());
    list.push(generateQuantumEntanglement());
    list.push(generateStarGate());
    list.push(generatePyramidFractal());
    list.push(generateDNALattice());
    list.push(generateSupernova());
    list.push(generateHyperCore());
    list.push(generateSpikyUrchin());
    list.push(generateDataStream());
    list.push(generateWarpTunnel());
    list.push(generateFloatingIslands());
    list.push(generateAuraShield());
    // 40-44 Re-use or variations
    list.push(generateCrystalline());
    list.push(generateOrbitingRings());
    list.push(generateDoubleHelix());
    list.push(generateMechanical());
    list.push(generateFractalLattice());
    // 45-54 
    list.push(generateCyberDisc());
    list.push(generateMobiusStrip());
    list.push(generateVoronoiShell());
    list.push(generateBinaryPillar());
    list.push(generateMagneticField());
    list.push(generateHelixSphere());
    list.push(generatePulsarCore());
    list.push(generateDigitalWeb());
    list.push(generateExplodedCube());
    list.push(generateCloverKnot());
    // 55-64 NEW 3D SHAPES
    list.push(generateKleinBottle());
    list.push(generateHyperboloid());
    list.push(generateFractalTree());
    list.push(generateGalacticSpiral());
    list.push(generateCalyx());
    list.push(generateGyroid());
    list.push(generateSierpinskiCube());
    list.push(generateNautilusShell());
    list.push(generateRibbonKnot());
    list.push(generateDataFountain());
    return list;
  }, []);

  const textShape = useMemo(() => generateLORDx(), []);

  useEffect(() => {
    const trigger = () => {
      const delay = 15000 + Math.random() * 30000;
      setTimeout(() => {
        setIsShowingText(true);
        setTimeout(() => { setIsShowingText(false); trigger(); }, 3000);
      }, delay);
    };
    trigger();
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = appState.cameraOrbit * 0.5;
      groupRef.current.rotation.x = -Math.abs(appState.cameraOrbit) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <HandParticles hand={appState.leftHand} otherHand={appState.rightHand} color="#00eeff" shapes={shapes} isShowingText={isShowingText} textShape={textShape} />
      <HandParticles hand={appState.rightHand} otherHand={appState.leftHand} color="#00eeff" shapes={shapes} isShowingText={isShowingText} textShape={textShape} />
    </group>
  );
};
