'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  CameraVisionMapping,
  DEFAULT_FSD_VISION_CONFIG,
  FacilityMarker,
  FsdVisionSettingsConfig,
  getDefaultCameraVisionMapping,
} from '@/lib/markers';
import { UnifiSettingsConfig } from '@/components/ui/SettingsDrawer';

interface CameraSpatialVisionProps {
  enabled: boolean;
  markers: FacilityMarker[];
  unifiConfig?: UnifiSettingsConfig;
  fsdConfig?: FsdVisionSettingsConfig;
  isCalibrating?: boolean;
  selectedCameraId?: string;
  onSelectCameraId?: (camId: string) => void;
  onUpdateCameraMarker?: (updated: FacilityMarker) => void;
  clickGroundToPlaceZone?: boolean;
  testPreviewPoint?: {
    cameraId: string;
    u: number;
    v: number;
  } | null;
  onReportRawDetections?: (
    byCamera: Record<
      string,
      { u: number; v: number; label: string; confidence: number }[]
    >
  ) => void;
}

export type DetectedKind3D = 'person' | 'vehicle' | 'forklift';

export interface TrackedEntity3D {
  id: string;
  kind: DetectedKind3D;
  label: string;
  confidence: number;
  cameraId: string;
  cameraName: string;
  targetPos: [number, number]; // [X, Z] in 3D warehouse ground coordinates
  currentPos: [number, number]; // Smoothly interpolated [X, Z]
  velocity: [number, number]; // [vx, vz] in m/s
  speedMph: number;
  isMoving: boolean;
  rotationY: number;
  variant?: 'sedan' | 'van';
  lastSeenAt: number;
}

interface RawCameraDetection {
  kind: DetectedKind3D;
  label: string;
  confidence: number;
  cameraId: string;
  cameraName: string;
  u: number;
  v: number;
  worldX: number;
  worldZ: number;
  defaultRotY: number;
  isMoving: boolean;
  isMotionFallback: boolean;
  variant?: 'sedan' | 'van';
}

const FLOOR_Y = -1.66;

/**
 * Projects a 2D bounding-box footpoint (u, v in [0..1]) into the camera's
 * configurable 3D exterior ground zone (zoneCenterX, zoneCenterZ, zoneWidth, zoneDepth, rotationDeg).
 */
