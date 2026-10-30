'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Cloud,
  Compass,
  Crosshair,
  Eye,
  FlipHorizontal,
  FlipVertical,
  MapPin,
  Maximize2,
  Minimize2,
  MousePointerClick,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  CameraVisionMapping,
  DEFAULT_FSD_VISION_CONFIG,
  FacilityMarker,
  FsdVisionSettingsConfig,
  getDefaultCameraVisionMapping,
} from '@/lib/markers';
import { CardinalFacing, getCardinalMapping } from '@/lib/compass';
import { UnifiSettingsConfig } from './SettingsDrawer';

interface FsdVisionSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'daylight' | 'dark';
  fsdConfig: FsdVisionSettingsConfig;
  onUpdateFsdConfig: (next: FsdVisionSettingsConfig) => void;
  cameras: FacilityMarker[];
  selectedCameraId: string;
  onSelectCameraId: (camId: string) => void;
  onUpdateCameraMarker: (updated: FacilityMarker) => void;
  unifiConfig?: UnifiSettingsConfig;
  cardinalFacing: CardinalFacing;
  onSelectCardinalFacing: (facing: CardinalFacing) => void;
  clickGroundToPlaceZone: boolean;
  onToggleClickGroundToPlaceZone: (val: boolean) => void;
  testPreviewPoint: { cameraId: string; u: number; v: number } | null;
  onChangeTestPreviewPoint: (
    pt: { cameraId: string; u: number; v: number } | null
  ) => void;
  onFocus3DCamera?: (
    target: [number, number, number],
    pos?: [number, number, number]
  ) => void;
  latestDetectionsByCamera?: Record<
    string,
    { u: number; v: number; label: string; confidence: number }[]
  >;
  lastCloudSyncTime?: string | null;
  isSyncingCloud?: boolean;
  onPushToCloud?: () => void;
}

