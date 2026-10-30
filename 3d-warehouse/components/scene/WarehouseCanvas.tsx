'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Grid,
  Html,
  OrbitControls,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';
import { MOUSE, TOUCH } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  CutoutBox,
  DisplayMode,
  FacilityMarker,
  FsdVisionSettingsConfig,
  MeshOverride,
} from '@/lib/markers';
import { BlueprintItem } from '@/lib/blueprint-geometry';
import { CardinalFacing, getCardinalMapping } from '@/lib/compass';
import { UnifiSettingsConfig } from '@/components/ui/SettingsDrawer';
import { WarehouseModel } from './WarehouseModel';
import { FacilityMarkers } from './FacilityMarkers';
import { CameraSpatialVision } from './CameraSpatialVision';

interface WarehouseCanvasProps {
  appMode: 'view' | 'edit';
  displayMode: DisplayMode;
  theme: 'daylight' | 'dark';
  roofCutoffY: number;
  markers: FacilityMarker[];
  selectedMarker: FacilityMarker | null;
  meshOverrides: MeshOverride[];
  blueprintItems: BlueprintItem[];
  selectedBlueprintId: string | null;
  selectedSlotKey: string | null;
  cutoutBoxes: CutoutBox[];
  selectedMeshIndex: number | null;
  editModelMode: boolean;
  calibrationMode: boolean;
  panMode: boolean;
  calibratedPoint: [number, number, number] | null;
  searchQuery?: string;
  showCameraFeeds3D?: boolean;
  showSpatialVision3D?: boolean;
  fsdConfig?: FsdVisionSettingsConfig;
  unifiConfig?: UnifiSettingsConfig;
  cardinalFacing?: CardinalFacing;
  onSelectCardinalFacing?: (facing: CardinalFacing) => void;
  isFsdSettingsOpen?: boolean;
  selectedFsdCameraId?: string;
  onSelectFsdCameraId?: (id: string) => void;
  onUpdateMarker?: (updated: FacilityMarker) => void;
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
  cameraCommand: {
    type: 'reset' | 'zoom_in' | 'zoom_out' | 'top_down' | 'focus' | null;
    target?: [number, number, number];
    position?: [number, number, number];
    timestamp: number;
  };
  onSelectMarker: (marker: FacilityMarker) => void;
  onSelectMesh: (meshIndex: number) => void;
  onSelectBlueprintItem: (id: string) => void;
  onSelectSlot: (slotKey: string | null) => void;
  onUpdateBlueprintItem: (updated: BlueprintItem) => void;
  onCalibrateClick: (point: [number, number, number], meshIndex?: number) => void;
}

