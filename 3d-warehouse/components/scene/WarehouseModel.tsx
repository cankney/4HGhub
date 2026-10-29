'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  Edges,
  Html,
  RoundedBox,
  TransformControls,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { CutoutBox, DisplayMode, MeshOverride } from '@/lib/markers';
import { BlueprintItem, ShelfLocationAssignment } from '@/lib/blueprint-geometry';
import { formatFeetInches } from '@/lib/units';

interface WarehouseModelProps {
  appMode: 'view' | 'edit';
  displayMode: DisplayMode;
  theme: 'daylight' | 'dark';
  roofCutoffY: number;
  meshOverrides: MeshOverride[];
  blueprintItems: BlueprintItem[];
  selectedBlueprintId: string | null;
  selectedSlotKey: string | null;
  cutoutBoxes: CutoutBox[];
  selectedMeshIndex: number | null;
  editModelMode: boolean;
  calibrationMode: boolean;
  searchQuery?: string;
  onSelectMesh: (meshIndex: number) => void;
  onSelectBlueprintItem: (id: string) => void;
  onSelectSlot: (slotKey: string | null) => void;
  onUpdateBlueprintItem: (updated: BlueprintItem) => void;
  onCalibrateClick: (point: [number, number, number], meshIndex?: number) => void;
}

interface ExtractedMesh {
  index: number;
  geometry: THREE.BufferGeometry;
  originalMaterial: THREE.Material | THREE.Material[];
}

/**
 * Helper to add a rounded-corner rectangle path/shape
 */
function buildRoundedRectPath(
  isShape: boolean,
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
  r: number
) {
  const p = isShape ? new THREE.Shape() : new THREE.Path();
  const radius = Math.min(r, (xMax - xMin) / 2, (yMax - yMin) / 2);
  p.moveTo(xMin + radius, yMin);
  p.lineTo(xMax - radius, yMin);
  p.quadraticCurveTo(xMax, yMin, xMax, yMin + radius);
  p.lineTo(xMax, yMax - radius);
  p.quadraticCurveTo(xMax, yMax, xMax - radius, yMax);
  p.lineTo(xMin + radius, yMax);
  p.quadraticCurveTo(xMin, yMax, xMin, yMax - radius);
  p.lineTo(xMin, yMin + radius);
  p.quadraticCurveTo(xMin, yMin, xMin + radius, yMin);
  p.closePath();
  return p;
}

/**
 * Unified Monolithic Extruded Wall Architecture with Flush, Seamless Door Cutouts
 * Each wall plane is extruded in elevation (side profile) with rectangular holes for doorways,
 * so the wall above and beside every door is 100% flush and continuous with zero indents or seams!
 */