export function FsdVisionSettingsPanel({
  isOpen,
  onClose,
  theme,
  fsdConfig,
  onUpdateFsdConfig,
  cameras,
  selectedCameraId,
  onSelectCameraId,
  onUpdateCameraMarker,
  unifiConfig,
  cardinalFacing,
  onSelectCardinalFacing,
  clickGroundToPlaceZone,
  onToggleClickGroundToPlaceZone,
  testPreviewPoint,
  onChangeTestPreviewPoint,
  onFocus3DCamera,
  latestDetectionsByCamera = {},
  lastCloudSyncTime,
  isSyncingCloud = false,
  onPushToCloud,
}: FsdVisionSettingsPanelProps) {
  const isDark = theme === 'dark';
  const [liveSnapshotSrc, setLiveSnapshotSrc] = useState<string | null>(null);
  const [photoClickMode, setPhotoClickMode] = useState<
    'test_3d' | 'block_spot' | 'set_horizon'
  >('test_3d');
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const mapSvgRef = useRef<SVGSVGElement | null>(null);

  const activeCam =
    cameras.find((c) => c.id === selectedCameraId) || cameras[0] || null;
  const activeMapping: CameraVisionMapping | null = activeCam
    ? getDefaultCameraVisionMapping(activeCam)
    : null;

  const cardinalMap = getCardinalMapping(cardinalFacing);

  // Poll live snapshot for the selected camera so the user sees the real camera view
  useEffect(() => {
    if (!isOpen || !activeCam?.metadata.unifiId || !unifiConfig?.apiKey) {
      setLiveSnapshotSrc(null);
      return;
    }

    let cancelled = false;
    const fetchSnap = () => {
      const url = `/api/unifi/snapshot?id=${encodeURIComponent(
        activeCam.metadata.unifiId!
      )}&host=${encodeURIComponent(
        unifiConfig.baseUrl || ''
      )}&apiKey=${encodeURIComponent(
        unifiConfig.apiKey
      )}&consoleId=${encodeURIComponent(
        activeCam.metadata.unifiConsoleId || ''
      )}&allowSelfSigned=${
        unifiConfig.allowSelfSigned !== false
      }&t=${Date.now()}`;

      const img = new Image();
      img.onload = () => {
        if (!cancelled) setLiveSnapshotSrc(url);
      };
      img.src = url;
    };

    fetchSnap();
    const interval = setInterval(fetchSnap, 2200);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, activeCam, unifiConfig]);

  if (!isOpen) return null;

  const updateMapping = (
    patch: Partial<CameraVisionMapping>,
    newPinPos?: [number, number, number]
  ) => {
    if (!activeCam || !activeMapping) return;
    onUpdateCameraMarker({
      ...activeCam,
      position: newPinPos || activeCam.position,
      metadata: {
        ...activeCam.metadata,
        visionMapping: {
          ...activeMapping,
          ...patch,
        },
      },
    });
  };

  // Snap both the Camera Pin and its 3D Ground Zone to one of the 4 exterior walls of the warehouse
  const snapCameraAndZoneToWall = (
    wall: 'neg_z_doors' | 'pos_z_doors' | 'pos_x_yard' | 'neg_x_yard'
  ) => {
    if (!activeCam) return;
    if (wall === 'neg_z_doors') {
      // Outside the Z = -8.75 wall (12' Main Roll-Up Door & Service Door)
      updateMapping(
        {
          enabled: true,
          zoneCenterX: 2.2,
          zoneCenterZ: -13.2,
          zoneWidth: 12.0,
          zoneDepth: 8.5,
          rotationDeg: 180,
          flipHorizontal: false,
          flipDepth: false,
        },
        [5.85, 1.05, -8.65]
      );
      onFocus3DCamera?.([1.5, -1.0, -11.5], [10.5, 11.5, -22.0]);
    } else if (wall === 'pos_z_doors') {
      // Outside the Z = +8.45 wall (10' Roll-Up Door & Office Entry Door)
      updateMapping(
        {
          enabled: true,
          zoneCenterX: 1.8,
          zoneCenterZ: 12.8,
          zoneWidth: 12.0,
          zoneDepth: 8.5,
          rotationDeg: 0,
          flipHorizontal: false,
          flipDepth: false,
        },
        [5.85, 1.05, 8.35]
      );
      onFocus3DCamera?.([1.5, -1.0, 11.5], [10.5, 11.5, 22.0]);
    } else if (wall === 'pos_x_yard') {
      // Outside the X = +6.05 wall (Drive-Through Aisle Side)
      updateMapping(
        {
          enabled: true,
          zoneCenterX: 10.5,
          zoneCenterZ: 0.0,
          zoneWidth: 13.0,
          zoneDepth: 8.5,
          rotationDeg: -90,
          flipHorizontal: false,
          flipDepth: false,
        },
        [5.95, 1.05, 0.0]
      );
      onFocus3DCamera?.([9.5, -1.0, 0.0], [22.0, 11.5, 8.0]);
    } else if (wall === 'neg_x_yard') {
      // Outside the X = -6.05 wall (Office & Racks Back Wall)
      updateMapping(
        {
          enabled: true,
          zoneCenterX: -10.5,
          zoneCenterZ: 0.0,
          zoneWidth: 13.0,
          zoneDepth: 8.5,
          rotationDeg: 90,
          flipHorizontal: false,
          flipDepth: false,
        },
        [-5.95, 1.05, 0.0]
      );
      onFocus3DCamera?.([-9.5, -1.0, 0.0], [-22.0, 11.5, 8.0]);
    }
  };

  const handlePhotoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeCam || !activeMapping) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (photoClickMode === 'set_horizon') {
      const pct = Math.max(5, Math.min(75, Math.round(v * 100)));
      updateMapping({ horizonCutoffPct: pct });
      return;
    }

    if (photoClickMode === 'block_spot') {
      const existing = activeMapping.ignoredRegions || [];
      updateMapping({
        ignoredRegions: [
          ...existing,
          {
            u: Number(u.toFixed(3)),
            v: Number(v.toFixed(3)),
            radius: 0.09,
          },
        ],
      });
      return;
    }

    // Default: 'test_3d' -> Drop the 3D Test Person at this exact spot in the 3D scene!
    onChangeTestPreviewPoint({
      cameraId: activeCam.id,
      u,
      v,
    });
  };

  // Convert pointer position on the 2D Top-Down Mini-Map into 3D world [X, Z]
  const updateZoneFromMiniMapPointer = (clientX: number, clientY: number) => {
    if (!mapSvgRef.current || !activeMapping) return;
    const rect = mapSvgRef.current.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width; // 0..1 -> worldX in [-18..+18]
    const nz = (clientY - rect.top) / rect.height; // 0..1 -> worldZ in [-20..+20]
    let wx = Number(((nx - 0.5) * 36).toFixed(1));
    let wz = Number(((nz - 0.5) * 40).toFixed(1));

    // Keep zone center outside the interior building footprint [-6..+6, -8.8..+8.5]
    if (wx > -6.2 && wx < 6.2 && wz > -9.0 && wz < 8.7) {
      const dTop = Math.abs(-9.0 - wz);
      const dBot = Math.abs(8.7 - wz);
      const dRight = Math.abs(6.2 - wx);
      const dLeft = Math.abs(-6.2 - wx);
      const minD = Math.min(dTop, dBot, dRight, dLeft);
      if (minD === dTop) wz = -12.5;
      else if (minD === dBot) wz = 12.2;
      else if (minD === dRight) wx = 10.0;
      else wx = -10.0;
    }

    updateMapping({
      zoneCenterX: Math.max(-16, Math.min(16, wx)),
      zoneCenterZ: Math.max(-18, Math.min(18, wz)),
    });
  };

  const currentCamDetections = activeCam
    ? latestDetectionsByCamera[activeCam.id] || []
    : [];

  return (
    <div
      className={`fixed top-[var(--hud-top)] left-[calc(1.25rem+var(--safe-left))] z-40 w-[min(26rem,calc(100vw-2.5rem))] max-h-[calc(100dvh-6rem)] rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isDark
            ? 'border-slate-800 bg-slate-950/60'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold leading-tight">
              Visual 3D Vision &amp; Compass Setup
            </div>
            <div className="text-[10px] text-slate-400">
              {lastCloudSyncTime ? `Cloud synced: ${lastCloudSyncTime}` : 'Shared live across all users'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onPushToCloud && (
            <button
              type="button"
              onClick={onPushToCloud}
              disabled={isSyncingCloud}
              className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10.5px] flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="Publish all 3D vision zones and settings to cloud for all users"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce' : ''}`} />
              <span>{isSyncingCloud ? 'Syncing...' : 'Save & Sync'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onChangeTestPreviewPoint(null);
              onToggleClickGroundToPlaceZone(false);
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Visual Setup Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
        {/* STEP 1: VISUAL BUILDING COMPASS (WHICH WALL IS NORTH?) */}
        <div
          className={`p-3 rounded-2xl border space-y-2.5 ${
            isDark
              ? 'bg-slate-800/50 border-slate-700/80'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-sky-400">
              <Compass className="w-3.5 h-3.5" /> 1. Which Side of the Shop is
              NORTH?
            </span>
            <span className="text-[10px] text-slate-400">
              Click any wall below
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Wall Z = -8.75 */}
            <button
              type="button"
              onClick={() => onSelectCardinalFacing('north')}
              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                cardinalMap.mainDoorWall === 'North'
                  ? 'bg-red-500/15 border-red-500 text-white ring-1 ring-red-500/40'
                  : isDark
                  ? 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-extrabold uppercase text-red-400">
                  Currently: {cardinalMap.mainDoorWall}
                </span>
                {cardinalMap.mainDoorWall === 'North' && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[8px] font-bold">
                    NORTH
                  </span>
                )}
              </div>
              <div className="font-bold text-[11px] mt-0.5">
                12&apos; Main Roll-Up Door
              </div>
              <div className="text-[9.5px] text-slate-400">
                + Service Door (Zone A Racks end)
              </div>
            </button>

            {/* Wall Z = +8.45 */}
            <button
              type="button"
              onClick={() => onSelectCardinalFacing('south')}
              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                cardinalMap.oppositeDoorWall === 'North'
                  ? 'bg-red-500/15 border-red-500 text-white ring-1 ring-red-500/40'
                  : isDark
                  ? 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-extrabold uppercase text-red-400">
                  Currently: {cardinalMap.oppositeDoorWall}
                </span>
                {cardinalMap.oppositeDoorWall === 'North' && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[8px] font-bold">
                    NORTH
                  </span>
                )}
              </div>
              <div className="font-bold text-[11px] mt-0.5">
                10&apos; Roll-Up + Office Door
              </div>
              <div className="text-[9.5px] text-slate-400">
                Enclosed Office Room end
              </div>
            </button>

            {/* Wall X = +6.05 */}
            <button
              type="button"
              onClick={() => onSelectCardinalFacing('west')}
              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                cardinalMap.zoneARacksWall === 'North'
                  ? 'bg-red-500/15 border-red-500 text-white ring-1 ring-red-500/40'
                  : isDark
                  ? 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-extrabold uppercase text-red-400">
                  Currently: {cardinalMap.zoneARacksWall}
                </span>
                {cardinalMap.zoneARacksWall === 'North' && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[8px] font-bold">
                    NORTH
                  </span>
                )}
              </div>
              <div className="font-bold text-[11px] mt-0.5">
                Forklift Aisle Long Wall
              </div>
              <div className="text-[9.5px] text-slate-400">
                Side along Zone B Racks
              </div>
            </button>

            {/* Wall X = -6.05 */}
            <button
              type="button"
              onClick={() => onSelectCardinalFacing('east')}
              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                cardinalMap.officeWall === 'North'
                  ? 'bg-red-500/15 border-red-500 text-white ring-1 ring-red-500/40'
                  : isDark
                  ? 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-extrabold uppercase text-red-400">
                  Currently: {cardinalMap.officeWall}
                </span>
                {cardinalMap.officeWall === 'North' && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[8px] font-bold">
                    NORTH
                  </span>
                )}
              </div>
              <div className="font-bold text-[11px] mt-0.5">
                Office &amp; Alcove Back Wall
              </div>
              <div className="text-[9.5px] text-slate-400">
                Behind Office &amp; Zone A Racks
              </div>
            </button>
          </div>
        </div>

        {/* STEP 2: SELECT CAMERA & INTERACTIVE LIVE CAMERA FEED */}
        {activeCam && activeMapping && (
          <div
            className={`p-3 rounded-2xl border space-y-3 ${
              isDark
                ? 'bg-slate-800/50 border-slate-700/80'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-sky-400">
                <Camera className="w-3.5 h-3.5" /> 2. Select Camera &amp; Test on
                Photo
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px]">
                <span className="text-slate-400">Enabled</span>
                <input
                  type="checkbox"
                  checked={activeMapping.enabled}
                  onChange={(e) =>
                    updateMapping({ enabled: e.target.checked })
                  }
                  className="w-3.5 h-3.5 accent-sky-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Camera Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5">
              {cameras.map((cam) => {
                const isSel = cam.id === activeCam.id;
                const detCount = (latestDetectionsByCamera[cam.id] || []).length;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      onSelectCameraId(cam.id);
                      const m = getDefaultCameraVisionMapping(cam);
                      onFocus3DCamera?.([m.zoneCenterX, -1.0, m.zoneCenterZ]);
                    }}
                    className={`px-2 py-2 rounded-xl font-bold text-[11px] border transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      isSel
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate max-w-full">{cam.name}</span>
                    <span
                      className={`text-[9px] font-mono ${
                        isSel ? 'text-slate-900' : 'text-sky-400'
                      }`}
                    >
                      {detCount} active obj
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mode Selector for Clicking on the Live Camera Photo */}
            <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => setPhotoClickMode('test_3d')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  photoClickMode === 'test_3d'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapPin className="w-3 h-3" /> Click Photo = Test in 3D
              </button>
              <button
                type="button"
                onClick={() => setPhotoClickMode('block_spot')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  photoClickMode === 'block_spot'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3 h-3" /> Block False Spot
              </button>
              <button
                type="button"
                onClick={() => setPhotoClickMode('set_horizon')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  photoClickMode === 'set_horizon'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" /> Set Horizon Line
              </button>
            </div>

            {/* Interactive Live Camera Photo with Color-Coded Edges matching 3D Zone */}
            <div
              onClick={handlePhotoClick}
              className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 cursor-crosshair select-none border-t-4 border-b-4 border-l-4 border-r-4 border-t-amber-500 border-b-emerald-500 border-l-blue-500 border-r-purple-500 shadow-inner"
              title="Click anywhere on the camera photo to test where that spot lands in the 3D scene!"
            >
              {liveSnapshotSrc ? (
                <img
                  src={liveSnapshotSrc}
                  alt={activeCam.name}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-[11px]">
                  Loading {activeCam.name} live snapshot...
                </div>
              )}

              {/* Sky / Roof Horizon Cutoff Mask */}
              <div
                style={{ height: `${activeMapping.horizonCutoffPct}%` }}
                className="absolute top-0 inset-x-0 bg-amber-950/45 border-b-2 border-dashed border-amber-400 pointer-events-none flex items-end justify-between px-2 pb-0.5"
              >
                <span className="text-[8.5px] font-mono font-bold text-amber-300 bg-slate-950/80 px-1.5 rounded">
                  ▲ IGNORED SKY / ROOF ({activeMapping.horizonCutoffPct}%)
                </span>
                <span className="text-[8.5px] font-mono font-bold text-amber-300 bg-slate-950/80 px-1.5 rounded">
                  FAR HORIZON EDGE ▲
                </span>
              </div>

              {/* Color-Coded Edge Badges matching the 3D Ground Zone */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-[8.5px] font-mono font-bold text-emerald-300 pointer-events-none">
                ▼ BOTTOM OF VIDEO (GREEN EDGE ON 3D GROUND)
              </div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-blue-950/90 border border-blue-400 text-[8px] font-mono font-bold text-blue-300 pointer-events-none">
                ◀ LEFT
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-400 text-[8px] font-mono font-bold text-purple-300 pointer-events-none">
                RIGHT ▶
              </div>

              {/* Ignored Static False-Positive Circles (Click circle to unblock) */}
              {(activeMapping.ignoredRegions || []).map((reg, idx) => (
                <button
                  key={`ign-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = (activeMapping.ignoredRegions || []).filter(
                      (_, i) => i !== idx
                    );
                    updateMapping({ ignoredRegions: next });
                  }}
                  style={{
                    left: `${reg.u * 100}%`,
                    top: `${reg.v * 100}%`,
                    width: `${reg.radius * 200}%`,
                    height: `${reg.radius * 200}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/35 border-2 border-rose-400 flex items-center justify-center text-[8px] font-mono font-bold text-white hover:bg-rose-500/60 cursor-pointer"
                  title="Blocked false-positive spot (Click to unblock)"
                >
                  ✕
                </button>
              ))}

              {/* Active AI Detections plotted on the Camera Photo */}
              {currentCamDetections.map((det, idx) => (
                <div
                  key={`det-${idx}`}
                  style={{
                    left: `${det.u * 100}%`,
                    top: `${det.v * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-400/40 border-2 border-sky-300 animate-ping absolute" />
                  <button
                    type="button"
                    onClick={() => {
                      const existing = activeMapping.ignoredRegions || [];
                      updateMapping({
                        ignoredRegions: [
                          ...existing,
                          {
                            u: Number(det.u.toFixed(3)),
                            v: Number(det.v.toFixed(3)),
                            radius: 0.09,
                          },
                        ],
                      });
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-sky-400 text-[8.5px] font-mono text-sky-200 hover:bg-rose-600 hover:border-rose-400 hover:text-white transition cursor-pointer whitespace-nowrap shadow"
                    title="Click to block this spot as a false positive"
                  >
                    {det.label} {det.confidence}% • [Block]
                  </button>
                </div>
              ))}

              {/* 3D Test Pin Marker on the Camera Photo */}
              {testPreviewPoint &&
                testPreviewPoint.cameraId === activeCam.id && (
                  <div
                    style={{
                      left: `${testPreviewPoint.u * 100}%`,
                      top: `${testPreviewPoint.v * 100}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-400/30 border-2 border-emerald-400 flex items-center justify-center shadow-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    </div>
                    <span className="mt-0.5 px-1.5 py-0.2 rounded bg-emerald-950/95 border border-emerald-400 text-[8px] font-mono font-bold text-emerald-300 whitespace-nowrap">
                      📍 3D TEST SPOT
                    </span>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>
                💡 Click any doorway or driveway in the photo above to see a{' '}
                <strong className="text-emerald-400">Green 3D Person</strong>{' '}
                appear at that spot in the 3D scene!
              </span>
              {testPreviewPoint && (
                <button
                  type="button"
                  onClick={() => onChangeTestPreviewPoint(null)}
                  className="text-emerald-400 hover:underline font-bold ml-2 whitespace-nowrap cursor-pointer"
                >
                  Clear Pin
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: VISUAL TOP-DOWN MAP & 1-CLICK ZONE PLACEMENT (ZERO SLIDERS!) */}
        {activeCam && activeMapping && (
          <div
            className={`p-3 rounded-2xl border space-y-3 ${
              isDark
                ? 'bg-slate-800/50 border-slate-700/80'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-sky-400">
                <Crosshair className="w-3.5 h-3.5" /> 3. Place &amp; Orient{' '}
                {activeCam.name} Zone
              </span>
              <button
                type="button"
                onClick={() =>
                  onToggleClickGroundToPlaceZone(!clickGroundToPlaceZone)
                }
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  clickGroundToPlaceZone
                    ? 'bg-emerald-500 text-slate-950 shadow animate-pulse'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                }`}
              >
                <MousePointerClick className="w-3 h-3" />
                {clickGroundToPlaceZone
                  ? 'Click 3D Ground Now...'
                  : 'Click in 3D Scene'}
              </button>
            </div>

            {/* 1-Click Snap to Building Wall Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => snapCameraAndZoneToWall('neg_z_doors')}
                className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 hover:border-sky-400 text-slate-200'
                    : 'bg-white border-slate-200 hover:border-sky-500 text-slate-800'
                }`}
              >
                <div className="font-bold text-[10.5px] text-sky-400">
                  Snap to {cardinalMap.mainDoorWall} Doors
                </div>
                <div className="text-[9px] text-slate-400">
                  Outside 12&apos; Main Roll-Up Door
                </div>
              </button>

              <button
                type="button"
                onClick={() => snapCameraAndZoneToWall('pos_z_doors')}
                className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 hover:border-sky-400 text-slate-200'
                    : 'bg-white border-slate-200 hover:border-sky-500 text-slate-800'
                }`}
              >
                <div className="font-bold text-[10.5px] text-sky-400">
                  Snap to {cardinalMap.oppositeDoorWall} Doors
                </div>
                <div className="text-[9px] text-slate-400">
                  Outside 10&apos; Roll-Up + Office Door
                </div>
              </button>

              <button
                type="button"
                onClick={() => snapCameraAndZoneToWall('pos_x_yard')}
                className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 hover:border-sky-400 text-slate-200'
                    : 'bg-white border-slate-200 hover:border-sky-500 text-slate-800'
                }`}
              >
                <div className="font-bold text-[10.5px] text-sky-400">
                  Snap to {cardinalMap.zoneARacksWall} Side Yard
                </div>
                <div className="text-[9px] text-slate-400">
                  Along Forklift Aisle Side Wall
                </div>
              </button>

              <button
                type="button"
                onClick={() => snapCameraAndZoneToWall('neg_x_yard')}
                className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 hover:border-sky-400 text-slate-200'
                    : 'bg-white border-slate-200 hover:border-sky-500 text-slate-800'
                }`}
              >
                <div className="font-bold text-[10.5px] text-sky-400">
                  Snap to {cardinalMap.officeWall} Back Yard
                </div>
                <div className="text-[9px] text-slate-400">
                  Behind Office &amp; Zone A Racks
                </div>
              </button>
            </div>

            {/* Interactive 2D Top-Down Mini-Map (Click or Drag to Move Zone!) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  <strong>Interactive Top-Down Map:</strong> Click or drag to
                  position{' '}
                  <strong className="text-sky-400">{activeCam.name}</strong>{' '}
                  zone
                </span>
              </div>

              <svg
                ref={mapSvgRef}
                viewBox="-18 -20 36 40"
                className="w-full h-56 rounded-2xl bg-slate-950 border border-slate-700 cursor-grab active:cursor-grabbing select-none touch-none"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setIsDraggingMap(true);
                  updateZoneFromMiniMapPointer(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (!isDraggingMap) return;
                  updateZoneFromMiniMapPointer(e.clientX, e.clientY);
                }}
                onPointerUp={() => setIsDraggingMap(false)}
              >
                {/* Exterior Grid Lines */}
                <line
                  x1="-18"
                  y1="0"
                  x2="18"
                  y2="0"
                  stroke="#1e293b"
                  strokeWidth="0.15"
                />
                <line
                  x1="0"
                  y1="-20"
                  x2="0"
                  y2="20"
                  stroke="#1e293b"
                  strokeWidth="0.15"
                />

                {/* Warehouse Building Footprint: X in [-6.05..6.05], Z in [-8.75..8.45] */}
                <rect
                  x="-6.05"
                  y="-8.75"
                  width="12.1"
                  height="17.2"
                  rx="0.3"
                  fill="#1e293b"
                  stroke="#64748b"
                  strokeWidth="0.3"
                />

                {/* Enclosed Office Room: X in [-6.05..-1.18], Z in [0.95..8.45] */}
                <rect
                  x="-6.05"
                  y="0.95"
                  width="4.87"
                  height="7.5"
                  fill="#0f172a"
                  stroke="#475569"
                  strokeWidth="0.2"
                />
                <text
                  x="-3.6"
                  y="4.8"
                  fontSize="1.2"
                  fill="#94a3b8"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  OFFICE
                </text>

                {/* Zone A Racks Indicator */}
                <rect
                  x="-5.4"
                  y="-7.8"
                  width="5.2"
                  height="6.2"
                  fill="#334155"
                  opacity="0.6"
                />
                <text
                  x="-2.8"
                  y="-4.4"
                  fontSize="1.15"
                  fill="#cbd5e1"
                  textAnchor="middle"
                >
                  ZONE A RACKS
                </text>

                {/* Zone B Racks Indicator */}
                <rect
                  x="2.0"
                  y="0.0"
                  width="3.2"
                  height="7.2"
                  fill="#334155"
                  opacity="0.6"
                />
                <text
                  x="3.6"
                  y="3.8"
                  fontSize="1.05"
                  fill="#cbd5e1"
                  textAnchor="middle"
                >
                  ZONE B
                </text>

                {/* 12' Main Overhead Door at Z = -8.75, X = 3.2 */}
                <rect
                  x="1.4"
                  y="-9.1"
                  width="3.6"
                  height="0.7"
                  fill="#8DDB05"
                />
                <text
                  x="3.2"
                  y="-9.6"
                  fontSize="1.15"
                  fill="#8DDB05"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  12&apos; DOOR ({cardinalMap.mainDoorWall})
                </text>

                {/* 10' Opposite Overhead Door at Z = +8.45, X = 2.45 + Office Entry Door */}
                <rect
                  x="0.9"
                  y="8.1"
                  width="3.1"
                  height="0.7"
                  fill="#8DDB05"
                />
                <rect
                  x="-0.75"
                  y="8.1"
                  width="1.0"
                  height="0.6"
                  fill="#38bdf8"
                />
                <text
                  x="1.2"
                  y="10.2"
                  fontSize="1.15"
                  fill="#8DDB05"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  10&apos; DOOR + OFFICE ({cardinalMap.oppositeDoorWall})
                </text>

                {/* Side Cardinal Labels */}
                <text
                  x="15.0"
                  y="0.4"
                  fontSize="1.3"
                  fill="#64748b"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {cardinalMap.zoneARacksWall.toUpperCase()}
                </text>
                <text
                  x="-15.0"
                  y="0.4"
                  fontSize="1.3"
                  fill="#64748b"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {cardinalMap.officeWall.toUpperCase()}
                </text>

                {/* Render All Camera Zones on the Mini-Map */}
                {cameras.map((cam) => {
                  const m = getDefaultCameraVisionMapping(cam);
                  if (!m.enabled) return null;
                  const isSel = cam.id === activeCam.id;
                  const nearY = (m.flipDepth ? 0.5 : -0.5) * m.zoneDepth;
                  const farY = (m.flipDepth ? -0.5 : 0.5) * m.zoneDepth;
                  return (
                    <g
                      key={`map-zone-${cam.id}`}
                      transform={`translate(${m.zoneCenterX}, ${m.zoneCenterZ}) rotate(${m.rotationDeg})`}
                      opacity={isSel ? 1 : 0.35}
                    >
                      <rect
                        x={-m.zoneWidth / 2}
                        y={-m.zoneDepth / 2}
                        width={m.zoneWidth}
                        height={m.zoneDepth}
                        fill={isSel ? '#0ea5e9' : '#0284c7'}
                        fillOpacity={isSel ? 0.28 : 0.12}
                        stroke={isSel ? '#38bdf8' : '#0369a1'}
                        strokeWidth={isSel ? 0.35 : 0.2}
                      />
                      {/* Green Near Edge */}
                      <line
                        x1={-m.zoneWidth / 2}
                        y1={nearY}
                        x2={m.zoneWidth / 2}
                        y2={nearY}
                        stroke="#10b981"
                        strokeWidth={isSel ? 0.65 : 0.35}
                      />
                      {/* Amber Far Horizon Edge */}
                      <line
                        x1={-m.zoneWidth / 2}
                        y1={farY}
                        x2={m.zoneWidth / 2}
                        y2={farY}
                        stroke="#f59e0b"
                        strokeWidth={isSel ? 0.5 : 0.3}
                        strokeDasharray="0.8 0.5"
                      />
                      <text
                        x="0"
                        y="0.4"
                        fontSize="1.3"
                        fill="#ffffff"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {cam.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Visual Button Controls for Rotation, Flip, and Size (Zero Sliders!) */}
            <div className="grid grid-cols-2 gap-2">
              {/* Rotate Controls */}
              <div
                className={`p-2 rounded-xl border flex flex-col gap-1.5 ${
                  isDark
                    ? 'bg-slate-900/70 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400">
                  Rotate Zone ({activeMapping.rotationDeg}°)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        rotationDeg:
                          ((activeMapping.rotationDeg - 45 + 540) % 360) - 180,
                      })
                    }
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 font-bold text-[10px] flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> 45°
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        rotationDeg:
                          ((activeMapping.rotationDeg - 15 + 540) % 360) - 180,
                      })
                    }
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 font-bold text-[10px] cursor-pointer"
                  >
                    -15°
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        rotationDeg:
                          ((activeMapping.rotationDeg + 15 + 540) % 360) - 180,
                      })
                    }
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 font-bold text-[10px] cursor-pointer"
                  >
                    +15°
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        rotationDeg:
                          ((activeMapping.rotationDeg + 45 + 540) % 360) - 180,
                      })
                    }
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 font-bold text-[10px] flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    45° <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Flip & Size Controls */}
              <div
                className={`p-2 rounded-xl border flex flex-col gap-1.5 ${
                  isDark
                    ? 'bg-slate-900/70 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400">
                  Flip &amp; Zone Size
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        flipHorizontal: !activeMapping.flipHorizontal,
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                      activeMapping.flipHorizontal
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Mirror Left & Right"
                  >
                    <FlipHorizontal className="w-3 h-3" /> L/R
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        flipDepth: !activeMapping.flipDepth,
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                      activeMapping.flipDepth
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Swap Near (Green) & Far (Amber) Edges"
                  >
                    <FlipVertical className="w-3 h-3" /> Near/Far
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        zoneWidth: Math.max(5, activeMapping.zoneWidth - 1.5),
                        zoneDepth: Math.max(4, activeMapping.zoneDepth - 1.0),
                      })
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Make Zone Smaller"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMapping({
                        zoneWidth: Math.min(22, activeMapping.zoneWidth + 1.5),
                        zoneDepth: Math.min(16, activeMapping.zoneDepth + 1.0),
                      })
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Make Zone Larger"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SIMPLE FALSE-POSITIVE SENSITIVITY PILLS */}
        <div
          className={`p-3 rounded-2xl border space-y-2.5 ${
            isDark
              ? 'bg-slate-800/50 border-slate-700/80'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-sky-400">
              <ShieldAlert className="w-3.5 h-3.5" /> 4. AI False-Positive
              Sensitivity
            </span>
            {activeMapping &&
              (activeMapping.ignoredRegions || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => updateMapping({ ignoredRegions: [] })}
                  className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear{' '}
                  {activeMapping.ignoredRegions?.length} Blocked Spots
                </button>
              )}
          </div>

          {/* 3-Button Sensitivity Preset instead of a slider */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Sensitive (45%)', val: 45 },
              { label: 'Balanced (58%)', val: 58 },
              { label: 'Strict (72%)', val: 72 },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() =>
                  onUpdateFsdConfig({
                    ...fsdConfig,
                    minConfidencePct: opt.val,
                  })
                }
                className={`py-1.5 px-2 rounded-xl font-bold text-[10.5px] border transition cursor-pointer ${
                  Math.abs(fsdConfig.minConfidencePct - opt.val) <= 6
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="flex items-center gap-1.5 text-[10.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={fsdConfig.showCoverageZones3D}
                onChange={(e) =>
                  onUpdateFsdConfig({
                    ...fsdConfig,
                    showCoverageZones3D: e.target.checked,
                  })
                }
                className="w-3.5 h-3.5 accent-sky-500 rounded cursor-pointer"
              />
              <span>Keep 3D Zones Visible on Ground</span>
            </label>

            <label className="flex items-center gap-1.5 text-[10.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={fsdConfig.showParkedVehicles}
                onChange={(e) =>
                  onUpdateFsdConfig({
                    ...fsdConfig,
                    showParkedVehicles: e.target.checked,
                  })
                }
                className="w-3.5 h-3.5 accent-sky-500 rounded cursor-pointer"
              />
              <span>Show Parked Cars</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