function SceneLoader() {
  const { progress, active } = useProgress();
  if (!active) return null;

  return (
    <Html center>
      <div className="w-72 p-5 rounded-2xl bg-slate-900/95 text-white border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#8DDB05]/20 border border-[#8DDB05]/40 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#8DDB05] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold tracking-tight">
            Loading 4HG Shop Digital Twin
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Streaming 3D facility geometry ({Math.round(progress)}%)
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8DDB05] transition-all duration-200 rounded-full"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

function CameraRig({
  selectedMarker,
  cameraCommand,
  panMode,
}: {
  selectedMarker: FacilityMarker | null;
  cameraCommand: WarehouseCanvasProps['cameraCommand'];
  panMode: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const desiredTarget = useRef<THREE.Vector3 | null>(null);
  const desiredPosition = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);
  const [spacePressed, setSpacePressed] = useState(false);

  // Hold Spacebar to pan with Left-Click Drag
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const isPanActive = panMode || spacePressed;

  useEffect(() => {
    document.body.style.cursor = isPanActive ? 'grab' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [isPanActive]);

  // Real-time camera azimuth angle tracking for compass widget
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const updateCompassAzimuth = () => {
      const target = controls.target;
      const dx = camera.position.x - target.x;
      const dz = camera.position.z - target.z;
      const rad = Math.atan2(dx, dz);
      const deg = (rad * 180) / Math.PI;
      document.documentElement.style.setProperty(
        '--camera-azimuth-deg',
        `${deg.toFixed(2)}deg`
      );
    };

    controls.addEventListener('change', updateCompassAzimuth);
    updateCompassAzimuth();

    return () => {
      controls.removeEventListener('change', updateCompassAzimuth);
    };
  }, [camera]);

  // Smooth focus when a marker is selected
  useEffect(() => {
    if (selectedMarker) {
      const [x, y, z] = selectedMarker.position;
      desiredTarget.current = new THREE.Vector3(x, y, z);
      desiredPosition.current = new THREE.Vector3(x + 4.8, y + 3.6, z + 5.2);
      isAnimating.current = true;
    }
  }, [selectedMarker]);

  // Handle explicit viewport toolbar commands (+, -, reset, top_down)
  useEffect(() => {
    if (!cameraCommand.type) return;
    if (cameraCommand.type === 'reset') {
      desiredTarget.current = new THREE.Vector3(0, -0.5, 0);
      desiredPosition.current = new THREE.Vector3(13.5, 10.5, 14.5);
      isAnimating.current = true;
    } else if (cameraCommand.type === 'top_down') {
      desiredTarget.current = new THREE.Vector3(0, -0.5, 0);
      desiredPosition.current = new THREE.Vector3(0.01, 21, 0.01);
      isAnimating.current = true;
    } else if (cameraCommand.type === 'zoom_in') {
      const target = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
      const dir = camera.position.clone().sub(target).multiplyScalar(0.75);
      desiredTarget.current = target.clone();
      desiredPosition.current = target.clone().add(dir);
      isAnimating.current = true;
    } else if (cameraCommand.type === 'zoom_out') {
      const target = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
      const dir = camera.position.clone().sub(target).multiplyScalar(1.3);
      desiredTarget.current = target.clone();
      desiredPosition.current = target.clone().add(dir);
      isAnimating.current = true;
    } else if (cameraCommand.type === 'focus' && cameraCommand.target) {
      const [tx, ty, tz] = cameraCommand.target;
      desiredTarget.current = new THREE.Vector3(tx, ty, tz);
      desiredPosition.current = cameraCommand.position
        ? new THREE.Vector3(...cameraCommand.position)
        : new THREE.Vector3(tx + 4.2, ty + 3.2, tz + 4.6);
      isAnimating.current = true;
    }
  }, [cameraCommand, camera]);

  useFrame((_, delta) => {
    if (!isAnimating.current || !controlsRef.current) return;
    const step = Math.min(1, delta * 5.5);

    if (desiredTarget.current) {
      controlsRef.current.target.lerp(desiredTarget.current, step);
    }
    if (desiredPosition.current) {
      camera.position.lerp(desiredPosition.current, step);
    }
    controlsRef.current.update();

    const target = controlsRef.current.target;
    const dx = camera.position.x - target.x;
    const dz = camera.position.z - target.z;
    const rad = Math.atan2(dx, dz);
    const deg = (rad * 180) / Math.PI;
    document.documentElement.style.setProperty(
      '--camera-azimuth-deg',
      `${deg.toFixed(2)}deg`
    );

    if (
      desiredPosition.current &&
      camera.position.distanceTo(desiredPosition.current) < 0.08
    ) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      screenSpacePanning={true}
      mouseButtons={{
        LEFT: isPanActive ? MOUSE.PAN : MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
      }}
      touches={{
        ONE: isPanActive ? TOUCH.PAN : TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN,
      }}
      minDistance={2.2}
      maxDistance={38}
      maxPolarAngle={Math.PI / 2 - 0.03} // Prevent going below ground plane
      onStart={() => {
        // Stop auto-lerping immediately when user grabs the scene
        isAnimating.current = false;
      }}
    />
  );
}

function WarehouseGroundCompass3D({
  cardinalFacing = 'north',
  onSelectCardinalFacing,
  showMakeNorthButtons,
}: {
  cardinalFacing?: CardinalFacing;
  onSelectCardinalFacing?: (facing: CardinalFacing) => void;
  showMakeNorthButtons?: boolean;
}) {
  const mapping = getCardinalMapping(cardinalFacing);

  const sides: {
    id: string;
    direction: 'North' | 'East' | 'South' | 'West';
    landmark: string;
    pos: [number, number, number];
    facingToMakeNorth: CardinalFacing;
  }[] = [
    {
      id: 'wall-neg-z',
      direction: mapping.mainDoorWall,
      landmark: "12' Main Roll-Up Door & Service Door",
      pos: [0, -1.62, -10.3],
      facingToMakeNorth: 'north',
    },
    {
      id: 'wall-pos-z',
      direction: mapping.oppositeDoorWall,
      landmark: "10' Roll-Up Door & Office Entry",
      pos: [0, -1.62, 10.0],
      facingToMakeNorth: 'south',
    },
    {
      id: 'wall-pos-x',
      direction: mapping.zoneARacksWall,
      landmark: 'Drive-Through Aisle & Zone B Side',
      pos: [7.8, -1.62, 0],
      facingToMakeNorth: 'west',
    },
    {
      id: 'wall-neg-x',
      direction: mapping.officeWall,
      landmark: 'Office & Zone A Racks Back Wall',
      pos: [-7.8, -1.62, 0],
      facingToMakeNorth: 'east',
    },
  ];

  return (
    <group name="warehouse-3d-compass-banners">
      {sides.map((side) => {
        const isNorth = side.direction === 'North';
        return (
          <Html
            key={side.id}
            position={side.pos}
            center
            distanceFactor={20}
            zIndexRange={[8, 0]}
          >
            <div
              className={`select-none px-3 py-1.5 rounded-2xl border shadow-lg backdrop-blur-md flex items-center gap-2 whitespace-nowrap transition ${
                isNorth
                  ? 'bg-slate-950/90 border-red-500/80 text-white ring-2 ring-red-500/20'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
              }`}
            >
              <span
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-extrabold uppercase tracking-wider ${
                  isNorth
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isNorth ? '🧭 NORTH' : side.direction.toUpperCase()}
              </span>
              <span className="text-[10px] font-medium text-slate-300">
                {side.landmark}
              </span>
              {showMakeNorthButtons && !isNorth && onSelectCardinalFacing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCardinalFacing(side.facingToMakeNorth);
                  }}
                  className="pointer-events-auto ml-1 px-2 py-0.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[9.5px] font-bold transition cursor-pointer shadow"
                >
                  Set as North
                </button>
              )}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

export function WarehouseCanvas({
  appMode,
  displayMode,
  theme,
  roofCutoffY,
  markers,
  selectedMarker,
  meshOverrides,
  blueprintItems,
  selectedBlueprintId,
  selectedSlotKey,
  cutoutBoxes,
  selectedMeshIndex,
  editModelMode,
  calibrationMode,
  panMode,
  calibratedPoint,
  searchQuery,
  showCameraFeeds3D,
  showSpatialVision3D,
  fsdConfig,
  unifiConfig,
  cardinalFacing,
  onSelectCardinalFacing,
  isFsdSettingsOpen,
  selectedFsdCameraId,
  onSelectFsdCameraId,
  onUpdateMarker,
  clickGroundToPlaceZone,
  testPreviewPoint,
  onReportRawDetections,
  cameraCommand,
  onSelectMarker,
  onSelectMesh,
  onSelectBlueprintItem,
  onSelectSlot,
  onUpdateBlueprintItem,
  onCalibrateClick,
}: WarehouseCanvasProps) {
  const bgColor = theme === 'daylight' ? '#e8eef7' : '#090d16';

  return (
    <div className="relative w-full h-dvh overflow-hidden select-none touch-none">
      <Canvas
        dpr={[1, 2]}
        shadows="percentage"
        gl={{ localClippingEnabled: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [13.5, 10.5, 14.5], fov: 40, near: 0.1, far: 150 }}
      >
        <color attach="background" args={[bgColor]} />
        <fog
          attach="fog"
          args={[bgColor, 32, 72]}
        />

        {/* Crisp Isometric Architectural Lighting */}
        <ambientLight intensity={theme === 'daylight' ? 1.15 : 0.7} />
        <hemisphereLight
          args={[
            theme === 'daylight' ? '#ffffff' : '#94a3b8',
            theme === 'daylight' ? '#cbd5e1' : '#0f172a',
            0.65,
          ]}
        />
        <directionalLight
          castShadow
          position={[14, 22, 12]}
          intensity={theme === 'daylight' ? 1.55 : 1.1}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0005}
        />
        <directionalLight
          position={[-12, 14, -10]}
          intensity={theme === 'daylight' ? 0.5 : 0.35}
        />

        <CameraRig
          selectedMarker={selectedMarker}
          cameraCommand={cameraCommand}
          panMode={panMode}
        />

        {/* Infinite Ground Grid matching WareTrack clean aesthetic */}
        <Grid
          position={[0, -1.69, 0]}
          args={[60, 60]}
          cellSize={1}
          cellThickness={0.6}
          cellColor={theme === 'daylight' ? '#cbd5e1' : '#1e293b'}
          sectionSize={5}
          sectionThickness={1.1}
          sectionColor={theme === 'daylight' ? '#94a3b8' : '#334155'}
          fadeDistance={48}
          fadeStrength={1.2}
        />

        <Suspense fallback={<SceneLoader />}>
          <WarehouseModel
            appMode={appMode}
            displayMode={displayMode}
            theme={theme}
            roofCutoffY={roofCutoffY}
            meshOverrides={meshOverrides}
            blueprintItems={blueprintItems}
            selectedBlueprintId={selectedBlueprintId}
            selectedSlotKey={selectedSlotKey}
            cutoutBoxes={cutoutBoxes}
            selectedMeshIndex={selectedMeshIndex}
            editModelMode={editModelMode}
            calibrationMode={calibrationMode}
            searchQuery={searchQuery}
            onSelectMesh={onSelectMesh}
            onSelectBlueprintItem={onSelectBlueprintItem}
            onSelectSlot={onSelectSlot}
            onUpdateBlueprintItem={onUpdateBlueprintItem}
            onCalibrateClick={onCalibrateClick}
          />

          <WarehouseGroundCompass3D
            cardinalFacing={cardinalFacing}
            onSelectCardinalFacing={onSelectCardinalFacing}
            showMakeNorthButtons={Boolean(isFsdSettingsOpen || appMode === 'edit')}
          />

          <FacilityMarkers
            markers={markers}
            selectedMarkerId={selectedMarker?.id ?? null}
            onSelectMarker={onSelectMarker}
            showCameraFeeds3D={showCameraFeeds3D}
            unifiConfig={unifiConfig}
          />

          <CameraSpatialVision
            enabled={Boolean(showSpatialVision3D)}
            markers={markers}
            unifiConfig={unifiConfig}
            fsdConfig={fsdConfig}
            isCalibrating={Boolean(isFsdSettingsOpen)}
            selectedCameraId={selectedFsdCameraId}
            onSelectCameraId={onSelectFsdCameraId}
            onUpdateCameraMarker={onUpdateMarker}
            clickGroundToPlaceZone={Boolean(clickGroundToPlaceZone)}
            testPreviewPoint={testPreviewPoint}
            onReportRawDetections={onReportRawDetections}
          />

          <ContactShadows
            position={[0, -1.62, 0]}
            opacity={theme === 'daylight' ? 0.32 : 0.5}
            scale={28}
            blur={2.2}
            far={6}
          />
        </Suspense>

        {/* Calibration Target Gizmo when Anchor Calibration Mode is active */}
        {calibrationMode && calibratedPoint && (
          <group position={calibratedPoint}>
            <mesh>
              <sphereGeometry args={[0.16, 20, 20]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.24, 0.32, 32]} />
              <meshBasicMaterial
                color="#ef4444"
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}
      </Canvas>
    </div>
  );
}