function UnifiedArchitecturalWalls({
  theme,
  clippingPlanes,
  doors,
}: {
  theme: 'daylight' | 'dark';
  clippingPlanes: THREE.Plane[];
  doors: BlueprintItem[];
}) {
  const { wallMeshes, alcoveWallGeo } = useMemo(() => {
    const wallHeight = 2.6;
    const alcoveHeight = 2.4;
    const zToShapeY = (z: number) => -z;

    /**
     * Builds a vertical wall slab with rectangular doorway holes cut cleanly out of its 2D elevation profile.
     * Because the entire wall + lintel above the doors is a single flat 2D Shape extruded by `thickness`,
     * the front, back, and top surfaces are 100% coplanar and smooth with zero indenting above doors!
     */
    const buildElevationWallGeo = (
      uMin: number,
      uMax: number,
      thickness: number,
      wallDoors: { uCenter: number; width: number; height: number }[]
    ) => {
      const len = uMax - uMin;
      const shape = new THREE.Shape();
      // Shape X = local u from -len/2 to +len/2
      // Shape Y = height from 0 to wallHeight
      shape.moveTo(-len / 2, 0);
      shape.lineTo(len / 2, 0);
      shape.lineTo(len / 2, wallHeight);
      shape.lineTo(-len / 2, wallHeight);
      shape.closePath();

      // Sort and clamp door cutouts so they stay strictly inside the shape boundary (y starts at 0.002)
      const uMid = (uMin + uMax) / 2;
      for (const d of wallDoors) {
        const localCenter = d.uCenter - uMid;
        const a = Math.max(-len / 2 + 0.05, localCenter - d.width / 2);
        const b = Math.min(len / 2 - 0.05, localCenter + d.width / 2);
        const h = Math.min(wallHeight - 0.08, Math.max(0.2, d.height));
        if (b > a + 0.05) {
          const hole = new THREE.Path();
          hole.moveTo(a, 0.002);
          hole.lineTo(b, 0.002);
          hole.lineTo(b, h);
          hole.lineTo(a, h);
          hole.closePath();
          shape.holes.push(hole);
        }
      }

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
      });
      // Center extrusion depth along local Z (-thickness/2 to +thickness/2)
      geo.translate(0, 0, -thickness / 2);
      geo.computeVertexNormals();
      return geo;
    };

    const eastDoors: { uCenter: number; width: number; height: number }[] = [];
    const westDoors: { uCenter: number; width: number; height: number }[] = [];
    const northDoors: { uCenter: number; width: number; height: number }[] = [];
    const southDoors: { uCenter: number; width: number; height: number }[] = [];
    const officeXDoors: { uCenter: number; width: number; height: number }[] =
      [];
    const officeZDoors: { uCenter: number; width: number; height: number }[] =
      [];

    for (const d of doors) {
      if (!d.visible) continue;
      const [dx, , dz] = d.position;
      const [dw, dh] = d.size;
      // Add rough-opening clearance (+0.11m width, +0.04m height) so the door jambs & header trim
      // sit cleanly inside the rough opening without coplanar z-fighting/clipping against the wall!
      const roughW = dw + 0.11;
      const roughH = dh + 0.04;

      if (Math.abs(dz - -8.75) < 0.45) {
        eastDoors.push({ uCenter: dx, width: roughW, height: roughH });
      } else if (Math.abs(dz - 8.45) < 0.45) {
        westDoors.push({ uCenter: dx, width: roughW, height: roughH });
      } else if (Math.abs(dx - -6.05) < 0.45) {
        northDoors.push({ uCenter: dz, width: roughW, height: roughH });
      } else if (Math.abs(dx - 6.05) < 0.45) {
        southDoors.push({ uCenter: dz, width: roughW, height: roughH });
      } else if (Math.abs(dx - -1.18) < 0.45 && dz >= 0.5) {
        officeXDoors.push({ uCenter: dz, width: roughW, height: roughH });
      } else if (Math.abs(dz - 0.95) < 0.45 && dx <= -1.0) {
        officeZDoors.push({ uCenter: dx, width: roughW, height: roughH });
      }
    }

    const meshes: {
      id: string;
      geo: THREE.BufferGeometry;
      pos: [number, number, number];
      rotY: number;
    }[] = [
      // 1. East Perimeter Wall (Z = -8.75, X spans [-6.17, 6.17])
      {
        id: 'wall-east',
        geo: buildElevationWallGeo(-6.17, 6.17, 0.24, eastDoors),
        pos: [0, 0, -8.75],
        rotY: 0,
      },
      // 2. West Perimeter Wall (Z = +8.45, X spans [-6.17, 6.17])
      {
        id: 'wall-west',
        geo: buildElevationWallGeo(-6.17, 6.17, 0.24, westDoors),
        pos: [0, 0, 8.45],
        rotY: 0,
      },
      // 3. North Perimeter Wall (X = -6.05, Z spans [-8.63, 8.33])
      {
        id: 'wall-north',
        geo: buildElevationWallGeo(-8.63, 8.33, 0.24, northDoors),
        pos: [-6.05, 0, -0.15],
        rotY: -Math.PI / 2,
      },
      // 4. South Perimeter Wall (X = +6.05, Z spans [-8.63, 8.33])
      {
        id: 'wall-south',
        geo: buildElevationWallGeo(-8.63, 8.33, 0.24, southDoors),
        pos: [6.05, 0, -0.15],
        rotY: -Math.PI / 2,
      },
      // 5. Office Corridor Wall (X = -1.18, Z spans [0.85, 8.33])
      {
        id: 'wall-office-corridor',
        geo: buildElevationWallGeo(0.85, 8.33, 0.2, officeXDoors),
        pos: [-1.18, 0, 4.59],
        rotY: -Math.PI / 2,
      },
      // 6. Office East Dividing Wall (Z = 0.95, X spans [-5.93, -1.28])
      {
        id: 'wall-office-east',
        geo: buildElevationWallGeo(-5.93, -1.28, 0.2, officeZDoors),
        pos: [-3.605, 0, 0.95],
        rotY: 0,
      },
    ];

    // Tan Utility Alcove / Nook as clean flat L-shapes
    const nookLeft = new THREE.Shape();
    nookLeft.moveTo(-5.93, zToShapeY(-0.46));
    nookLeft.lineTo(-3.69, zToShapeY(-0.46));
    nookLeft.lineTo(-3.69, zToShapeY(-1.55));
    nookLeft.lineTo(-3.87, zToShapeY(-1.55));
    nookLeft.lineTo(-3.87, zToShapeY(-0.64));
    nookLeft.lineTo(-5.93, zToShapeY(-0.64));
    nookLeft.closePath();

    const nookRight = new THREE.Shape();
    nookRight.moveTo(-5.93, zToShapeY(-3.64));
    nookRight.lineTo(-3.69, zToShapeY(-3.64));
    nookRight.lineTo(-3.69, zToShapeY(-2.75));
    nookRight.lineTo(-3.87, zToShapeY(-2.75));
    nookRight.lineTo(-3.87, zToShapeY(-3.46));
    nookRight.lineTo(-5.93, zToShapeY(-3.46));
    nookRight.closePath();

    const alcoveGeo = new THREE.ExtrudeGeometry([nookLeft, nookRight], {
      depth: alcoveHeight,
      bevelEnabled: false,
    });
    alcoveGeo.computeVertexNormals();

    return {
      wallMeshes: meshes,
      alcoveWallGeo: alcoveGeo,
    };
  }, [doors]);

  const wallColor = theme === 'daylight' ? '#b0bac9' : '#334155';

  return (
    <group position={[0, -1.55, 0]}>
      {wallMeshes.map((w) => (
        <mesh
          key={w.id}
          geometry={w.geo}
          position={w.pos}
          rotation={[0, w.rotY, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={wallColor}
            roughness={0.5}
            metalness={0.06}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
      ))}

      <mesh
        geometry={alcoveWallGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#cbb8a9"
          roughness={0.5}
          metalness={0.05}
          clippingPlanes={clippingPlanes}
          clipShadows
        />
      </mesh>
    </group>
  );
}

/**
 * Standing Work Bench Under Upper Storage Shelf with Illuminated Under-Shelf LED Task Light
 */
function WorkBenchRackWithLight3D({
  size,
  bays = 1,
  showBoxes = true,
  isSelected,
  isHovered,
  theme,
  searchQuery,
  clippingPlanes,
}: {
  size: [number, number, number];
  bays?: number;
  showBoxes?: boolean;
  isSelected: boolean;
  isHovered: boolean;
  theme: 'daylight' | 'dark';
  searchQuery?: string;
  clippingPlanes: THREE.Plane[];
}) {
  const [sx, sy, sz] = size;
  const postThick = 0.065;
  const shelfThick = 0.055;

  const frameColor = isSelected
    ? '#8DDB05'
    : isHovered
    ? '#a3e635'
    : theme === 'daylight'
    ? '#64748b'
    : '#94a3b8';

  const benchTopColor = isSelected
    ? '#8DDB05'
    : theme === 'daylight'
    ? '#cbd5e1'
    : '#64748b';

  const alongX = sx >= sz;
  const numBays = Math.max(1, Math.min(6, bays));

  const postPositions: [number, number][] = [];
  for (let i = 0; i <= numBays; i++) {
    const t = -0.5 + i / numBays;
    if (alongX) {
      const px = t * (sx - postThick);
      postPositions.push([px, -(sz - postThick) / 2]);
      postPositions.push([px, (sz - postThick) / 2]);
    } else {
      const pz = t * (sz - postThick);
      postPositions.push([-(sx - postThick) / 2, pz]);
      postPositions.push([(sx - postThick) / 2, pz]);
    }
  }

  // Standing workbench height (~42" / 1.05m from floor, i.e. -sy/2 + sy * 0.44)
  const benchY = -sy / 2 + sy * 0.44;
  // Upper storage shelf (~76" from floor, i.e. +sy * 0.34)
  const upperShelfY = sy * 0.34;
  // Top cap frame bar
  const topCapY = sy / 2 - shelfThick / 2;

  return (
    <group>
      {/* 4+ Full-Height Vertical Upright Posts */}
      {postPositions.map(([px, pz], idx) => (
        <RoundedBox
          key={`wb-post-${idx}`}
          position={[px, 0, pz]}
          args={[postThick, sy, postThick]}
          radius={0.015}
          smoothness={3}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={frameColor}
            roughness={0.42}
            metalness={0.28}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      ))}

      {/* Lower Footrest / Tie-bar along the back & sides */}
      <RoundedBox
        position={[0, -sy / 2 + 0.18, 0]}
        args={[sx - 0.02, 0.04, sz - 0.02]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.45}
          metalness={0.28}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Standing Work Bench Surface (42" Standing Height) */}
      <RoundedBox
        position={[0, benchY, 0]}
        args={[sx + 0.02, shelfThick * 1.25, sz + 0.02]}
        radius={0.02}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={benchTopColor}
          roughness={0.38}
          metalness={0.12}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Upper Storage Shelf Deck */}
      <RoundedBox
        position={[0, upperShelfY, 0]}
        args={[sx, shelfThick, sz]}
        radius={0.018}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.42}
          metalness={0.28}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Top Rack Cap Shelf */}
      <RoundedBox
        position={[0, topCapY, 0]}
        args={[sx, shelfThick, sz]}
        radius={0.018}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.42}
          metalness={0.28}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Storage Boxes on the Upper Storage Shelf */}
      {showBoxes &&
        Array.from({ length: numBays }).map((_, bIdx) => {
          const bayFrac = -0.5 + (bIdx + 0.5) / numBays;
          const boxH = Math.min(0.32, (topCapY - upperShelfY) * 0.72);
          const boxY = upperShelfY + shelfThick / 2 + boxH / 2 + 0.005;
          const bw = alongX ? (sx / numBays) * 0.76 : sx * 0.78;
          const bd = alongX ? sz * 0.78 : (sz / numBays) * 0.76;
          const bx = alongX ? bayFrac * sx : 0;
          const bz = alongX ? 0 : bayFrac * sz;

          return (
            <RoundedBox
              key={`wb-box-${bIdx}`}
              position={[bx, boxY, bz]}
              args={[bw, boxH, bd]}
              radius={0.025}
              smoothness={3}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={frameColor}
                roughness={0.5}
                metalness={0.18}
                clippingPlanes={clippingPlanes}
              />
            </RoundedBox>
          );
        })}

      {/* Under-Shelf LED Task Light Fixture Bar (Mounted directly beneath the upper storage shelf) */}
      <RoundedBox
        position={[0, upperShelfY - shelfThick / 2 - 0.025, 0]}
        args={[
          alongX ? sx * 0.78 : 0.12,
          0.035,
          alongX ? 0.12 : sz * 0.78,
        ]}
        radius={0.01}
      >
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fde68a"
          emissiveIntensity={2.4}
          roughness={0.1}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Downward Task Light Illumination + Soft Volumetric Light Cone onto the Standing Bench */}
      <pointLight
        position={[0, upperShelfY - 0.12, 0]}
        intensity={1.6}
        distance={2.6}
        decay={1.8}
        color="#fef08a"
      />
      <mesh position={[0, (upperShelfY + benchY) / 2, 0]}>
        <cylinderGeometry
          args={[
            Math.min(sx, sz) * 0.25,
            Math.min(sx, sz) * 0.55,
            upperShelfY - benchY - 0.08,
            20,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.13}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Clean Multi-Tier Open-Frame Shelving Rack with Uniform Support Grey Color, Configurable Bays/Levels/Rows,
 * and Interactive Per-Slot Odoo Location Highlight & Selection
 */
function ArchitecturalRack3D({
  size,
  bays = 3,
  levels = 3,
  rows = 1,
  showBoxes = true,
  isNonInventory = false,
  locationPrefix,
  shelfLocations,
  selectedSlotKey,
  onSelectSlot,
  isSelected,
  isHovered,
  theme,
  searchQuery,
  clippingPlanes,
}: {
  size: [number, number, number];
  bays?: number;
  levels?: number;
  rows?: number;
  showBoxes?: boolean;
  isNonInventory?: boolean;
  locationPrefix?: string;
  shelfLocations?: Record<string, ShelfLocationAssignment>;
  selectedSlotKey?: string | null;
  onSelectSlot?: (slotKey: string) => void;
  isSelected: boolean;
  isHovered: boolean;
  theme: 'daylight' | 'dark';
  searchQuery?: string;
  clippingPlanes: THREE.Plane[];
}) {
  const [sx, sy, sz] = size;
  const postThick = 0.065;
  const shelfThick = 0.055;

  // Unified Grey Color matching the vertical supports for the entire rack & shelves
  const unifiedRackColor = isSelected
    ? '#8DDB05'
    : isHovered
    ? '#a3e635'
    : theme === 'daylight'
    ? '#64748b'
    : '#94a3b8';

  const boxColorPrimary = theme === 'daylight' ? '#64748b' : '#64748b';

  const alongX = sx >= sz;
  const numBays = Math.max(1, Math.min(10, bays));
  const numRows = Math.max(1, Math.min(4, rows));

  // Compute upright post lines across both bays (length) and rows (depth)
  const postPositions: [number, number][] = [];
  for (let i = 0; i <= numBays; i++) {
    const tBay = -0.5 + i / numBays;
    for (let r = 0; r <= numRows; r++) {
      const tRow = -0.5 + r / numRows;
      if (alongX) {
        const px = tBay * (sx - postThick);
        const pz = tRow * (sz - postThick);
        postPositions.push([px, pz]);
      } else {
        const px = tRow * (sx - postThick);
        const pz = tBay * (sz - postThick);
        postPositions.push([px, pz]);
      }
    }
  }

  const shelfYs: number[] = [];
  const numLevels = Math.max(1, Math.min(8, levels));
  for (let l = 0; l < numLevels; l++) {
    const frac = (l + 0.1) / numLevels;
    shelfYs.push(-sy / 2 + frac * sy);
  }
  shelfYs.push(sy / 2 - shelfThick / 2);

  // Gap between split rows so you can clearly see the rack split into rows
  const rowGap = numRows > 1 ? 0.05 : 0;

  return (
    <group>
      {/* Rounded Vertical Upright Posts */}
      {postPositions.map(([px, pz], idx) => (
        <RoundedBox
          key={`post-${idx}`}
          position={[px, 0, pz]}
          args={[postThick, sy, postThick]}
          radius={0.015}
          smoothness={3}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={unifiedRackColor}
            roughness={0.42}
            metalness={0.28}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      ))}

      {/* Rounded Horizontal Shelf Decks (Split by Rows) & Interactive Per-Slot Odoo Location Boxes */}
      {shelfYs.map((yPos, lIdx) => {
        const isTop = lIdx === shelfYs.length - 1;
        return (
          <group key={`lvl-${lIdx}`}>
            {Array.from({ length: numRows }).map((_, rIdx) => {
              const rowCenterFrac = -0.5 + (rIdx + 0.5) / numRows;
              const rowDeckW = alongX ? sx : sx / numRows - rowGap;
              const rowDeckD = alongX ? sz / numRows - rowGap : sz;
              const deckX = alongX ? 0 : rowCenterFrac * sx;
              const deckZ = alongX ? rowCenterFrac * sz : 0;

              return (
                <group key={`row-${rIdx}`}>
                  <RoundedBox
                    position={[deckX, yPos, deckZ]}
                    args={[rowDeckW, shelfThick, rowDeckD]}
                    radius={0.018}
                    smoothness={3}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      color={unifiedRackColor}
                      roughness={0.42}
                      metalness={0.28}
                      clippingPlanes={clippingPlanes}
                    />
                  </RoundedBox>

                  {!isTop &&
                    Array.from({ length: numBays }).map((__, bIdx) => {
                      const slotKey = `R${rIdx + 1}-B${bIdx + 1}-L${lIdx + 1}`;
                      const assignedLoc = shelfLocations?.[slotKey];
                      const isSlotSelected =
                        isSelected && selectedSlotKey === slotKey;
                      const hasMappedLoc = Boolean(
                        assignedLoc?.locationCode || assignedLoc?.odooLocationId
                      );

                      const cleanQuery = searchQuery?.trim().toLowerCase();
                      const matchingProduct =
                        cleanQuery && cleanQuery.length >= 2 && assignedLoc?.products
                          ? assignedLoc.products.find(
                              (p) =>
                                p.sku.toLowerCase().includes(cleanQuery) ||
                                p.name.toLowerCase().includes(cleanQuery) ||
                                (p.lot && p.lot.toLowerCase().includes(cleanQuery))
                            )
                          : undefined;
                      const isLocationMatch = Boolean(
                        cleanQuery &&
                          cleanQuery.length >= 2 &&
                          (assignedLoc?.shortCode?.toLowerCase().includes(cleanQuery) ||
                            assignedLoc?.locationCode?.toLowerCase().includes(cleanQuery))
                      );
                      const isSearchHit = Boolean(matchingProduct || isLocationMatch);

                      const bayCenterFrac = -0.5 + (bIdx + 0.5) / numBays;
                      const boxH = Math.min(0.48, (sy / numLevels) * 0.6);
                      const boxY = yPos + shelfThick / 2 + boxH / 2 + 0.005;
                      const bayW = alongX
                        ? (sx / numBays) * 0.76
                        : (sx / numRows) * 0.76;
                      const bayD = alongX
                        ? (sz / numRows) * 0.76
                        : (sz / numBays) * 0.76;
                      const bx = alongX
                        ? bayCenterFrac * sx
                        : rowCenterFrac * sx;
                      const bz = alongX
                        ? rowCenterFrac * sz
                        : bayCenterFrac * sz;

                      const slotBoxColor = isSlotSelected || isSearchHit
                        ? '#8DDB05'
                        : hasMappedLoc && isSelected
                        ? '#65a30d'
                        : boxColorPrimary;

                      return (
                        <group key={`slot-${lIdx}-${rIdx}-${bIdx}`}>
                          {(showBoxes || isSlotSelected || isSearchHit || (isSelected && hasMappedLoc)) && (
                            <RoundedBox
                              position={[bx, boxY, bz]}
                              args={[bayW, boxH, bayD]}
                              radius={0.03}
                              smoothness={3}
                              castShadow
                              receiveShadow
                              onClick={(e) => {
                                if (onSelectSlot) {
                                  e.stopPropagation();
                                  onSelectSlot(slotKey);
                                }
                              }}
                            >
                              <meshStandardMaterial
                                color={slotBoxColor}
                                emissive={isSlotSelected || isSearchHit ? '#8DDB05' : '#000000'}
                                emissiveIntensity={isSlotSelected ? 0.35 : isSearchHit ? 0.45 : 0}
                                roughness={0.5}
                                metalness={0.18}
                                transparent={!showBoxes && !isSlotSelected && !isSearchHit}
                                opacity={!showBoxes && !isSlotSelected && !isSearchHit ? 0.55 : 1}
                                clippingPlanes={clippingPlanes}
                              />
                            </RoundedBox>
                          )}

                          {/* Show 3D Odoo Location Tag when this slot is selected, has mapped loc, or matches search */}
                          {!isNonInventory && (isSearchHit || (isSelected && (isSlotSelected || hasMappedLoc))) && (
                            <Html
                              position={[bx, boxY + boxH * 0.35, bz]}
                              center
                              distanceFactor={12}
                              style={{ pointerEvents: 'none' }}
                            >
                              <div
                                className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold whitespace-nowrap shadow-md border ${
                                  isSearchHit
                                    ? 'bg-[#8DDB05] text-slate-950 border-white ring-2 ring-[#8DDB05] scale-110 shadow-lg'
                                    : isSlotSelected
                                    ? 'bg-[#8DDB05] text-slate-950 border-white scale-110'
                                    : 'bg-slate-950/90 text-[#8DDB05] border-[#8DDB05]/50'
                                }`}
                              >
                                {matchingProduct ? (
                                  <span className="flex items-center gap-1">
                                    <span>📦 {matchingProduct.sku}</span>
                                    <span className="opacity-80">({matchingProduct.quantity}x)</span>
                                    <span className="border-l border-slate-900/40 pl-1 font-semibold">{assignedLoc?.shortCode}</span>
                                  </span>
                                ) : (
                                  <>
                                    {assignedLoc?.shortCode ||
                                      (assignedLoc?.locationCode
                                        ? assignedLoc.locationCode.split('/').pop()
                                        : `${locationPrefix || 'LOC'}-${slotKey}`)}
                                    {assignedLoc?.odooLocationId
                                      ? ` (#${assignedLoc.odooLocationId})`
                                      : ''}
                                  </>
                                )}
                              </div>
                            </Html>
                          )}
                        </group>
                      );
                    })}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Realistic Interactive Sectional Overhead Door (True See-Through Opening when Open!)
 */
function RealisticOverheadDoor3D({
  width,
  height,
  isOpen,
  isSelected,
  isHovered,
  clippingPlanes,
}: {
  width: number;
  height: number;
  isOpen: boolean;
  isSelected: boolean;
  isHovered: boolean;
  clippingPlanes: THREE.Plane[];
}) {
  const openProgress = useRef(isOpen ? 1 : 0);
  const panelCount = 6;
  const panelRefs = useRef<(THREE.Group | null)[]>([]);

  // In local coordinates, +Z is inward toward the shop interior (West doors have rotationY = Math.PI)
  const inwardDir = 1;

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    if (Math.abs(openProgress.current - target) > 0.002) {
      openProgress.current = THREE.MathUtils.lerp(
        openProgress.current,
        target,
        Math.min(1, delta * 5.5)
      );
    } else {
      openProgress.current = target;
    }

    const panelH = height / panelCount;
    const maxTravel = height - 0.15;

    for (let i = 0; i < panelCount; i++) {
      const grp = panelRefs.current[i];
      if (!grp) continue;
      const baseY = -height / 2 + (i + 0.5) * panelH;
      const traveled = openProgress.current * maxTravel;
      const currentY = baseY + traveled;
      const topTurnY = height / 2 - 0.08;

      if (currentY <= topTurnY) {
        grp.position.set(0, currentY, 0);
        grp.rotation.set(0, 0, 0);
      } else {
        const over = currentY - topTurnY;
        grp.position.set(0, topTurnY + 0.04, inwardDir * over);
        grp.rotation.set((inwardDir * Math.PI) / 2, 0, 0);
      }
    }
  });

  const panelH = height / panelCount;
  const wallDepth = 0.25;
  const frameColor = isSelected
    ? '#4f46e5'
    : isHovered
    ? '#3b82f6'
    : '#475569';

  return (
    <group>
      {/* Heavy Steel Side Jamb Frames & Overhead Track Rails (Open C-Frame — ZERO solid backing so you see right through!) */}
      {[-width / 2 - 0.05, width / 2 + 0.05].map((xPos, idx) => (
        <group key={`track-${idx}`}>
          <RoundedBox
            position={[xPos, 0, 0]}
            args={[0.1, height + 0.08, wallDepth + 0.06]}
            radius={0.015}
            castShadow
          >
            <meshStandardMaterial
              color={frameColor}
              roughness={0.4}
              metalness={0.5}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
          <RoundedBox
            position={[xPos, height / 2 - 0.02, inwardDir * (height * 0.48)]}
            args={[0.06, 0.06, height * 0.96]}
            radius={0.01}
          >
            <meshStandardMaterial
              color="#64748b"
              roughness={0.4}
              metalness={0.6}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        </group>
      ))}

      {/* Top Header Beam */}
      <RoundedBox
        position={[0, height / 2 + 0.04, 0]}
        args={[width + 0.2, 0.1, wallDepth + 0.07]}
        radius={0.015}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.4}
          metalness={0.5}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* 6 Articulated Sectional Overhead Door Panels */}
      {Array.from({ length: panelCount }).map((_, idx) => {
        const isVisionPanel = idx === 3;
        return (
          <group
            key={`panel-${idx}`}
            ref={(el) => {
              panelRefs.current[idx] = el;
            }}
          >
            <RoundedBox
              args={[width - 0.02, panelH - 0.018, 0.07]}
              radius={0.012}
              smoothness={3}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={
                  isSelected
                    ? '#818cf8'
                    : isHovered
                    ? '#e2e8f0'
                    : '#cbd5e1'
                }
                roughness={0.45}
                metalness={0.2}
                clippingPlanes={clippingPlanes}
              />
            </RoundedBox>

            {isVisionPanel &&
              [-width * 0.3, 0, width * 0.3].map((wx, wIdx) => (
                <RoundedBox
                  key={`win-${wIdx}`}
                  position={[wx, 0, 0]}
                  args={[width * 0.2, panelH * 0.52, 0.085]}
                  radius={0.008}
                >
                  <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#0284c7"
                    emissiveIntensity={0.25}
                    roughness={0.15}
                    metalness={0.8}
                    clippingPlanes={clippingPlanes}
                  />
                </RoundedBox>
              ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Realistic Hinged Service / Personnel Door (True See-Through Opening when Open!)
 */
function RealisticServiceDoor3D({
  width,
  height,
  isOpen,
  isSelected,
  isHovered,
  doorColor = '#9ca3af',
  clippingPlanes,
}: {
  width: number;
  height: number;
  isOpen: boolean;
  isSelected: boolean;
  isHovered: boolean;
  doorColor?: string;
  clippingPlanes: THREE.Plane[];
}) {
  const leafRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!leafRef.current) return;
    const targetRot = isOpen ? Math.PI * 0.45 : 0;
    leafRef.current.rotation.y = THREE.MathUtils.lerp(
      leafRef.current.rotation.y,
      targetRot,
      Math.min(1, delta * 7)
    );
  });

  const frameColor = isSelected
    ? '#4f46e5'
    : isHovered
    ? '#3b82f6'
    : '#475569';

  return (
    <group>
      {/* Open C-Jamb Door Frame Surround (No solid backing mesh — completely see-through when open!) */}
      <RoundedBox
        position={[-width / 2 - 0.04, 0, 0]}
        args={[0.08, height + 0.06, 0.28]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.5}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>
      <RoundedBox
        position={[width / 2 + 0.04, 0, 0]}
        args={[0.08, height + 0.06, 0.28]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.5}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>
      <RoundedBox
        position={[0, height / 2 + 0.03, 0]}
        args={[width + 0.16, 0.07, 0.28]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={frameColor}
          roughness={0.5}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Hinged Door Leaf */}
      <group position={[-width / 2, 0, 0]} ref={leafRef}>
        <RoundedBox
          position={[width / 2, 0, 0]}
          args={[width - 0.02, height - 0.02, 0.075]}
          radius={0.012}
          castShadow
        >
          <meshStandardMaterial
            color={
              isSelected
                ? '#818cf8'
                : isHovered
                ? '#cbd5e1'
                : doorColor
            }
            roughness={0.5}
            metalness={0.15}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        <RoundedBox
          position={[width * 0.5, height * 0.18, 0]}
          args={[width * 0.42, height * 0.32, 0.09]}
          radius={0.008}
        >
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.2}
            roughness={0.2}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        <RoundedBox
          position={[width - 0.12, -0.05, 0]}
          args={[0.1, 0.035, 0.16]}
          radius={0.008}
        >
          <meshStandardMaterial
            color="#f8fafc"
            metalness={0.8}
            roughness={0.2}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

/**
 * High-Detail Scan-Calibrated 3D Counterbalance Warehouse Forklift
 * Scaled to match the exact forklift measured in `4HG Shop.glb` (44" W × 86" H × 100" L)
 */
function RealisticForklift3D({
  size,
  isSelected,
  isHovered,
  clippingPlanes,
}: {
  size: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  clippingPlanes: THREE.Plane[];
}) {
  const [sx, sy, sz] = size;
  const bodyColor = isSelected
    ? '#4f46e5'
    : isHovered
    ? '#fbbf24'
    : '#f59e0b';
  const bodyAccent = isSelected ? '#4338ca' : '#d97706';
  const darkMetal = '#1e293b';
  const chassisBlack = '#0f172a';
  const chromeSteel = '#cbd5e1';
  const steelGray = '#475569';

  // Body sits at the rear 62% of length (Z), forks extend forward +Z
  const bodyLen = sz * 0.62;
  const bodyZ = -sz * 0.16;
  const mastZ = bodyZ + bodyLen * 0.52;

  return (
    <group>
      {/* Lower Heavy Steel Under-Chassis Frame & Wheel Wells */}
      <RoundedBox
        position={[0, -sy * 0.34, bodyZ]}
        args={[sx * 0.82, sy * 0.14, bodyLen * 0.92]}
        radius={0.03}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={chassisBlack}
          roughness={0.6}
          metalness={0.4}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Side Step Plates (Left & Right Cab Entry Steps) */}
      {[-sx * 0.45, sx * 0.45].map((stepX, idx) => (
        <RoundedBox
          key={`step-${idx}`}
          position={[stepX, -sy * 0.32, bodyZ + bodyLen * 0.05]}
          args={[0.06, 0.025, bodyLen * 0.34]}
          radius={0.008}
        >
          <meshStandardMaterial
            color="#334155"
            roughness={0.7}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      ))}

      {/* Main Sculpted Side Body Panels & Engine Hood */}
      <RoundedBox
        position={[0, -sy * 0.2, bodyZ + bodyLen * 0.04]}
        args={[sx * 0.9, sy * 0.28, bodyLen * 0.78]}
        radius={0.055}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.35}
          metalness={0.22}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Side Safety Decal Stripe Panels */}
      {[-sx * 0.455, sx * 0.455].map((sideX, idx) => (
        <RoundedBox
          key={`stripe-${idx}`}
          position={[sideX, -sy * 0.22, bodyZ + bodyLen * 0.05]}
          args={[0.015, sy * 0.09, bodyLen * 0.56]}
          radius={0.005}
        >
          <meshStandardMaterial
            color={darkMetal}
            roughness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      ))}

      {/* Rear Heavy Cast-Iron Rounded Counterweight */}
      <RoundedBox
        position={[0, -sy * 0.19, bodyZ - bodyLen * 0.4]}
        args={[sx * 0.94, sy * 0.34, bodyLen * 0.28]}
        radius={0.09}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={bodyAccent}
          roughness={0.45}
          metalness={0.25}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Rear Counterweight Grill Vent & Tow Pin Pocket */}
      <RoundedBox
        position={[0, -sy * 0.2, bodyZ - bodyLen * 0.535]}
        args={[sx * 0.52, sy * 0.16, 0.03]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={chassisBlack}
          roughness={0.8}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>

      {/* Rear Propane / LP Gas Tank Mounted Horizontally on Back Deck */}
      <group position={[0, -sy * 0.01, bodyZ - bodyLen * 0.38]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, sx * 0.68, 20]} />
          <meshStandardMaterial
            color={chromeSteel}
            roughness={0.35}
            metalness={0.65}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        {/* Tank Mounting Straps */}
        {[-sx * 0.18, sx * 0.18].map((strapX, idx) => (
          <mesh
            key={`strap-${idx}`}
            position={[strapX, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.146, 0.146, 0.03, 16]} />
            <meshStandardMaterial
              color={darkMetal}
              metalness={0.5}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        ))}
      </group>

      {/* Ergonomic Bucket Operator Seat (Cushion, Contoured Backrest, Side Bolsters & Armrests) */}
      <group position={[0, -sy * 0.03, bodyZ - 0.04]}>
        {/* Seat Cushion */}
        <RoundedBox
          position={[0, 0, 0.02]}
          args={[sx * 0.42, 0.07, 0.42]}
          radius={0.025}
          castShadow
        >
          <meshStandardMaterial
            color={chassisBlack}
            roughness={0.65}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* High-Back Contoured Backrest */}
        <RoundedBox
          position={[0, 0.2, -0.16]}
          rotation={[-0.12, 0, 0]}
          args={[sx * 0.4, 0.38, 0.07]}
          radius={0.025}
          castShadow
        >
          <meshStandardMaterial
            color={chassisBlack}
            roughness={0.65}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Padded Armrests */}
        {[-sx * 0.23, sx * 0.23].map((armX, idx) => (
          <RoundedBox
            key={`arm-${idx}`}
            position={[armX, 0.12, 0.0]}
            args={[0.045, 0.035, 0.28]}
            radius={0.01}
          >
            <meshStandardMaterial
              color={darkMetal}
              roughness={0.6}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        ))}
      </group>

      {/* Front Dashboard Console, Steering Column, Wheel & Hydraulic Control Levers */}
      <group position={[0, -sy * 0.04, bodyZ + bodyLen * 0.34]}>
        {/* Angled Dash Cowling */}
        <RoundedBox
          position={[0, -0.04, 0]}
          args={[sx * 0.68, 0.24, 0.22]}
          radius={0.03}
          castShadow
        >
          <meshStandardMaterial
            color={darkMetal}
            roughness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Tilted Steering Column Shaft */}
        <mesh position={[0, 0.14, -0.06]} rotation={[-0.45, 0, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.035, 0.26, 12]} />
          <meshStandardMaterial
            color={chassisBlack}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        {/* Steering Wheel Ring */}
        <mesh position={[0, 0.25, -0.12]} rotation={[1.1, 0, 0]} castShadow>
          <torusGeometry args={[0.13, 0.02, 12, 24]} />
          <meshStandardMaterial
            color={chassisBlack}
            roughness={0.4}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        {/* 3 Hydraulic Mast Control Levers (Lift, Tilt, Side-Shift) */}
        {[0.18, 0.23, 0.28].map((lx, idx) => (
          <group key={`lever-${idx}`} position={[lx, 0.12, -0.02]}>
            <mesh rotation={[-0.3, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
              <meshStandardMaterial
                color={chromeSteel}
                metalness={0.8}
                clippingPlanes={clippingPlanes}
              />
            </mesh>
            <mesh position={[0, 0.08, -0.02]}>
              <sphereGeometry args={[0.018, 12, 12]} />
              <meshStandardMaterial
                color={chassisBlack}
                clippingPlanes={clippingPlanes}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4 Overhead Guard Roll-Cage Pillars (Swept ROPS Cab Frame) */}
      {[
        [-sx * 0.39, bodyZ - bodyLen * 0.34, -0.05],
        [sx * 0.39, bodyZ - bodyLen * 0.34, -0.05],
        [-sx * 0.39, bodyZ + bodyLen * 0.36, 0.08],
        [sx * 0.39, bodyZ + bodyLen * 0.36, 0.08],
      ].map(([px, pz, tiltX], idx) => (
        <RoundedBox
          key={`pillar-${idx}`}
          position={[px, sy * 0.18, pz]}
          rotation={[tiltX, 0, 0]}
          args={[0.05, sy * 0.62, 0.05]}
          radius={0.012}
          castShadow
        >
          <meshStandardMaterial
            color={darkMetal}
            roughness={0.4}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      ))}

      {/* Overhead Guard Canopy Roof with Protective Grill Bars */}
      <group position={[0, sy * 0.47, bodyZ + 0.02]}>
        <RoundedBox
          args={[sx * 0.84, 0.045, bodyLen * 0.78]}
          radius={0.015}
          castShadow
        >
          <meshStandardMaterial
            color={darkMetal}
            roughness={0.4}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Amber LED Flashing Safety Beacon on Roof */}
        <mesh position={[0, 0.06, -bodyLen * 0.28]}>
          <cylinderGeometry args={[0.045, 0.055, 0.08, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#fbbf24"
            emissiveIntensity={1.6}
            roughness={0.2}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        {/* Front Dual LED Work Headlights mounted to Front Cab Pillars */}
        {[-sx * 0.38, sx * 0.38].map((hx, idx) => (
          <RoundedBox
            key={`light-${idx}`}
            position={[hx, -0.06, bodyLen * 0.38]}
            args={[0.07, 0.05, 0.05]}
            radius={0.01}
          >
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fef08a"
              emissiveIntensity={1.5}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        ))}
      </group>

      {/* Dual-Stage Vertical Hydraulic Mast Assembly */}
      <group position={[0, 0, mastZ]}>
        {/* Outer & Inner C-Channel Steel Mast Rails */}
        {[-sx * 0.25, sx * 0.25].map((mx, idx) => (
          <group key={`mast-rail-${idx}`} position={[mx, 0, 0]}>
            <RoundedBox
              args={[0.075, sy * 0.96, 0.1]}
              radius={0.01}
              castShadow
            >
              <meshStandardMaterial
                color={darkMetal}
                roughness={0.35}
                metalness={0.6}
                clippingPlanes={clippingPlanes}
              />
            </RoundedBox>
            <RoundedBox
              position={[idx === 0 ? 0.04 : -0.04, 0.03, 0.01]}
              args={[0.05, sy * 0.9, 0.075]}
              radius={0.008}
            >
              <meshStandardMaterial
                color={steelGray}
                roughness={0.35}
                metalness={0.65}
                clippingPlanes={clippingPlanes}
              />
            </RoundedBox>
          </group>
        ))}

        {/* Horizontal Mast Cross-Braces */}
        {[-sy * 0.35, 0, sy * 0.38].map((cy, idx) => (
          <RoundedBox
            key={`cross-${idx}`}
            position={[0, cy, -0.01]}
            args={[sx * 0.54, 0.055, 0.04]}
            radius={0.008}
          >
            <meshStandardMaterial
              color={darkMetal}
              metalness={0.5}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        ))}

        {/* Center Primary Hydraulic Lift Cylinder + Chrome Piston Rod */}
        <mesh position={[0, -sy * 0.15, 0.01]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, sy * 0.58, 16]} />
          <meshStandardMaterial
            color={chassisBlack}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        <mesh position={[0, sy * 0.22, 0.01]} castShadow>
          <cylinderGeometry args={[0.026, 0.026, sy * 0.42, 16]} />
          <meshStandardMaterial
            color={chromeSteel}
            roughness={0.15}
            metalness={0.9}
            clippingPlanes={clippingPlanes}
          />
        </mesh>

        {/* Lower Tilt Cylinders connecting Cab to Mast */}
        {[-sx * 0.25, sx * 0.25].map((tx, idx) => (
          <mesh
            key={`tilt-${idx}`}
            position={[tx, -sy * 0.32, -0.14]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.022, 0.022, 0.26, 12]} />
            <meshStandardMaterial
              color={chromeSteel}
              roughness={0.2}
              metalness={0.85}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        ))}
      </group>

      {/* Slotted Load Backrest Guard & Fork Carriage Plate */}
      <group position={[0, -sy * 0.18, mastZ + 0.07]}>
        {/* Lower Solid Carriage Bar */}
        <RoundedBox
          position={[0, -0.12, 0]}
          args={[sx * 0.8, 0.14, 0.045]}
          radius={0.008}
          castShadow
        >
          <meshStandardMaterial
            color={chassisBlack}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Upper Load Backrest Frame & Vertical Guard Bars */}
        <RoundedBox
          position={[0, 0.24, 0]}
          args={[sx * 0.8, 0.04, 0.035]}
          radius={0.006}
        >
          <meshStandardMaterial
            color={chassisBlack}
            metalness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {[-0.34, -0.17, 0, 0.17, 0.34].map((frac, idx) => (
          <RoundedBox
            key={`guard-bar-${idx}`}
            position={[sx * frac, 0.06, 0]}
            args={[0.025, 0.34, 0.025]}
            radius={0.005}
          >
            <meshStandardMaterial
              color={chassisBlack}
              metalness={0.5}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        ))}
      </group>

      {/* Two Heavy L-Shaped Forged Steel Forks (Vertical Shank + Horizontal Blade) */}
      {[-sx * 0.22, sx * 0.22].map((fx, idx) => (
        <group key={`fork-${idx}`}>
          {/* Vertical Fork Shank */}
          <RoundedBox
            position={[fx, -sy * 0.33, mastZ + 0.1]}
            args={[0.1, sy * 0.26, 0.038]}
            radius={0.006}
            castShadow
          >
            <meshStandardMaterial
              color={steelGray}
              roughness={0.35}
              metalness={0.75}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
          {/* Horizontal Tapered Fork Blade */}
          <RoundedBox
            position={[fx, -sy * 0.45, sz * 0.27]}
            args={[0.11, 0.038, sz * 0.39]}
            radius={0.008}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={steelGray}
              roughness={0.35}
              metalness={0.75}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
          {/* Yellow Safety Fork Tip */}
          <RoundedBox
            position={[fx, -sy * 0.45, sz * 0.45]}
            args={[0.112, 0.04, 0.06]}
            radius={0.006}
          >
            <meshStandardMaterial
              color="#facc15"
              roughness={0.4}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        </group>
      ))}

      {/* 4 Heavy-Duty Pneumatic Tires with Deep Hubs & Lug Rims (Larger Front Drive Wheels, Smaller Rear Steer Wheels) */}
      {[
        { x: -sx * 0.44, z: bodyZ + bodyLen * 0.32, r: sy * 0.125, w: 0.15 },
        { x: sx * 0.44, z: bodyZ + bodyLen * 0.32, r: sy * 0.125, w: 0.15 },
        { x: -sx * 0.42, z: bodyZ - bodyLen * 0.32, r: sy * 0.095, w: 0.13 },
        { x: sx * 0.42, z: bodyZ - bodyLen * 0.32, r: sy * 0.095, w: 0.13 },
      ].map((whl, idx) => (
        <group
          key={`wheel-${idx}`}
          position={[whl.x, -sy * 0.48 + whl.r, whl.z]}
        >
          {/* Rubber Tire Tread */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[whl.r, whl.r, whl.w, 24]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.85}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
          {/* Steel Wheel Rim Disc */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[whl.r * 0.56, whl.r * 0.56, whl.w + 0.012, 16]}
            />
            <meshStandardMaterial
              color={bodyColor}
              roughness={0.4}
              metalness={0.4}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
          {/* Center Axle Hub Cap */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[whl.r * 0.24, whl.r * 0.24, whl.w + 0.025, 12]}
            />
            <meshStandardMaterial
              color={darkMetal}
              metalness={0.7}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Clean Architectural Office Desk / Workstation Table with Rounded Corners
 */
function ArchitecturalDesk3D({
  size,
  isSelected,
  isHovered,
  clippingPlanes,
}: {
  size: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  clippingPlanes: THREE.Plane[];
}) {
  const [sx, sy, sz] = size;
  const topThick = 0.065;
  const legThick = 0.06;
  const topColor = isSelected
    ? '#4f46e5'
    : isHovered
    ? '#60a5fa'
    : '#cbd5e1';

  return (
    <group>
      <RoundedBox
        position={[0, sy / 2 - topThick / 2, 0]}
        args={[sx, topThick, sz]}
        radius={0.025}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={topColor}
          roughness={0.42}
          clippingPlanes={clippingPlanes}
        />
      </RoundedBox>
      {[
        [-(sx / 2 - legThick), -(sz / 2 - legThick)],
        [sx / 2 - legThick, -(sz / 2 - legThick)],
        [-(sx / 2 - legThick), sz / 2 - legThick],
        [sx / 2 - legThick, sz / 2 - legThick],
      ].map(([lx, lz], i) => (
        <RoundedBox
          key={i}
          position={[lx, -topThick / 2, lz]}
          args={[legThick, sy - topThick, legThick]}
          radius={0.015}
          smoothness={3}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#475569"
            roughness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

/**
 * 3D Computer Workstation, Thermal Label Printer, Ergonomic Office Chair & Tote Bin Models
 */
function AccessoryModel3D({
  kind,
  size,
  isSelected,
  isHovered,
  clippingPlanes,
}: {
  kind: 'computer' | 'printer' | 'chair' | 'tote_bin';
  size: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  clippingPlanes: THREE.Plane[];
}) {
  const [sx, sy, sz] = size;
  const highlight = isSelected ? '#4f46e5' : isHovered ? '#3b82f6' : null;

  if (kind === 'computer') {
    return (
      <group>
        {/* Monitor Stand Base */}
        <RoundedBox
          position={[0, -sy * 0.44, 0]}
          args={[sx * 0.45, 0.03, sz * 0.35]}
          radius={0.01}
          castShadow
        >
          <meshStandardMaterial
            color={highlight || '#475569'}
            roughness={0.4}
            metalness={0.4}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Stand Neck */}
        <RoundedBox
          position={[-sx * 0.08, -sy * 0.15, 0]}
          args={[0.04, sy * 0.5, 0.06]}
          radius={0.01}
          castShadow
        >
          <meshStandardMaterial
            color={highlight || '#64748b'}
            metalness={0.4}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Ultrawide / Dual Curved Monitor Bezel */}
        <RoundedBox
          position={[0, sy * 0.12, 0]}
          args={[0.05, sy * 0.65, sz * 0.92]}
          radius={0.018}
          castShadow
        >
          <meshStandardMaterial
            color={highlight || '#1e293b'}
            roughness={0.3}
            metalness={0.2}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Glowing Screen Surface */}
        <mesh position={[0.028, sy * 0.12, 0]}>
          <boxGeometry args={[0.01, sy * 0.56, sz * 0.86]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.45}
            roughness={0.2}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        {/* Keyboard & Mouse Pad in front */}
        <RoundedBox
          position={[sx * 0.28, -sy * 0.45, 0]}
          args={[0.14, 0.02, sz * 0.55]}
          radius={0.005}
        >
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.4}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      </group>
    );
  }

  if (kind === 'printer') {
    return (
      <group>
        {/* Industrial Zebra Label Printer Body */}
        <RoundedBox
          position={[0, 0, 0]}
          args={[sx, sy, sz]}
          radius={0.05}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={highlight || '#334155'}
            roughness={0.45}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* White Shipping Label Output Slot */}
        <RoundedBox
          position={[sx * 0.48, -sy * 0.1, 0]}
          args={[0.08, sy * 0.35, sz * 0.55]}
          radius={0.01}
        >
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.6}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      </group>
    );
  }

  if (kind === 'chair') {
    return (
      <group>
        {/* Star Base */}
        <RoundedBox
          position={[0, -sy * 0.42, 0]}
          args={[sx * 0.8, 0.06, sz * 0.8]}
          radius={0.02}
          castShadow
        >
          <meshStandardMaterial
            color={highlight || '#334155'}
            roughness={0.5}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Pneumatic Cylinder */}
        <mesh position={[0, -sy * 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, sy * 0.4, 12]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.6}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
        {/* Rounded Seat Cushion */}
        <RoundedBox
          position={[0, 0, 0]}
          args={[sx * 0.82, 0.08, sz * 0.82]}
          radius={0.035}
          castShadow
        >
          <meshStandardMaterial
            color={highlight || '#475569'}
            roughness={0.65}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
        {/* Rounded Backrest */}
        <RoundedBox
          position={[-sx * 0.36, sy * 0.26, 0]}
          args={[0.08, sy * 0.48, sz * 0.76]}
          radius={0.035}
          castShadow
        >
          <meshStandardMaterial
            color={highlight || '#475569'}
            roughness={0.65}
            clippingPlanes={clippingPlanes}
          />
        </RoundedBox>
      </group>
    );
  }

  // Tote Bin / Crate
  return (
    <RoundedBox
      position={[0, 0, 0]}
      args={[sx, sy, sz]}
      radius={0.04}
      smoothness={4}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={highlight || '#2563eb'}
        roughness={0.45}
        clippingPlanes={clippingPlanes}
      />
    </RoundedBox>
  );
}

/**
 * Interactive Wrapper with 3D Drag Gizmo (`TransformControls`) when selected.
 * IMPORTANT: TransformControls is mounted as a sibling using `object={groupRef}` so
 * the mesh group (and its `<Html>` badge) never unmounts/remounts when selected!
 */
function BlueprintInteractiveNode({
  appMode,
  item,
  isSelected,
  isHovered,
  selectedSlotKey,
  onSelectSlot,
  theme,
  clippingPlanes,
  calibrationMode,
  onSelect,
  onHover,
  onUpdate,
  onCalibrateClick,
  searchQuery,
}: {
  appMode: 'view' | 'edit';
  item: BlueprintItem;
  isSelected: boolean;
  isHovered: boolean;
  selectedSlotKey: string | null;
  onSelectSlot: (slotKey: string | null) => void;
  theme: 'daylight' | 'dark';
  clippingPlanes: THREE.Plane[];
  calibrationMode: boolean;
  searchQuery?: string;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onUpdate: (updated: BlueprintItem) => void;
  onCalibrateClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const [sx, sy, sz] = item.size;
  const rotY = item.rotationY || 0;

  const isWall =
    item.kind === 'perimeter_wall' ||
    item.kind === 'interior_wall' ||
    item.kind === 'alcove_wall';

  const mappedSlotCount = !item.isNonInventory && item.shelfLocations
    ? Object.values(item.shelfLocations).filter(
        (s) => s.locationCode || s.odooLocationId || s.shortCode
      ).length
    : 0;

  return (
    <>
      <group
        ref={groupRef}
        position={item.position}
        rotation={[0, rotY, 0]}
        onPointerDown={(e) => {
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          if (pointerDownPos.current) {
            const dx = Math.abs(e.clientX - pointerDownPos.current.x);
            const dy = Math.abs(e.clientY - pointerDownPos.current.y);
            if (dx > 5 || dy > 5) return;
          }
          if (calibrationMode) {
            onCalibrateClick(e);
            return;
          }
          e.stopPropagation();
          if (item.kind === 'overhead_door' || item.kind === 'service_door') {
            if (isSelected) {
              onUpdate({ ...item, isOpen: !item.isOpen });
            } else {
              onSelect();
              onUpdate({ ...item, isOpen: !item.isOpen });
            }
            return;
          }
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => {
          onHover(false);
        }}
      >
        {isWall ? (
          <RoundedBox
            args={[sx, sy, sz]}
            radius={0.04}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={
                isSelected
                  ? '#8DDB05'
                  : isHovered
                  ? '#a3e635'
                  : item.kind === 'alcove_wall'
                  ? '#cbb8a9'
                  : theme === 'daylight'
                  ? '#b0bac9'
                  : '#334155'
              }
              roughness={0.5}
              metalness={0.05}
              clippingPlanes={clippingPlanes}
            />
          </RoundedBox>
        ) : item.kind === 'overhead_door' ? (
          <RealisticOverheadDoor3D
            width={sx}
            height={sy}
            isOpen={item.isOpen ?? false}
            isSelected={isSelected}
            isHovered={isHovered}
            clippingPlanes={clippingPlanes}
          />
        ) : item.kind === 'service_door' ? (
          <RealisticServiceDoor3D
            width={sx}
            height={sy}
            isOpen={item.isOpen ?? false}
            isSelected={isSelected}
            isHovered={isHovered}
            doorColor={item.doorColor || '#9ca3af'}
            clippingPlanes={clippingPlanes}
          />
        ) : item.kind === 'forklift' ? (
          <RealisticForklift3D
            size={[sx, sy, sz]}
            isSelected={isSelected}
            isHovered={isHovered}
            clippingPlanes={clippingPlanes}
          />
        ) : item.kind === 'work_station_rack' ? (
          <WorkBenchRackWithLight3D
            size={[sx, sy, sz]}
            bays={item.bays ?? 1}
            showBoxes={item.showBoxes ?? true}
            isSelected={isSelected}
            isHovered={isHovered}
            theme={theme}
            searchQuery={searchQuery}
            clippingPlanes={clippingPlanes}
          />
        ) : item.kind === 'rack' || item.kind === 'workbench' ? (
          <ArchitecturalRack3D
            size={[sx, sy, sz]}
            bays={item.bays ?? (item.kind === 'rack' ? 3 : 2)}
            levels={item.levels ?? 3}
            rows={item.rows ?? 1}
            showBoxes={item.showBoxes ?? true}
            isNonInventory={item.isNonInventory}
            locationPrefix={item.locationPrefix}
            shelfLocations={item.shelfLocations}
            selectedSlotKey={isSelected ? selectedSlotKey : null}
            onSelectSlot={(slotKey) => {
              onSelect();
              onSelectSlot(slotKey);
            }}
            isSelected={isSelected}
            isHovered={isHovered}
            theme={theme}
            searchQuery={searchQuery}
            clippingPlanes={clippingPlanes}
          />
        ) : item.kind === 'desk' ? (
          <ArchitecturalDesk3D
            size={[sx, sy, sz]}
            isSelected={isSelected}
            isHovered={isHovered}
            clippingPlanes={clippingPlanes}
          />
        ) : (
          <AccessoryModel3D
            kind={item.kind as 'computer' | 'printer' | 'chair' | 'tote_bin'}
            size={[sx, sy, sz]}
            isSelected={isSelected}
            isHovered={isHovered}
            clippingPlanes={clippingPlanes}
          />
        )}

        {(isHovered || isSelected) && (
          <Html
            position={[0, sy * 0.5 + 0.25, 0]}
            center
            distanceFactor={15}
            style={{ pointerEvents: 'none' }}
          >
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-semibold shadow-lg whitespace-nowrap border border-[#8DDB05]/40 flex items-center gap-2">
              {item.isNonInventory ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                  Basic Storage (Non-Inventory)
                </span>
              ) : item.zone && (item.rowNumber || item.rackNumber) ? (
                <span className="px-1.5 py-0.5 rounded bg-[#8DDB05] text-slate-950 font-mono text-[10px] font-bold">
                  Zone {item.zone} • Row {String(item.rowNumber || item.rackNumber).padStart(2, '0')}
                </span>
              ) : item.locationPrefix ? (
                <span className="px-1.5 py-0.5 rounded bg-[#8DDB05] text-slate-950 font-mono text-[10px] font-bold">
                  {item.locationPrefix}
                </span>
              ) : null}
              <span>
                {item.name} • {formatFeetInches(sx)} × {formatFeetInches(sz)}
                {item.kind === 'rack' || item.kind === 'workbench'
                  ? ` (${item.bays ?? 3} bays × ${item.levels ?? 3} tiers)`
                  : ''}
                {mappedSlotCount > 0 ? ` • ${mappedSlotCount} Odoo locs` : ''}
              </span>
            </div>
          </Html>
        )}
      </group>

      {appMode === 'edit' && isSelected && !calibrationMode && (
        <TransformControls
          object={groupRef}
          mode="translate"
          onMouseUp={() => {
            if (groupRef.current) {
              const p = groupRef.current.position;
              onUpdate({
                ...item,
                position: [
                  Number(p.x.toFixed(3)),
                  Number(p.y.toFixed(3)),
                  Number(p.z.toFixed(3)),
                ],
              });
            }
          }}
        />
      )}
    </>
  );
}

export function WarehouseModel({
  appMode,
  displayMode,
  theme,
  roofCutoffY,
  meshOverrides,
  blueprintItems,
  selectedBlueprintId,
  selectedSlotKey,
  cutoutBoxes,
  selectedMeshIndex,
  editModelMode,
  calibrationMode,
  searchQuery,
  onSelectMesh,
  onSelectBlueprintItem,
  onSelectSlot,
  onUpdateBlueprintItem,
  onCalibrateClick,
}: WarehouseModelProps) {
  const gltf = useGLTF('/models/warehouse.glb');
  const [hoveredMesh, setHoveredMesh] = useState<number | null>(null);
  const [hoveredBpId, setHoveredBpId] = useState<string | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const clippingPlanes = useMemo(() => {
    if (roofCutoffY >= 1.65) return [];
    return [new THREE.Plane(new THREE.Vector3(0, -1, 0), roofCutoffY)];
  }, [roofCutoffY]);

  const extractedMeshes = useMemo<ExtractedMesh[]>(() => {
    const list: ExtractedMesh[] = [];
    let idx = 0;
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry.clone();
        if (!geom.attributes.normal) {
          geom.computeVertexNormals();
        }
        list.push({
          index: idx,
          geometry: geom,
          originalMaterial: mesh.material,
        });
        idx++;
      }
    });
    return list;
  }, [gltf.scene]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: ThreeEvent<MouseEvent>, meshIndex: number) => {
    if (pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.clientY - pointerDownPos.current.y);
      if (dx > 5 || dy > 5) return;
    }

    if (calibrationMode) {
      e.stopPropagation();
      const pt: [number, number, number] = [
        Number(e.point.x.toFixed(2)),
        Number(e.point.y.toFixed(2)),
        Number(e.point.z.toFixed(2)),
      ];
      onCalibrateClick(pt, meshIndex);
      return;
    }

    if (editModelMode && meshIndex >= 0) {
      e.stopPropagation();
      onSelectMesh(meshIndex);
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Base Architectural Floor Slab (Tucked inside the rounded wall footprint so zero corners poke out!) */}
      <group position={[0, -1.58, -0.15]}>
        <RoundedBox
          receiveShadow
          position={[0, 0.0, 0]}
          args={[12.0, 0.05, 17.1]}
          radius={0.02}
          smoothness={4}
          onPointerDown={handlePointerDown}
          onClick={(e) => handleClick(e, -1)}
        >
          <meshStandardMaterial
            color={theme === 'daylight' ? '#94a3b8' : '#1e293b'}
            roughness={0.75}
            metalness={0.08}
          />
        </RoundedBox>
      </group>

      {/* CLEAN BLUEPRINT MODE */}
      {displayMode === 'clean_shell' && (
        <group position={[0, 0, 0]}>
          {/* Single Seamless Monolithic Wall Structure with Dynamic Cutouts for All Doors */}
          <UnifiedArchitecturalWalls
            theme={theme}
            clippingPlanes={clippingPlanes}
            doors={blueprintItems.filter(
              (b) => b.kind === 'overhead_door' || b.kind === 'service_door'
            )}
          />

          {/* Separate Enclosed Office Floor Zone Highlight (Inset inside rounded office walls) */}
          <mesh position={[-3.55, -1.552, 4.65]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 7.1]} />
            <meshStandardMaterial
              color={theme === 'daylight' ? '#8b95a5' : '#0f172a'}
              roughness={0.8}
            />
          </mesh>

          {/* Render All Interactive Shelves, Racks, Doors, Forklifts, Desks, Computers & Accessories */}
          {blueprintItems
            .filter((item) => item.visible)
            .map((item) => (
              <BlueprintInteractiveNode
                key={item.id}
                appMode={appMode}
                item={item}
                isSelected={selectedBlueprintId === item.id}
                isHovered={hoveredBpId === item.id}
                selectedSlotKey={selectedSlotKey}
                onSelectSlot={onSelectSlot}
                theme={theme}
                clippingPlanes={clippingPlanes}
                calibrationMode={calibrationMode}
                searchQuery={searchQuery}
                onSelect={() => onSelectBlueprintItem(item.id)}
                onHover={(hov) =>
                  setHoveredBpId(hov ? item.id : hoveredBpId === item.id ? null : hoveredBpId)
                }
                onUpdate={onUpdateBlueprintItem}
                onCalibrateClick={(e) => handleClick(e, -1)}
              />
            ))}
        </group>
      )}

      {/* 11 Sub-Meshes from 4HG Shop.glb */}
      {displayMode !== 'clean_shell' &&
        extractedMeshes.map((item) => {
          const override = meshOverrides[item.index] ?? {
            meshIndex: item.index,
            name: `Scan Segment #${item.index + 1}`,
            visible: true,
            colorOverride: null,
            opacity: 1,
            positionOffset: [0, 0, 0],
          };

          if (!override.visible) return null;

          const isSelected = selectedMeshIndex === item.index;
          const isHovered = hoveredMesh === item.index && editModelMode;
          const baseStylizedColor =
            override.colorOverride ||
            (theme === 'daylight' ? '#e2e8f0' : '#334155');

          return (
            <group key={item.index} position={override.positionOffset}>
              <mesh
                geometry={item.geometry}
                castShadow={displayMode !== 'ghost'}
                receiveShadow
                onPointerDown={handlePointerDown}
                onClick={(e) => handleClick(e, item.index)}
                onPointerOver={(e) => {
                  if (editModelMode || calibrationMode) {
                    e.stopPropagation();
                    setHoveredMesh(item.index);
                  }
                }}
                onPointerOut={() => {
                  if (hoveredMesh === item.index) setHoveredMesh(null);
                }}
              >
                {displayMode === 'realistic' && !override.colorOverride ? (
                  <primitive
                    object={item.originalMaterial}
                    attach="material"
                    transparent={override.opacity < 1}
                    opacity={override.opacity}
                    clippingPlanes={clippingPlanes}
                  />
                ) : displayMode === 'ghost' ? (
                  <meshStandardMaterial
                    color={override.colorOverride || '#38bdf8'}
                    transparent
                    opacity={0.32 * override.opacity}
                    wireframe
                    clippingPlanes={clippingPlanes}
                  />
                ) : (
                  <meshStandardMaterial
                    color={
                      isSelected
                        ? '#3b82f6'
                        : isHovered
                        ? '#60a5fa'
                        : baseStylizedColor
                    }
                    roughness={0.78}
                    metalness={0.08}
                    flatShading
                    transparent={override.opacity < 1}
                    opacity={override.opacity}
                    clippingPlanes={clippingPlanes}
                    clipShadows
                  />
                )}

                {(isSelected || isHovered) && (
                  <Edges
                    threshold={25}
                    color={isSelected ? '#2563eb' : '#38bdf8'}
                  />
                )}
              </mesh>
            </group>
          );
        })}

      {/* Interactive Cutout / Mask Boxes */}
      {cutoutBoxes
        .filter((box) => box.active)
        .map((box) => (
          <group key={box.id} position={box.position}>
            <RoundedBox
              receiveShadow
              castShadow={box.mode !== 'highlight_zone'}
              args={box.size}
              radius={0.03}
            >
              <meshStandardMaterial
                color={box.color}
                roughness={0.6}
                metalness={0.05}
                transparent={box.mode === 'highlight_zone'}
                opacity={box.mode === 'highlight_zone' ? 0.35 : 1}
              />
            </RoundedBox>
          </group>
        ))}
    </group>
  );
}

useGLTF.preload('/models/warehouse.glb');