export function projectCameraFootpointWithMapping(
  mapping: CameraVisionMapping,
  u: number,
  v: number,
  ignoreCutoffs = false
): { worldX: number; worldZ: number; defaultRotY: number } | null {
  if (!mapping.enabled && !ignoreCutoffs) return null;

  const horizonV = Math.max(0.05, Math.min(0.85, mapping.horizonCutoffPct / 100));
  if (!ignoreCutoffs && v < horizonV) {
    // Above the configured horizon cutoff (sky, roof, trees)
    return null;
  }

  // Check if (u, v) falls inside any user-suppressed static false-positive region
  if (!ignoreCutoffs && mapping.ignoredRegions && mapping.ignoredRegions.length > 0) {
    for (const reg of mapping.ignoredRegions) {
      if (Math.hypot(u - reg.u, v - reg.v) <= reg.radius) {
        return null;
      }
    }
  }

  // Normalize u in [0..1] and v in [horizonV..1] -> [0..1]
  const normU = mapping.flipHorizontal ? 1 - u : u;
  const rawNormV = THREE.MathUtils.clamp((v - horizonV) / (1 - horizonV), 0, 1);
  // In a camera image, v=1 is the bottom (NEAR the camera) and v=horizonV is the top (FAR from the camera)
  const depthFromNearToFar = mapping.flipDepth ? rawNormV : 1 - rawNormV;

  // Local coordinates inside the camera's ground zone:
  // localX: -zoneWidth/2 (left of frame) to +zoneWidth/2 (right of frame)
  // localZ: -zoneDepth/2 (near edge) to +zoneDepth/2 (far horizon edge)
  const localX = (normU - 0.5) * mapping.zoneWidth;
  const localZ = (depthFromNearToFar - 0.5) * mapping.zoneDepth;

  const rad = (mapping.rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  const worldX = mapping.zoneCenterX + localX * cosR - localZ * sinR;
  const worldZ = mapping.zoneCenterZ + localX * sinR + localZ * cosR;

  // Push any point that accidentally lands inside the interior building footprint [-5.8..5.8, -8.5..8.2]
  // out to the nearest exterior wall apron so exterior camera detections never spawn inside the racks
  let clampedX = worldX;
  let clampedZ = worldZ;
  if (
    clampedX > -5.8 &&
    clampedX < 5.8 &&
    clampedZ > -8.5 &&
    clampedZ < 8.2
  ) {
    const distEast = Math.abs(5.8 - clampedX);
    const distWest = Math.abs(-5.8 - clampedX);
    const distNorth = Math.abs(8.2 - clampedZ);
    const distSouth = Math.abs(-8.5 - clampedZ);
    const minDist = Math.min(distEast, distWest, distNorth, distSouth);
    if (minDist === distNorth) clampedZ = 8.9;
    else if (minDist === distSouth) clampedZ = -9.1;
    else if (minDist === distEast) clampedX = 6.6;
    else clampedX = -6.6;
  }

  return {
    worldX: clampedX,
    worldZ: clampedZ,
    defaultRotY: -rad,
  };
}

/**
 * Renders the 3D ground projection rectangle for a camera with color-coded video edges
 * (Green = Bottom/Near of video, Amber = Top/Horizon of video, Blue = Left, Purple = Right)
 * and direct in-scene calibration buttons so no sliders are needed.
 */
function CameraCoverageZone3D({
  cam,
  mapping,
  isSelected,
  isCalibrating,
  onSelect,
  onUpdateMapping,
}: {
  cam: FacilityMarker;
  mapping: CameraVisionMapping;
  isSelected: boolean;
  isCalibrating: boolean;
  onSelect?: () => void;
  onUpdateMapping?: (patch: Partial<CameraVisionMapping>) => void;
}) {
  if (!mapping.enabled) return null;
  const rad = (mapping.rotationDeg * Math.PI) / 180;

  const nearZ = (mapping.flipDepth ? 0.5 : -0.5) * mapping.zoneDepth;
  const farZ = (mapping.flipDepth ? -0.5 : 0.5) * mapping.zoneDepth;
  const leftX = (mapping.flipHorizontal ? 0.5 : -0.5) * mapping.zoneWidth;
  const rightX = (mapping.flipHorizontal ? -0.5 : 0.5) * mapping.zoneWidth;

  return (
    <group>
      {/* Sightline tether from the physical 3D camera pin on the building to the zone center */}
      <Line
        points={[
          [cam.position[0], cam.position[1], cam.position[2]],
          [mapping.zoneCenterX, FLOOR_Y + 0.08, mapping.zoneCenterZ],
        ]}
        color={isSelected ? '#22d3ee' : '#0284c7'}
        lineWidth={isSelected ? 2.2 : 1.2}
        dashed
        dashScale={2}
        dashSize={0.5}
        gapSize={0.3}
      />

      <group
        position={[mapping.zoneCenterX, FLOOR_Y + 0.02, mapping.zoneCenterZ]}
        rotation={[0, -rad, 0]}
      >
        {/* Translucent Ground Zone Rectangle */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            if (onSelect) {
              e.stopPropagation();
              onSelect();
            }
          }}
        >
          <planeGeometry args={[mapping.zoneWidth, mapping.zoneDepth]} />
          <meshBasicMaterial
            color={isSelected ? '#0ea5e9' : '#0284c7'}
            transparent
            opacity={isSelected ? 0.22 : 0.09}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
          <Edges
            threshold={1}
            color={isSelected ? '#38bdf8' : '#0369a1'}
          />
        </mesh>

        {/* GREEN Edge = BOTTOM OF VIDEO (NEAR CAMERA) */}
        <mesh
          position={[0, 0.015, nearZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[mapping.zoneWidth, 0.28]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={isSelected ? 0.9 : 0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* AMBER Edge = TOP HORIZON OF VIDEO (FAR FROM CAMERA) */}
        <mesh
          position={[0, 0.015, farZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[mapping.zoneWidth, 0.24]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={isSelected ? 0.85 : 0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* BLUE Edge = LEFT OF VIDEO */}
        <mesh
          position={[leftX, 0.015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.24, mapping.zoneDepth]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={isSelected ? 0.85 : 0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* PURPLE Edge = RIGHT OF VIDEO */}
        <mesh
          position={[rightX, 0.015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.24, mapping.zoneDepth]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={isSelected ? 0.85 : 0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Edge Labels when Selected so user sees exact correspondence to camera video */}
        {isSelected && (
          <>
            <Html
              position={[0, 0.15, nearZ]}
              center
              distanceFactor={19}
              zIndexRange={[12, 0]}
            >
              <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-[8.5px] font-mono font-bold text-emerald-300 whitespace-nowrap shadow">
                ▼ VIDEO BOTTOM (NEAR)
              </div>
            </Html>
            <Html
              position={[0, 0.15, farZ]}
              center
              distanceFactor={19}
              zIndexRange={[12, 0]}
            >
              <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-amber-950/90 border border-amber-400 text-[8.5px] font-mono font-bold text-amber-300 whitespace-nowrap shadow">
                ▲ VIDEO HORIZON (FAR)
              </div>
            </Html>
            <Html
              position={[leftX, 0.15, 0]}
              center
              distanceFactor={19}
              zIndexRange={[12, 0]}
            >
              <div className="pointer-events-none select-none px-1.5 py-0.5 rounded bg-blue-950/90 border border-blue-400 text-[8.5px] font-mono font-bold text-blue-300 whitespace-nowrap shadow">
                ◀ VIDEO LEFT
              </div>
            </Html>
            <Html
              position={[rightX, 0.15, 0]}
              center
              distanceFactor={19}
              zIndexRange={[12, 0]}
            >
              <div className="pointer-events-none select-none px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-400 text-[8.5px] font-mono font-bold text-purple-300 whitespace-nowrap shadow">
                VIDEO RIGHT ▶
              </div>
            </Html>
          </>
        )}

        {/* Center Floating Interactive Badge */}
        <Html
          position={[0, 0.35, 0]}
          center
          distanceFactor={17}
          zIndexRange={[15, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`select-none px-2.5 py-1.5 rounded-xl border text-[9.5px] font-mono shadow-xl transition cursor-pointer whitespace-nowrap ${
              isSelected
                ? 'bg-slate-950/95 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/30'
                : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:border-sky-400'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between gap-2">
              <span>📹 {cam.name} Zone</span>
              {isSelected && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[8px]">
                  ACTIVE
                </span>
              )}
            </div>

            {/* Direct On-Ground 3D Controls when calibrating */}
            {isCalibrating && isSelected && onUpdateMapping && (
              <div
                className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center gap-1 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMapping({
                      rotationDeg: ((mapping.rotationDeg - 45 + 540) % 360) - 180,
                    })
                  }
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 font-bold cursor-pointer"
                  title="Rotate Zone 45° Counter-Clockwise"
                >
                  ↺ 45°
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMapping({
                      rotationDeg: ((mapping.rotationDeg + 45 + 540) % 360) - 180,
                    })
                  }
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 font-bold cursor-pointer"
                  title="Rotate Zone 45° Clockwise"
                >
                  45° ↻
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMapping({
                      flipHorizontal: !mapping.flipHorizontal,
                    })
                  }
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                    mapping.flipHorizontal
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Flip Left / Right"
                >
                  ⇄ L/R
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMapping({
                      flipDepth: !mapping.flipDepth,
                    })
                  }
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                    mapping.flipDepth
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Swap Near / Far Edges"
                >
                  ⇅ Near/Far
                </button>
              </div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
}

/**
 * Extracts moving foreground bounding boxes by comparing the current frame
 * against the previous frame on an offscreen 160x90 grid.
 */
function detectMovingBlobs(
  currData: Uint8ClampedArray,
  prevData: Uint8ClampedArray,
  width: number,
  height: number
): { u: number; v: number; w: number; h: number; motionPixels: number }[] {
  const gridCols = 32;
  const gridRows = 18;
  const cellW = Math.floor(width / gridCols);
  const cellH = Math.floor(height / gridRows);
  const activeCells = new Uint8Array(gridCols * gridRows);
  const startRow = 2;

  for (let r = startRow; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      let diffCount = 0;
      for (let y = r * cellH; y < (r + 1) * cellH; y++) {
        for (let x = c * cellW; x < (c + 1) * cellW; x++) {
          const idx = (y * width + x) * 4;
          const d =
            (Math.abs(currData[idx] - prevData[idx]) +
              Math.abs(currData[idx + 1] - prevData[idx + 1]) +
              Math.abs(currData[idx + 2] - prevData[idx + 2])) /
            3;
          if (d > 30) diffCount++;
        }
      }
      if (diffCount > cellW * cellH * 0.28) {
        activeCells[r * gridCols + c] = 1;
      }
    }
  }

  const visited = new Uint8Array(gridCols * gridRows);
  const blobs: {
    u: number;
    v: number;
    w: number;
    h: number;
    motionPixels: number;
  }[] = [];

  for (let r = startRow; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const startIdx = r * gridCols + c;
      if (!activeCells[startIdx] || visited[startIdx]) continue;

      let minR = r;
      let maxR = r;
      let minC = c;
      let maxC = c;
      let count = 0;
      const queue = [startIdx];
      visited[startIdx] = 1;

      while (queue.length > 0) {
        const curr = queue.pop()!;
        const cr = Math.floor(curr / gridCols);
        const cc = curr % gridCols;
        count++;
        if (cr < minR) minR = cr;
        if (cr > maxR) maxR = cr;
        if (cc < minC) minC = cc;
        if (cc > maxC) maxC = cc;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (
              nr >= startRow &&
              nr < gridRows &&
              nc >= 0 &&
              nc < gridCols
            ) {
              const nIdx = nr * gridCols + nc;
              if (activeCells[nIdx] && !visited[nIdx]) {
                visited[nIdx] = 1;
                queue.push(nIdx);
              }
            }
          }
        }
      }

      if (count >= 3 && count <= gridCols * gridRows * 0.35) {
        const u = ((minC + maxC + 1) / 2) / gridCols;
        const v = (maxR + 1) / gridRows;
        const w = (maxC - minC + 1) / gridCols;
        const h = (maxR - minR + 1) / gridRows;
        blobs.push({ u, v, w, h, motionPixels: count });
      }
    }
  }

  return blobs;
}

function GhostMeshMaterial({
  opacity = 0.38,
  bright = false,
}: {
  opacity?: number;
  bright?: boolean;
}) {
  return (
    <meshStandardMaterial
      color={bright ? '#7dd3fc' : '#38bdf8'}
      emissive={bright ? '#0ea5e9' : '#0284c7'}
      emissiveIntensity={bright ? 1.2 : 0.78}
      transparent
      opacity={opacity}
      roughness={0.2}
      metalness={0.1}
      depthWrite={false}
    />
  );
}

function FsdGroundFootprint({
  width,
  length,
  speedVector = 0,
  pulse = false,
}: {
  width: number;
  length: number;
  speedVector?: number;
  pulse?: boolean;
}) {
  const color = pulse ? '#22d3ee' : '#38bdf8';
  return (
    <group position={[0, 0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={pulse ? 0.24 : 0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <Edges threshold={1} color="#7dd3fc" />
      </mesh>

      {speedVector > 0.15 && (
        <group position={[0, 0.01, length / 2 + speedVector / 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, speedVector]} />
            <meshBasicMaterial
              color="#7dd3fc"
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function GhostForklift3D({ isMoving }: { isMoving: boolean }) {
  return (
    <group>
      <FsdGroundFootprint
        width={1.25}
        length={2.1}
        speedVector={isMoving ? 1.5 : 0}
        pulse={isMoving}
      />
      <mesh position={[0, 0.34, -0.1]}>
        <boxGeometry args={[0.92, 0.5, 1.32]} />
        <GhostMeshMaterial opacity={0.44} bright={isMoving} />
        <Edges threshold={15} color="#7dd3fc" />
      </mesh>
      <mesh position={[0, 0.85, -0.15]}>
        <boxGeometry args={[0.82, 0.56, 0.82]} />
        <GhostMeshMaterial opacity={0.2} bright={isMoving} />
        <Edges threshold={12} color="#bae6fd" />
      </mesh>
      <mesh position={[0, 0.74, 0.62]}>
        <boxGeometry args={[0.6, 1.28, 0.09]} />
        <GhostMeshMaterial opacity={0.45} bright={isMoving} />
        <Edges threshold={15} color="#7dd3fc" />
      </mesh>
      <mesh position={[-0.22, 0.16, 1.02]}>
        <boxGeometry args={[0.1, 0.04, 0.78]} />
        <GhostMeshMaterial opacity={0.6} bright />
      </mesh>
      <mesh position={[0.22, 0.16, 1.02]}>
        <boxGeometry args={[0.1, 0.04, 0.78]} />
        <GhostMeshMaterial opacity={0.6} bright />
      </mesh>
    </group>
  );
}

function GhostVehicle3D({
  variant = 'sedan',
  isMoving = false,
}: {
  variant?: 'sedan' | 'van';
  isMoving?: boolean;
}) {
  const isVan = variant === 'van';
  return (
    <group>
      <FsdGroundFootprint
        width={1.75}
        length={isVan ? 3.8 : 3.3}
        speedVector={isMoving ? 2.0 : 0}
        pulse={isMoving}
      />
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.48, 0.48, isVan ? 3.4 : 2.95]} />
        <GhostMeshMaterial opacity={0.38} bright={isMoving} />
        <Edges threshold={15} color="#7dd3fc" />
      </mesh>
      <mesh position={[0, isVan ? 0.92 : 0.82, isVan ? -0.15 : -0.1]}>
        <boxGeometry args={[1.32, isVan ? 0.58 : 0.42, isVan ? 2.45 : 1.55]} />
        <GhostMeshMaterial opacity={0.26} bright={isMoving} />
        <Edges threshold={15} color="#bae6fd" />
      </mesh>
      {[
        [-0.74, 0.22, isVan ? 1.05 : 0.92],
        [0.74, 0.22, isVan ? 1.05 : 0.92],
        [-0.74, 0.22, isVan ? -1.05 : -0.92],
        [0.74, 0.22, isVan ? -1.05 : -0.92],
      ].map(([wx, wy, wz], idx) => (
        <mesh
          key={idx}
          position={[wx, wy, wz]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
          <GhostMeshMaterial opacity={0.52} bright />
          <Edges threshold={20} color="#e0f2fe" />
        </mesh>
      ))}
    </group>
  );
}

function GhostPerson3D({ isMoving }: { isMoving: boolean }) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const swing = isMoving ? Math.sin(clock.getElapsedTime() * 5.2) * 0.45 : 0;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;
  });

  return (
    <group>
      <FsdGroundFootprint
        width={0.62}
        length={0.62}
        speedVector={isMoving ? 0.85 : 0}
        pulse={isMoving}
      />
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.11, 14, 14]} />
        <GhostMeshMaterial opacity={0.55} bright />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.28, 0.44, 0.16]} />
        <GhostMeshMaterial opacity={0.46} bright={isMoving} />
        <Edges threshold={15} color="#7dd3fc" />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.2, 0.88, 0]}>
        <boxGeometry args={[0.08, 0.38, 0.08]} />
        <GhostMeshMaterial opacity={0.4} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.2, 0.88, 0]}>
        <boxGeometry args={[0.08, 0.38, 0.08]} />
        <GhostMeshMaterial opacity={0.4} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.08, 0.42, 0]}>
        <boxGeometry args={[0.1, 0.46, 0.1]} />
        <GhostMeshMaterial opacity={0.48} />
        <Edges threshold={15} color="#7dd3fc" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.08, 0.42, 0]}>
        <boxGeometry args={[0.1, 0.46, 0.1]} />
        <GhostMeshMaterial opacity={0.48} />
        <Edges threshold={15} color="#7dd3fc" />
      </mesh>
    </group>
  );
}

function TrackedEntityMesh({ entity }: { entity: TrackedEntity3D }) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef<[number, number]>([...entity.currentPos]);
  const rotRef = useRef<number>(entity.rotationY);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const step = Math.min(1, delta * 3.8);
    posRef.current[0] = THREE.MathUtils.lerp(
      posRef.current[0],
      entity.targetPos[0],
      step
    );
    posRef.current[1] = THREE.MathUtils.lerp(
      posRef.current[1],
      entity.targetPos[1],
      step
    );
    rotRef.current = THREE.MathUtils.lerp(
      rotRef.current,
      entity.rotationY,
      step
    );

    groupRef.current.position.set(
      posRef.current[0],
      FLOOR_Y,
      posRef.current[1]
    );
    groupRef.current.rotation.set(0, rotRef.current, 0);
  });

  const statusText = entity.isMoving
    ? `${entity.speedMph.toFixed(1)} MPH • MOVING`
    : 'PARKED / STILL';

  return (
    <group
      ref={groupRef}
      position={[entity.currentPos[0], FLOOR_Y, entity.currentPos[1]]}
      rotation={[0, entity.rotationY, 0]}
    >
      {entity.kind === 'person' ? (
        <GhostPerson3D isMoving={entity.isMoving} />
      ) : entity.kind === 'forklift' ? (
        <GhostForklift3D isMoving={entity.isMoving} />
      ) : (
        <GhostVehicle3D
          variant={entity.variant || 'sedan'}
          isMoving={entity.isMoving}
        />
      )}

      <Html
        position={[0, entity.kind === 'person' ? 1.62 : 1.55, 0]}
        center
        distanceFactor={16}
        zIndexRange={[15, 0]}
      >
        <div className="pointer-events-none select-none px-2 py-0.5 rounded-lg bg-slate-950/90 border border-cyan-400/50 text-[9.5px] font-mono text-cyan-200 shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              entity.isMoving
                ? 'bg-emerald-400 animate-ping'
                : 'bg-cyan-400'
            }`}
          />
          <span className="font-bold text-white">
            {entity.label} ({entity.confidence}%)
          </span>
          <span className="text-cyan-400/80">•</span>
          <span
            className={
              entity.isMoving ? 'text-emerald-300 font-bold' : 'text-cyan-300'
            }
          >
            {statusText}
          </span>
          <span className="px-1 rounded bg-cyan-500/20 text-[8.5px] text-cyan-300 border border-cyan-500/30">
            {entity.cameraName}
          </span>
        </div>
      </Html>
    </group>
  );
}

export function CameraSpatialVision({
  enabled,
  markers,
  unifiConfig,
  fsdConfig = DEFAULT_FSD_VISION_CONFIG,
  isCalibrating = false,
  selectedCameraId,
  onSelectCameraId,
  onUpdateCameraMarker,
  clickGroundToPlaceZone = false,
  testPreviewPoint = null,
  onReportRawDetections,
}: CameraSpatialVisionProps) {
  const [trackedEntities, setTrackedEntities] = useState<TrackedEntity3D[]>([]);
  const [detectorStatus, setDetectorStatus] = useState<string>(
    'Initializing AI Vision...'
  );

  const tracksRef = useRef<TrackedEntity3D[]>([]);
  const latestByCameraRef = useRef<Record<string, RawCameraDetection[]>>({});
  const prevPixelsByCameraRef = useRef<Record<string, Uint8ClampedArray>>({});

  // Keep latest config & markers in refs so the continuous camera loop always uses live slider values
  const fsdConfigRef = useRef<FsdVisionSettingsConfig>(fsdConfig);
  fsdConfigRef.current = fsdConfig;

  const cameraMarkers = useMemo(
    () => markers.filter((m) => m.type === 'camera' && m.metadata.unifiId),
    [markers]
  );
  const cameraMarkersRef = useRef<FacilityMarker[]>(cameraMarkers);
  cameraMarkersRef.current = cameraMarkers;

  const onReportRef = useRef(onReportRawDetections);
  onReportRef.current = onReportRawDetections;

  // Re-project existing detections immediately when user adjusts sliders or filters
  const recomputeTracksFromLatest = React.useCallback(() => {
    const cfg = fsdConfigRef.current;
    const camsById = new Map(
      cameraMarkersRef.current.map((c) => [c.id, c])
    );
    const now = Date.now();
    const allRaw: RawCameraDetection[] = [];

    for (const [camId, rawList] of Object.entries(latestByCameraRef.current)) {
      const cam = camsById.get(camId);
      if (!cam) continue;
      const mapping = getDefaultCameraVisionMapping(cam);
      if (!mapping.enabled) continue;

      for (const det of rawList) {
        // Lower confidence floor slightly for person (42%) so distant humans exiting doorways aren't cut
        const effectiveMinConf =
          det.kind === 'person'
            ? Math.min(cfg.minConfidencePct, 42)
            : cfg.minConfidencePct;
        if (det.confidence < effectiveMinConf) continue;
        if (det.isMotionFallback && cfg.strictAiOnly) continue;
        if (det.kind === 'person' && !cfg.detectPeople) continue;
        if (det.kind === 'vehicle' && !cfg.detectVehicles) continue;
        if (det.kind === 'forklift' && !cfg.detectForklifts) continue;

        const proj = projectCameraFootpointWithMapping(mapping, det.u, det.v);
        if (!proj) continue;

        allRaw.push({
          ...det,
          worldX: proj.worldX,
          worldZ: proj.worldZ,
          defaultRotY: proj.defaultRotY,
        });
      }
    }

    // Deduplicate overlapping detections within 2.2m
    const deduped: RawCameraDetection[] = [];
    for (const det of allRaw) {
      const existing = deduped.find(
        (d) =>
          d.kind === det.kind &&
          Math.hypot(d.worldX - det.worldX, d.worldZ - det.worldZ) < 2.2
      );
      if (!existing) {
        deduped.push(det);
      } else if (det.confidence > existing.confidence) {
        existing.worldX = (existing.worldX + det.worldX) / 2;
        existing.worldZ = (existing.worldZ + det.worldZ) / 2;
        existing.confidence = det.confidence;
      }
    }

    const prevTracks = tracksRef.current;
    const usedTrackIds = new Set<string>();
    const nextTracks: TrackedEntity3D[] = [];

    for (const det of deduped) {
      let bestTrack: TrackedEntity3D | null = null;
      let bestDist = 3.8;

      for (const trk of prevTracks) {
        if (usedTrackIds.has(trk.id) || trk.kind !== det.kind) continue;
        const dist = Math.hypot(
          trk.targetPos[0] - det.worldX,
          trk.targetPos[1] - det.worldZ
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestTrack = trk;
        }
      }

      if (bestTrack) {
        usedTrackIds.add(bestTrack.id);
        const dtSec = Math.max(0.5, (now - bestTrack.lastSeenAt) / 1000);
        const dx = det.worldX - bestTrack.targetPos[0];
        const dz = det.worldZ - bestTrack.targetPos[1];
        const distMoved = Math.hypot(dx, dz);

        const actuallyMoved = distMoved > 0.55 || det.isMoving;
        const speedMps = actuallyMoved ? distMoved / dtSec : 0;
        const speedMph = Math.min(25, speedMps * 2.237);
        const headingY =
          distMoved > 0.55 ? Math.atan2(dx, dz) : det.defaultRotY;

        nextTracks.push({
          ...bestTrack,
          label: det.label,
          confidence: det.confidence,
          cameraName: det.cameraName,
          targetPos: [det.worldX, det.worldZ],
          velocity: actuallyMoved ? [dx / dtSec, dz / dtSec] : [0, 0],
          speedMph,
          isMoving: actuallyMoved && speedMph > 0.45,
          rotationY: headingY,
          lastSeenAt: now,
        });
      } else {
        const newId = `trk-${det.kind}-${now}-${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        nextTracks.push({
          id: newId,
          kind: det.kind,
          label: det.label,
          confidence: det.confidence,
          cameraId: det.cameraId,
          cameraName: det.cameraName,
          targetPos: [det.worldX, det.worldZ],
          currentPos: [det.worldX, det.worldZ],
          velocity: [0, 0],
          speedMph: det.isMoving ? 2.4 : 0,
          isMoving: det.isMoving,
          rotationY: det.defaultRotY,
          variant: det.variant,
          lastSeenAt: now,
        });
      }
    }

    const filteredTracks = nextTracks.filter(
      (t) => cfg.showParkedVehicles || t.isMoving || t.kind === 'person'
    );

    tracksRef.current = filteredTracks;
    setTrackedEntities([...filteredTracks]);
    setDetectorStatus(
      `FSD Live Vision • ${filteredTracks.length} verified object(s) (≥${cfg.minConfidencePct}% conf)`
    );
  }, []);

  // Immediately re-project when user changes camera mapping sliders or FSD filters
  useEffect(() => {
    if (enabled) {
      recomputeTracksFromLatest();
    }
  }, [enabled, markers, fsdConfig, recomputeTracksFromLatest]);

  useEffect(() => {
    if (!enabled) {
      setTrackedEntities([]);
      tracksRef.current = [];
      latestByCameraRef.current = {};
      prevPixelsByCameraRef.current = {};
      return;
    }

    if (!unifiConfig?.apiKey || cameraMarkersRef.current.length === 0) {
      setDetectorStatus('Set UniFi API Key in Settings to enable live AI vision');
      return;
    }

    let cancelled = false;
    let cocoModel: any = null;

    const detectCanvas = document.createElement('canvas');
    detectCanvas.width = 640;
    detectCanvas.height = 360;
    const detectCtx = detectCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    const motionCanvas = document.createElement('canvas');
    motionCanvas.width = 160;
    motionCanvas.height = 90;
    const motionCtx = motionCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    const processCameraSnapshot = (camId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const cam = cameraMarkersRef.current.find((c) => c.id === camId);
        const unifiId = cam?.metadata.unifiId;
        if (!cam || !unifiId || cancelled) {
          resolve(false);
          return;
        }

        const mapping = getDefaultCameraVisionMapping(cam);
        if (!mapping.enabled) {
          latestByCameraRef.current[cam.id] = [];
          recomputeTracksFromLatest();
          resolve(true);
          return;
        }

        const url = `/api/unifi/snapshot?id=${encodeURIComponent(
          unifiId
        )}&host=${encodeURIComponent(
          unifiConfig.baseUrl || ''
        )}&apiKey=${encodeURIComponent(
          unifiConfig.apiKey
        )}&consoleId=${encodeURIComponent(
          cam.metadata.unifiConsoleId || ''
        )}&allowSelfSigned=${
          unifiConfig.allowSelfSigned !== false
        }&t=${Date.now()}`;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;

        img.onload = async () => {
          if (cancelled || !detectCtx || !motionCtx) {
            resolve(false);
            return;
          }

          try {
            detectCtx.drawImage(img, 0, 0, 640, 360);
            motionCtx.drawImage(img, 0, 0, 160, 90);
            const currMotionPixels = motionCtx.getImageData(
              0,
              0,
              160,
              90
            ).data;
            const prevMotionPixels = prevPixelsByCameraRef.current[cam.id];

            const movingBlobs = prevMotionPixels
              ? detectMovingBlobs(
                  currMotionPixels,
                  prevMotionPixels,
                  160,
                  90
                )
              : [];
            prevPixelsByCameraRef.current[cam.id] = new Uint8ClampedArray(
              currMotionPixels
            );

            const frameDetections: RawCameraDetection[] = [];
            const cocoBoxesNormalized: {
              u: number;
              v: number;
              w: number;
              h: number;
            }[] = [];

            if (cocoModel) {
              // Run COCO-SSD with 0.30 base floor, then filter by live fsdConfig.minConfidencePct
              const predictions = await cocoModel.detect(
                detectCanvas,
                10,
                0.30
              );

              for (const pred of predictions) {
                const cls = String(pred.class).toLowerCase();
                const [bx, by, bw, bh] = pred.bbox as [
                  number,
                  number,
                  number,
                  number
                ];
                const u = (bx + bw / 2) / 640;
                const v = (by + bh) / 360;
                const nw = bw / 640;
                const nh = bh / 360;

                let kind: DetectedKind3D | null = null;
                let label = '';
                let variant: 'sedan' | 'van' = 'sedan';

                if (cls === 'person') {
                  // For humans: nh down to 0.03 (approx 11px) to detect distant people exiting doors
                  if (nh < 0.03 || nw > 0.65 || nh > 0.90) continue;
                  // Aspect ratio check: person should be more vertical than horizontal
                  if (nh / Math.max(0.01, nw) < 0.75) continue;
                  kind = 'person';
                  label = 'PERSON';
                } else if (
                  cls === 'car' ||
                  cls === 'truck' ||
                  cls === 'bus'
                ) {
                  // For vehicles: minimum size 0.04
                  if (nh < 0.04 || nw < 0.04 || nw > 0.85 || nh > 0.88) continue;
                  const overlapsMotion = movingBlobs.some(
                    (b) => Math.hypot(b.u - u, b.v - v) < 0.14
                  );
                  if (overlapsMotion && nh / Math.max(0.01, nw) > 0.82) {
                    kind = 'forklift';
                    label = 'FORKLIFT';
                  } else {
                    kind = 'vehicle';
                    label = cls === 'truck' ? 'SUV / TRUCK' : 'VEHICLE';
                    variant = cls === 'truck' ? 'van' : 'sedan';
                  }
                }

                if (!kind) continue;

                const currentCam =
                  cameraMarkersRef.current.find((c) => c.id === cam.id) || cam;
                const liveMap = getDefaultCameraVisionMapping(currentCam);
                const proj = projectCameraFootpointWithMapping(liveMap, u, v);
                if (!proj) continue;

                const isMovingNow = movingBlobs.some(
                  (b) => Math.hypot(b.u - u, b.v - v) < 0.12
                );

                cocoBoxesNormalized.push({ u, v, w: nw, h: nh });
                frameDetections.push({
                  kind,
                  label,
                  confidence: Math.round(pred.score * 100),
                  cameraId: cam.id,
                  cameraName: cam.name,
                  u,
                  v,
                  worldX: proj.worldX,
                  worldZ: proj.worldZ,
                  defaultRotY: proj.defaultRotY,
                  isMoving: isMovingNow,
                  isMotionFallback: false,
                  variant,
                });
              }
            }

            // Optional motion-blob fallback (only used if strictAiOnly is turned OFF by user)
            if (!fsdConfigRef.current.strictAiOnly) {
              const currentCam =
                cameraMarkersRef.current.find((c) => c.id === cam.id) || cam;
              const liveMap = getDefaultCameraVisionMapping(currentCam);

              for (const blob of movingBlobs) {
                const alreadyCovered = cocoBoxesNormalized.some(
                  (c) => Math.hypot(c.u - blob.u, c.v - blob.v) < 0.15
                );
                if (alreadyCovered) continue;

                const proj = projectCameraFootpointWithMapping(
                  liveMap,
                  blob.u,
                  blob.v
                );
                if (!proj) continue;

                const aspect = blob.h / Math.max(0.02, blob.w);
                let kind: DetectedKind3D = 'person';
                let label = 'PERSON (MOTION)';
                if (blob.w > 0.18 && aspect < 1.1) {
                  kind = 'forklift';
                  label = 'FORKLIFT (MOTION)';
                }

                frameDetections.push({
                  kind,
                  label,
                  confidence: Math.min(92, 65 + blob.motionPixels * 2),
                  cameraId: cam.id,
                  cameraName: cam.name,
                  u: blob.u,
                  v: blob.v,
                  worldX: proj.worldX,
                  worldZ: proj.worldZ,
                  defaultRotY: proj.defaultRotY,
                  isMoving: true,
                  isMotionFallback: true,
                });
              }
            }

            latestByCameraRef.current[cam.id] = frameDetections;
            if (onReportRef.current) {
              const summary: Record<
                string,
                { u: number; v: number; label: string; confidence: number }[]
              > = {};
              for (const [cid, list] of Object.entries(
                latestByCameraRef.current
              )) {
                summary[cid] = list.map((d) => ({
                  u: d.u,
                  v: d.v,
                  label: d.label,
                  confidence: d.confidence,
                }));
              }
              onReportRef.current(summary);
            }
            recomputeTracksFromLatest();
            resolve(true);
          } catch {
            // Ignore single-frame decode errors
            resolve(false);
          }
        };

        img.onerror = () => {
          resolve(false);
        };
      });
    };

    const startVisionPipeline = async () => {
      try {
        setDetectorStatus('Loading COCO-SSD Neural Vision Model...');
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (cancelled) return;
        setDetectorStatus('Scanning live UniFi camera feeds...');
      } catch {
        if (cancelled) return;
        setDetectorStatus('Running live camera vision...');
      }

      const initialCams = cameraMarkersRef.current;
      initialCams.forEach((cam, idx) => {
        const pollCameraLoop = async () => {
          // Stagger initial camera starts by 800ms
          await new Promise((r) => setTimeout(r, idx * 800));
          while (!cancelled) {
            const ok = await processCameraSnapshot(cam.id);
            // Wait 1.2s after a successful snapshot or 3.0s if failed/offline
            const pauseMs = ok ? 1200 : 3000;
            await new Promise((r) => setTimeout(r, pauseMs));
          }
        };
        pollCameraLoop();
      });
    };

    startVisionPipeline();

    return () => {
      cancelled = true;
    };
  }, [enabled, unifiConfig, recomputeTracksFromLatest]);

  const testProjection = useMemo(() => {
    if (!testPreviewPoint) return null;
    const cam = cameraMarkers.find((c) => c.id === testPreviewPoint.cameraId);
    if (!cam) return null;
    const mapping = getDefaultCameraVisionMapping(cam);
    const proj = projectCameraFootpointWithMapping(
      mapping,
      testPreviewPoint.u,
      testPreviewPoint.v,
      true
    );
    if (!proj) return null;
    return {
      cam,
      worldX: proj.worldX,
      worldZ: proj.worldZ,
      rotY: proj.defaultRotY,
    };
  }, [testPreviewPoint, cameraMarkers]);

  if (!enabled && !isCalibrating) return null;

  const activeSelectedCam =
    cameraMarkers.find((c) => c.id === selectedCameraId) ||
    cameraMarkers[0] ||
    null;

  return (
    <group name="tesla-fsd-real-camera-vision">
      {/* Click-on-3D-Ground Receiver when "Click Ground to Move Camera Zone" is enabled */}
      {isCalibrating && clickGroundToPlaceZone && activeSelectedCam && (
        <mesh
          position={[0, FLOOR_Y + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (!onUpdateCameraMarker) return;
            const pt = e.point;
            // Clamp outside building interior
            let gx = Number(pt.x.toFixed(1));
            let gz = Number(pt.z.toFixed(1));
            if (gx > -6.5 && gx < 6.5 && gz > -9.0 && gz < 8.8) {
              const distEast = Math.abs(6.5 - gx);
              const distWest = Math.abs(-6.5 - gx);
              const distNorth = Math.abs(8.8 - gz);
              const distSouth = Math.abs(-9.0 - gz);
              const minD = Math.min(distEast, distWest, distNorth, distSouth);
              if (minD === distNorth) gz = 12.0;
              else if (minD === distSouth) gz = -12.5;
              else if (minD === distEast) gx = 10.0;
              else gx = -10.0;
            }
            const curMap = getDefaultCameraVisionMapping(activeSelectedCam);
            onUpdateCameraMarker({
              ...activeSelectedCam,
              metadata: {
                ...activeSelectedCam.metadata,
                visionMapping: {
                  ...curMap,
                  zoneCenterX: gx,
                  zoneCenterZ: gz,
                },
              },
            });
          }}
        >
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3D Ground Coverage Zones (Always shown when calibrating or when Show 3D Zones is enabled) */}
      {(fsdConfig.showCoverageZones3D || isCalibrating) &&
        cameraMarkers.map((cam) => {
          const camMapping = getDefaultCameraVisionMapping(cam);
          const isSel = activeSelectedCam?.id === cam.id;
          return (
            <CameraCoverageZone3D
              key={`zone-${cam.id}`}
              cam={cam}
              mapping={camMapping}
              isSelected={isSel}
              isCalibrating={isCalibrating}
              onSelect={() => onSelectCameraId?.(cam.id)}
              onUpdateMapping={(patch) => {
                if (!onUpdateCameraMarker) return;
                onUpdateCameraMarker({
                  ...cam,
                  metadata: {
                    ...cam.metadata,
                    visionMapping: {
                      ...camMapping,
                      ...patch,
                    },
                  },
                });
              }}
            />
          );
        })}

      {/* Live 3D Test Avatar when user clicks or hovers on the live camera photo */}
      {testProjection && (
        <group
          position={[testProjection.worldX, FLOOR_Y, testProjection.worldZ]}
          rotation={[0, testProjection.rotY, 0]}
        >
          {/* Bullseye Target Rings on 3D Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.35, 0.52, 32]} />
            <meshBasicMaterial
              color="#10b981"
              side={THREE.DoubleSide}
              transparent
              opacity={0.95}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.7, 0.82, 32]} />
            <meshBasicMaterial
              color="#34d399"
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* 3D Holographic Person at Test Spot */}
          <GhostPerson3D isMoving={true} />

          <Html
            position={[0, 2.25, 0]}
            center
            distanceFactor={16}
            zIndexRange={[25, 0]}
          >
            <div className="pointer-events-none select-none px-2.5 py-1 rounded-xl bg-emerald-950/95 border-2 border-emerald-400 text-[10px] font-mono font-bold text-emerald-200 shadow-2xl whitespace-nowrap flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>📍 CAMERA TEST SPOT ({testProjection.cam.name})</span>
            </div>
          </Html>
        </group>
      )}

      {/* Floating FSD Vision Status Banner */}
      <Html
        position={[8.8, 2.2, 2.5]}
        center
        distanceFactor={18}
        zIndexRange={[15, 0]}
      >
        <div className="pointer-events-none select-none px-3 py-1 rounded-full bg-slate-950/90 border border-sky-400/50 text-[10px] font-mono text-sky-300 shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span className="font-bold text-white">TESLA FSD 3D VISION</span>
          <span className="text-slate-500">|</span>
          <span>{detectorStatus}</span>
        </div>
      </Html>

      {/* Render ONLY verified real objects from the camera feeds at their mapped 3D coordinates */}
      {trackedEntities.map((entity) => (
        <TrackedEntityMesh key={entity.id} entity={entity} />
      ))}
    </group>
  );
}
