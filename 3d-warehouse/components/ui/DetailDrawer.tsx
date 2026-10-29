'use client';

import React, { useState } from 'react';
import {
  Activity,
  Box,
  Camera,
  Check,
  Copy,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Package,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  Video,
  Wifi,
  X,
  ExternalLink,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { UnifiSettingsConfig } from './SettingsDrawer';
import {
  CutoutBox,
  FacilityMarker,
  MarkerType,
  MeshOverride,
  ModelVariant,
} from '@/lib/markers';
import {
  BlueprintItem,
  BlueprintItemKind,
  ShelfLocationAssignment,
  buildOdooShortCode,
  generateAllShelfLocations,
  deriveZoneAndRack,
} from '@/lib/blueprint-geometry';
import {
  formatFeetInches,
  inchesToMeters,
  metersToFeetDecimal,
  metersToInches,
  feetDecimalToMeters,
} from '@/lib/units';

interface DetailDrawerProps {
  appMode: 'view' | 'edit';
  theme: 'daylight' | 'dark';
  selectedMarker: FacilityMarker | null;
  selectedBlueprintItem: BlueprintItem | null;
  selectedSlotKey: string | null;
  onSelectSlot: (slotKey: string | null) => void;
  editModelMode: boolean;
  selectedMeshIndex: number | null;
  markers: FacilityMarker[];
  meshOverrides: MeshOverride[];
  blueprintItems: BlueprintItem[];
  cutoutBoxes: CutoutBox[];
  onCloseMarker: () => void;
  onCloseBlueprintItem: () => void;
  onSelectMarker: (marker: FacilityMarker) => void;
  onUpdateMarker: (updated: FacilityMarker) => void;
  onDeleteMarker: (id: string) => void;
  onAddMarker: (marker: FacilityMarker) => void;
  onSelectBlueprintItem: (id: string) => void;
  onAddBlueprintItem: (item: BlueprintItem) => void;
  onUpdateBlueprintItem: (updated: BlueprintItem) => void;
  onDeleteBlueprintItem: (id: string) => void;
  onResetBlueprintItems: () => void;
  onSelectMesh: (meshIndex: number | null) => void;
  onUpdateMeshOverride: (override: MeshOverride) => void;
  onResetMeshOverrides: () => void;
  onToggleCutoutBox: (id: string) => void;
  onAddCutoutBox: () => void;
  onDeleteCutoutBox: (id: string) => void;
  onUpdateCutoutBox: (box: CutoutBox) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  unifiConfig?: UnifiSettingsConfig;
}

export function DetailDrawer({
  appMode,
  theme,
  selectedMarker,
  selectedBlueprintItem,
  selectedSlotKey,
  onSelectSlot,
  editModelMode,
  selectedMeshIndex,
  markers,
  meshOverrides,
  blueprintItems,
  cutoutBoxes,
  onCloseMarker,
  onCloseBlueprintItem,
  onSelectMarker,
  onUpdateMarker,
  onDeleteMarker,
  onAddMarker,
  onSelectBlueprintItem,
  onAddBlueprintItem,
  onUpdateBlueprintItem,
  onDeleteBlueprintItem,
  onResetBlueprintItems,
  onSelectMesh,
  onUpdateMeshOverride,
  onResetMeshOverrides,
  onToggleCutoutBox,
  onAddCutoutBox,
  onDeleteCutoutBox,
  onUpdateCutoutBox,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  unifiConfig,
}: DetailDrawerProps) {
  const isDark = theme === 'dark';
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedRtsp, setCopiedRtsp] = useState(false);
  const [snapshotNonce, setSnapshotNonce] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string | null>(null);
  const [isExpandedFeedOpen, setIsExpandedFeedOpen] = useState(false);

  // Background preloading effect: preserves current frame and loads new frame seamlessly
  React.useEffect(() => {
    if (
      !selectedMarker ||
      selectedMarker.type !== 'camera' ||
      !selectedMarker.metadata.unifiId ||
      !unifiConfig?.apiKey
    ) {
      setCurrentImageSrc(null);
      setIsPreloading(false);
      setSnapshotError(false);
      return;
    }

    const targetUrl = `/api/unifi/snapshot?id=${selectedMarker.metadata.unifiId}&host=${encodeURIComponent(
      unifiConfig.baseUrl || ''
    )}&apiKey=${encodeURIComponent(
      unifiConfig.apiKey || ''
    )}&consoleId=${encodeURIComponent(
      selectedMarker.metadata.unifiConsoleId || ''
    )}&allowSelfSigned=${unifiConfig.allowSelfSigned !== false}&t=${snapshotNonce}`;

    if (!currentImageSrc) {
      setIsPreloading(true);
    }

    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      setCurrentImageSrc(targetUrl);
      setIsPreloading(false);
      setSnapshotError(false);
      setLastSnapshotTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    img.onerror = () => {
      setIsPreloading(false);
      if (!currentImageSrc) {
        setSnapshotError(true);
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [
    selectedMarker?.id,
    selectedMarker?.metadata?.unifiId,
    selectedMarker?.metadata?.unifiConsoleId,
    snapshotNonce,
    unifiConfig?.apiKey,
    unifiConfig?.baseUrl,
  ]);

  // Reset snapshot display when selecting a different camera
  React.useEffect(() => {
    setCurrentImageSrc(null);
    setSnapshotError(false);
    setIsPreloading(true);
  }, [selectedMarker?.metadata?.unifiId]);

  // Close expanded modal on ESC key
  React.useEffect(() => {
    if (!isExpandedFeedOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpandedFeedOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpandedFeedOpen]);

  // Auto-refresh camera snapshots every 4 seconds
  React.useEffect(() => {
    if (
      !autoRefresh ||
      !selectedMarker ||
      selectedMarker.type !== 'camera' ||
      !unifiConfig?.apiKey
    )
      return;
    const interval = setInterval(() => {
      setSnapshotNonce(Date.now());
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedMarker?.id, unifiConfig?.apiKey]);

  const panelClass = isDark
    ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-2xl'
    : 'bg-white/95 border-slate-200 text-slate-900 shadow-2xl';

  const cardClass = isDark
    ? 'bg-slate-800/80 border-slate-700/80 text-slate-100'
    : 'bg-slate-50 border-slate-200/90 text-slate-900 shadow-sm';

  const subCardClass = isDark
    ? 'bg-slate-800/60 border-slate-700/70 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-xs';

  const inputClass = isDark
    ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-[#8DDB05] focus:ring-1 focus:ring-[#8DDB05] outline-none'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#8DDB05] focus:ring-1 focus:ring-[#8DDB05] outline-none shadow-xs';

  const btnSecClass = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-slate-950 shadow-xs';

  const labelClass = isDark
    ? 'text-slate-400 font-semibold'
    : 'text-slate-600 font-bold';

  const headingClass = isDark
    ? 'text-slate-200 font-bold'
    : 'text-slate-800 font-bold';

  const valueClass = isDark
    ? 'text-slate-100 font-bold'
    : 'text-slate-900 font-bold';

  const handleCopyConfig = () => {
    const odooRackMappings = blueprintItems
      .filter(
        (b) =>
          b.kind === 'rack' ||
          b.kind === 'workbench' ||
          b.kind === 'work_station_rack'
      )
      .map((b) => ({
        rackId: b.id,
        rackName: b.name,
        locationPrefix: b.locationPrefix || '',
        positionMeters: b.position,
        dimensionsMeters: b.size,
        structure: {
          rows: b.rows ?? 1,
          bays: b.bays ?? 3,
          levels: b.levels ?? 3,
        },
        shelfLocations: b.shelfLocations || {},
      }));

    const payload = {
      odooRackMappings,
      blueprintItems,
      markers,
      meshOverrides,
      cutoutBoxes,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleQuickAddObject = (
    type: MarkerType,
    variant: ModelVariant,
    label: string
  ) => {
    const idPrefix =
      type === 'camera' ? 'CAM' : type === 'network_ap' ? 'AP' : 'BIN';
    const nextNum = markers.length + 101;
    const newMarker: FacilityMarker = {
      id: `${idPrefix}-${nextNum}`,
      type,
      name: `${label} #${ markers.length + 1 }`,
      position: [0, type === 'inventory_bin' ? -1.45 : 1.1, 0],
      rotation: [0, 0, 0],
      modelVariant: variant,
      metadata:
        type === 'camera'
          ? {
              ip: `10.24.10.${nextNum}`,
              streamUrl: `rtsp://10.24.10.${nextNum}:554/live`,
              description: 'Newly placed security camera node',
              bay: 'Custom Zone',
              status: 'online',
            }
          : type === 'network_ap'
          ? {
              ip: `10.24.20.${nextNum}`,
              linkSpeed: '2.5 Gbps PoE+',
              connectedClients: 12,
              description: 'Newly deployed wireless mesh AP',
              bay: 'Custom Zone',
              status: 'online',
            }
          : {
              sku: `SKU-NEW-${nextNum}`,
              description: `Added ${label} in 3D scene`,
              qty: 120,
              maxQty: 250,
              bay: 'Floor Zone',
              status: 'online',
            },
    };
    onAddMarker(newMarker);
    onSelectMarker(newMarker);
  };

  const handleQuickAddBlueprintFixture = (
    kind: BlueprintItemKind,
    label: string
  ) => {
    const num = blueprintItems.length + 1;
    const isAccessory =
      kind === 'computer' || kind === 'printer' || kind === 'tote_bin';
    const defaultSize: [number, number, number] =
      kind === 'rack'
        ? [inchesToMeters(96), inchesToMeters(84), inchesToMeters(40)] // 8' x 7' x 40"
        : kind === 'work_station_rack'
        ? [inchesToMeters(72), inchesToMeters(84), inchesToMeters(32)] // 6' x 7' x 32" Standing Bench + Light Shelf
        : kind === 'forklift'
        ? [1.12, 2.18, 2.55] // 44" W x 86" H x 100" L (Exact scan scale from 4HG Shop.glb)
        : kind === 'overhead_door'
        ? [3.05, 2.15, 0.28] // 10' x 7' Overhead Door
        : kind === 'service_door'
        ? [0.95, 2.05, 0.28] // 3' x 6'8" Service Door
        : kind === 'workbench'
        ? [inchesToMeters(60), inchesToMeters(60), inchesToMeters(30)] // 5' x 5' x 30"
        : kind === 'desk'
        ? [inchesToMeters(36), inchesToMeters(30), inchesToMeters(72)] // 3' x 30" x 6'
        : kind === 'computer'
        ? [inchesToMeters(16), inchesToMeters(18), inchesToMeters(28)]
        : kind === 'printer'
        ? [inchesToMeters(18), inchesToMeters(14), inchesToMeters(18)]
        : kind === 'chair'
        ? [inchesToMeters(24), inchesToMeters(36), inchesToMeters(24)]
        : [inchesToMeters(24), inchesToMeters(18), inchesToMeters(18)];

    const defaultPos: [number, number, number] =
      kind === 'overhead_door' || kind === 'service_door'
        ? [0, Number((-1.55 + defaultSize[1] * 0.5).toFixed(2)), -8.75]
        : [
            0,
            Number(
              (isAccessory ? -0.6 : -1.55 + defaultSize[1] * 0.5).toFixed(2)
            ),
            0,
          ];

    const newItem: BlueprintItem = {
      id: `${kind.toUpperCase().slice(0, 4)}-${num}`,
      name: `${label} #${num}`,
      kind,
      position: defaultPos,
      size: defaultSize,
      rotationY: 0,
      bays: kind === 'rack' ? 3 : 2,
      levels: kind === 'rack' ? 3 : 3,
      showBoxes: true,
      isOpen: false,
      visible: true,
    };
    onAddBlueprintItem(newItem);
    onSelectBlueprintItem(newItem.id);
  };

  // 0. Selected Blueprint Shelf / Desk / Computer Inspector (Feet & Inches + Rack Bays/Levels + Nudge Controls)
  if (selectedBlueprintItem && !selectedMarker) {
    const updateBpPosMeters = (axis: 0 | 1 | 2, metersVal: number) => {
      const nextPos: [number, number, number] = [
        ...selectedBlueprintItem.position,
      ];
      nextPos[axis] = Number(metersVal.toFixed(4));
      onUpdateBlueprintItem({ ...selectedBlueprintItem, position: nextPos });
    };

    const nudgeByInches = (axis: 0 | 1 | 2, deltaInches: number) => {
      const nextPos: [number, number, number] = [
        ...selectedBlueprintItem.position,
      ];
      nextPos[axis] = Number(
        (nextPos[axis] + inchesToMeters(deltaInches)).toFixed(4)
      );
      onUpdateBlueprintItem({ ...selectedBlueprintItem, position: nextPos });
    };

    const updateBpSizeInches = (axis: 0 | 1 | 2, inchesVal: number) => {
      const safeInches = Math.max(4, inchesVal);
      const nextSize: [number, number, number] = [
        ...selectedBlueprintItem.size,
      ];
      nextSize[axis] = inchesToMeters(safeInches);
      const nextPos: [number, number, number] = [
        ...selectedBlueprintItem.position,
      ];
      // Keep floor-standing shelves/desks/doors/forklifts anchored to floor when changing height
      const isFloorStanding =
        selectedBlueprintItem.kind === 'rack' ||
        selectedBlueprintItem.kind === 'workbench' ||
        selectedBlueprintItem.kind === 'work_station_rack' ||
        selectedBlueprintItem.kind === 'forklift' ||
        selectedBlueprintItem.kind === 'overhead_door' ||
        selectedBlueprintItem.kind === 'service_door' ||
        selectedBlueprintItem.kind === 'desk' ||
        selectedBlueprintItem.kind === 'chair';
      if (axis === 1 && isFloorStanding) {
        nextPos[1] = Number((-1.55 + nextSize[1] * 0.5).toFixed(4));
      }
      onUpdateBlueprintItem({
        ...selectedBlueprintItem,
        size: nextSize,
        position: nextPos,
      });
    };

    const isShelfOrRack =
      selectedBlueprintItem.kind === 'rack' ||
      selectedBlueprintItem.kind === 'workbench' ||
      selectedBlueprintItem.kind === 'work_station_rack';

    const curBays =
      selectedBlueprintItem.bays ??
      (selectedBlueprintItem.kind === 'rack' ? 3 : 2);
    const curLevels = selectedBlueprintItem.levels ?? 3;
    const curRows = selectedBlueprintItem.rows ?? 1;
    const curShowBoxes = selectedBlueprintItem.showBoxes ?? true;

    const { zone: derivedZone, rowNumber: derivedRow, rackNumber: derivedRack } =
      deriveZoneAndRack(selectedBlueprintItem);
    const curZone = (
      selectedBlueprintItem.zone ||
      derivedZone ||
      'A'
    ).toUpperCase();
    const curRowNumber = selectedBlueprintItem.rowNumber
      ? String(selectedBlueprintItem.rowNumber).padStart(2, '0')
      : selectedBlueprintItem.rackNumber
      ? String(selectedBlueprintItem.rackNumber).padStart(2, '0')
      : derivedRow || derivedRack || '01';

    const shelfLocations = selectedBlueprintItem.shelfLocations || {};
    const activeSlotKey = selectedSlotKey || 'R1-B1-L1';

    const parseSlotKey = (key: string) => {
      const m = key.match(/^R(\d+)-B(\d+)-L(\d+)$/);
      if (!m) return { row: 1, bay: 1, level: 1 };
      return {
        row: parseInt(m[1], 10),
        bay: parseInt(m[2], 10),
        level: parseInt(m[3], 10),
      };
    };

    const activeSlotCoords = parseSlotKey(activeSlotKey);
    const activeSlotAssignment: ShelfLocationAssignment = shelfLocations[
      activeSlotKey
    ] || {
      row: activeSlotCoords.row,
      bay: activeSlotCoords.bay,
      level: activeSlotCoords.level,
      locationCode: '',
      shortCode: '',
      odooLocationId: '',
      notes: '',
    };

    const handleUpdateZone = (newZone: string) => {
      const z = newZone.trim().toUpperCase() || 'A';
      onUpdateBlueprintItem({
        ...selectedBlueprintItem,
        zone: z,
        rowNumber: curRowNumber,
        rackNumber: curRowNumber,
        locationPrefix: `${z}-${curRowNumber}`,
      });
    };

    const handleUpdateRowNumber = (newRow: number | string) => {
      const r = String(newRow).padStart(2, '0');
      onUpdateBlueprintItem({
        ...selectedBlueprintItem,
        rowNumber: r,
        rackNumber: r,
        locationPrefix: `${curZone}-${r}`,
      });
    };

    const handleUpdateSlotAssignment = (
      slotKey: string,
      patch: Partial<ShelfLocationAssignment>
    ) => {
      const coords = parseSlotKey(slotKey);
      const existing = shelfLocations[slotKey] || {
        row: coords.row,
        bay: coords.bay,
        level: coords.level,
        locationCode: '',
        shortCode: '',
      };
      const updatedSlot: ShelfLocationAssignment = {
        ...existing,
        ...patch,
      };
      if (patch.shortCode && !patch.locationCode) {
        updatedSlot.locationCode = patch.shortCode;
      } else if (patch.locationCode && !patch.shortCode) {
        updatedSlot.shortCode = patch.locationCode.split('/').pop() || patch.locationCode;
      }
      onUpdateBlueprintItem({
        ...selectedBlueprintItem,
        shelfLocations: {
          ...shelfLocations,
          [slotKey]: updatedSlot,
        },
      });
    };

    const handleResetSlotToStandard = (slotKey: string) => {
      const coords = parseSlotKey(slotKey);
      const baseRow = parseInt(curRowNumber, 10) || 1;
      const slotRow = baseRow + (coords.row - 1);
      const stdCode = buildOdooShortCode(
        curZone,
        slotRow,
        coords.bay,
        coords.level
      );
      handleUpdateSlotAssignment(slotKey, {
        shortCode: stdCode,
        locationCode: stdCode,
      });
    };

    const handleAutoAssignAllSlots = () => {
      const nextLocations = generateAllShelfLocations(
        curZone,
        curRowNumber,
        curBays,
        curLevels,
        curRows,
        shelfLocations
      );
      onUpdateBlueprintItem({
        ...selectedBlueprintItem,
        zone: curZone,
        rowNumber: curRowNumber,
        rackNumber: curRowNumber,
        locationPrefix: `${curZone}-${curRowNumber}`,
        name: `Zone ${curZone} - Row ${curRowNumber}`,
        shelfLocations: nextLocations,
      });
    };

    const isNonInventory = Boolean(selectedBlueprintItem.isNonInventory);
    const mappedCount = isNonInventory
      ? 0
      : Object.values(shelfLocations).filter(
          (s) => s.locationCode || s.odooLocationId || s.shortCode
        ).length;
    const totalSlots = curRows * curBays * curLevels;

    return (
      <aside
        className={`fixed top-20 right-4 bottom-4 w-92 sm:w-96 z-30 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all ${panelClass}`}
      >
        <div
          className={`p-4 border-b flex items-start justify-between gap-2 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#8DDB05] flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Box className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                  isDark
                    ? 'bg-[#8DDB05]/20 text-[#8DDB05]'
                    : 'bg-[#8DDB05]/25 text-[#3f6212]'
                }`}
              >
                {selectedBlueprintItem.id} • {selectedBlueprintItem.kind}
              </span>
              <input
                type="text"
                value={selectedBlueprintItem.name}
                readOnly={appMode === 'view'}
                onChange={(e) =>
                  onUpdateBlueprintItem({
                    ...selectedBlueprintItem,
                    name: e.target.value,
                  })
                }
                className="text-base font-bold tracking-tight mt-0.5 bg-transparent border-b border-transparent focus:border-[#8DDB05] outline-none w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {appMode === 'edit' && (
              <>
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo Edit"
                  className={`p-1.5 rounded-xl border transition ${
                    canUndo
                      ? isDark
                        ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                      : 'border-transparent opacity-30 cursor-not-allowed'
                  }`}
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo Edit"
                  className={`p-1.5 rounded-xl border transition ${
                    canRedo
                      ? isDark
                        ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                      : 'border-transparent opacity-30 cursor-not-allowed'
                  }`}
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onCloseBlueprintItem}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ODOO SHELF LOCATION ASSIGNMENT & API MAPPING (Available in both View & Edit Mode) */}
          {isShelfOrRack && (
            <div
              className={`p-3.5 rounded-2xl border space-y-3 ${
                isDark
                  ? 'border-[#8DDB05]/40 bg-[#8DDB05]/5'
                  : 'border-[#8DDB05]/50 bg-[#8DDB05]/10 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isNonInventory
                      ? 'text-amber-500'
                      : isDark
                      ? 'text-[#8DDB05]'
                      : 'text-[#3f6212]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />{' '}
                  {isNonInventory ? 'Storage Shelf' : 'Odoo Shelf Locations'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                    isNonInventory
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : isDark
                      ? 'bg-[#8DDB05]/20 text-[#8DDB05]'
                      : 'bg-[#8DDB05]/25 text-[#3f6212]'
                  }`}
                >
                  {isNonInventory
                    ? 'Non-Inventory'
                    : `${mappedCount}/${totalSlots} slots mapped`}
                </span>
              </div>

              {/* Non-Inventory Shelf Toggle */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60'
                    : 'border-slate-200 bg-white/90 shadow-xs'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      Non-Inventory Shelf
                    </span>
                    {isNonInventory && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40">
                        General Storage
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Basic supplies / staging. No inventory location in Odoo.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBlueprintItem({
                      ...selectedBlueprintItem,
                      isNonInventory: !isNonInventory,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                    isNonInventory
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-extrabold'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 shadow-xs'
                  }`}
                  title="Toggle between tracked Odoo inventory shelf and basic general storage"
                >
                  {isNonInventory ? 'Non-Inventory' : 'Tracked in Odoo'}
                </button>
              </div>

              {isNonInventory ? (
                <div
                  className={`p-3.5 rounded-xl border text-center space-y-1.5 ${
                    isDark
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-amber-300/60 bg-amber-50 shadow-xs'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                    📦 Basic Storage (Non-Inventory)
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    This shelf is configured as general storage for tools, supplies, or staging. It will not occupy an inventory stock location in Odoo.
                  </p>
                </div>
              ) : (
                <>
                  {/* Odoo Warehouse Hierarchy: Zone & Rack Selection */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Zone Selector */}
                  <div className="space-y-1">
                    <label
                      className={`text-[10px] font-bold uppercase tracking-wider block ${labelClass}`}
                    >
                      Zone
                    </label>
                    <div className="flex items-center gap-1">
                      {['A', 'B', 'C'].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => handleUpdateZone(z)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                            curZone === z
                              ? 'bg-[#8DDB05] text-slate-950 border-transparent shadow-xs'
                              : isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
                          }`}
                        >
                          {z}
                        </button>
                      ))}
                      <input
                        type="text"
                        maxLength={2}
                        value={curZone}
                        onChange={(e) =>
                          handleUpdateZone(e.target.value.toUpperCase())
                        }
                        title="Custom Zone Letter"
                        placeholder="Z"
                        className={`w-9 py-1 text-center rounded-lg text-xs font-bold font-mono uppercase ${inputClass}`}
                      />
                    </div>
                  </div>

                  {/* Rack Number Stepper */}
                  <div className="space-y-1">
                    <label
                      className={`text-[10px] font-bold uppercase tracking-wider block ${labelClass}`}
                    >
                      Row Number
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const num = Math.max(
                            1,
                            (parseInt(curRowNumber, 10) || 1) - 1
                          );
                          handleUpdateRowNumber(num);
                        }}
                        className={`w-7 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={parseInt(curRowNumber, 10) || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) handleUpdateRowNumber(val);
                        }}
                        className={`flex-1 py-1 text-center rounded-lg text-xs font-bold font-mono ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const num = Math.min(
                            99,
                            (parseInt(curRowNumber, 10) || 1) + 1
                          );
                          handleUpdateRowNumber(num);
                        }}
                        className={`w-7 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scheme Preview & 1-Click Auto-Name All Shelves */}
                <div
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                    isDark
                      ? 'border-slate-800 bg-slate-900/60'
                      : 'border-slate-200 bg-white/80 shadow-xs'
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`text-[9px] uppercase font-bold tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Format: Zone-Row-Rack-Shelf
                    </div>
                    <div className="font-mono text-xs font-extrabold text-[#8DDB05] truncate">
                      {buildOdooShortCode(curZone, curRowNumber, 1, 1)}
                      <span
                        className={`text-[10px] font-normal ml-1.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        (WH/Stock/{buildOdooShortCode(curZone, curRowNumber, 1, 1)})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAssignAllSlots}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 transition shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
                    title="Automatically populate all slots with standard Odoo short codes (e.g. A-01-01-01)"
                  >
                    Auto-Name All
                  </button>
                </div>
              </div>

              {/* Interactive Visual Shelf Slot Matrix (Organized by Row -> Tier Top-to-Bottom -> Bay Left-to-Right) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-medium">
                  <span className={labelClass}>
                    Click any shelf slot (or click box in 3D) to assign:
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
                    }`}
                  >
                    Selected: {activeSlotKey}
                  </span>
                </div>

                {Array.from({ length: curRows }).map((_, rIdx) => {
                  const rowNum = rIdx + 1;
                  return (
                    <div
                      key={`matrix-row-${rowNum}`}
                      className={`p-2 rounded-xl border space-y-1.5 shadow-xs ${
                        isDark
                          ? 'border-slate-800 bg-slate-950/40'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {curRows > 1 && (
                        <div
                          className={`text-[10px] font-mono font-bold ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Row {rowNum}
                        </div>
                      )}
                      <div className="space-y-1">
                        {Array.from({ length: curLevels })
                          .map((__, lIdx) => curLevels - lIdx)
                          .map((levelNum) => (
                            <div
                              key={`tier-${levelNum}`}
                              className="flex items-center gap-1"
                            >
                              <span
                                className={`w-10 text-[9px] font-mono font-semibold shrink-0 ${
                                   isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                Tier {levelNum}
                              </span>
                              <div
                                className="grid gap-1 flex-1"
                                style={{
                                  gridTemplateColumns: `repeat(${curBays}, minmax(0, 1fr))`,
                                }}
                              >
                                {Array.from({ length: curBays }).map(
                                  (___, bIdx) => {
                                    const bayNum = bIdx + 1;
                                    const sKey = `R${rowNum}-B${bayNum}-L${levelNum}`;
                                    const slotData = shelfLocations[sKey];
                                    const isSel = activeSlotKey === sKey;
                                    const isMapped = Boolean(
                                      slotData?.locationCode ||
                                        slotData?.odooLocationId ||
                                        slotData?.shortCode
                                    );
                                    const baseRow =
                                      parseInt(curRowNumber, 10) || 1;
                                    const slotRow = baseRow + (rowNum - 1);
                                    const defaultShortCode = buildOdooShortCode(
                                      curZone,
                                      slotRow,
                                      bayNum,
                                      levelNum
                                    );
                                    const displayLabel =
                                      slotData?.shortCode ||
                                      (slotData?.locationCode
                                        ? slotData.locationCode.split('/').pop()
                                        : defaultShortCode);

                                    return (
                                      <button
                                        key={sKey}
                                        type="button"
                                        onClick={() => onSelectSlot(sKey)}
                                        className={`px-1 py-1 rounded-lg text-[8.5px] font-mono font-bold truncate border transition cursor-pointer ${
                                          isSel
                                            ? 'bg-[#8DDB05] text-slate-950 border-slate-950 shadow-md ring-2 ring-[#8DDB05]'
                                            : isMapped
                                            ? isDark
                                              ? 'bg-[#8DDB05]/20 text-[#8DDB05] border-[#8DDB05]/60 hover:bg-[#8DDB05]/30'
                                              : 'bg-[#8DDB05]/25 text-[#3f6212] border-[#8DDB05]/70 hover:bg-[#8DDB05]/35 shadow-xs'
                                            : isDark
                                            ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                                            : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100 hover:text-slate-800 shadow-xs'
                                        }`}
                                        title={
                                          slotData?.locationCode
                                            ? `${sKey}: ${slotData.locationCode}${
                                                slotData.odooLocationId
                                                  ? ` (Odoo ID: ${slotData.odooLocationId})`
                                                  : ''
                                              }`
                                            : `${sKey} (${defaultShortCode})`
                                        }
                                      >
                                        {displayLabel}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Slot Editor Form (Tie directly to Odoo Location Code & Odoo ID) */}
              <div
                className={`p-3 rounded-xl border space-y-2.5 shadow-sm ${
                  isDark
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      isDark ? 'text-[#8DDB05]' : 'text-slate-900'
                    }`}
                  >
                    Slot {activeSlotKey} (Bay {activeSlotCoords.bay}, Shelf{' '}
                    {activeSlotCoords.level}
                    {curRows > 1 ? `, Row ${activeSlotCoords.row}` : ''})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetSlotToStandard(activeSlotKey)}
                      className={`text-[10px] font-bold cursor-pointer transition ${
                        isDark
                          ? 'text-[#8DDB05] hover:underline'
                          : 'text-[#3f6212] hover:underline'
                      }`}
                      title="Reset this slot to standard Zone-Rack-Bay-Shelf code"
                    >
                      Reset Standard
                    </button>
                    {(activeSlotAssignment.locationCode ||
                      activeSlotAssignment.shortCode ||
                      activeSlotAssignment.odooLocationId) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSlotAssignment(activeSlotKey, {
                            locationCode: '',
                            shortCode: '',
                            odooLocationId: '',
                            notes: '',
                          })
                        }
                        className="text-[10px] font-semibold text-red-500 hover:text-red-600 cursor-pointer"
                      >
                        Clear Slot
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className={`text-[9px] uppercase font-bold block mb-0.5 ${labelClass}`}
                    >
                      Location Short Code
                    </label>
                    <input
                      type="text"
                      value={
                        activeSlotAssignment.shortCode ||
                        activeSlotAssignment.locationCode ||
                        ''
                      }
                      placeholder={buildOdooShortCode(
                        curZone,
                        (parseInt(curRowNumber, 10) || 1) +
                          (activeSlotCoords.row - 1),
                        activeSlotCoords.bay,
                        activeSlotCoords.level
                      )}
                      onChange={(e) => {
                        const val = e.target.value.trim().toUpperCase();
                        handleUpdateSlotAssignment(activeSlotKey, {
                          shortCode: val,
                          locationCode: val,
                        });
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label
                      className={`text-[9px] uppercase font-bold block mb-0.5 ${labelClass}`}
                    >
                      Odoo Location ID (API)
                    </label>
                    <input
                      type="text"
                      value={activeSlotAssignment.odooLocationId || ''}
                      placeholder="e.g. 1042"
                      onChange={(e) =>
                        handleUpdateSlotAssignment(activeSlotKey, {
                          odooLocationId: e.target.value,
                        })
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Odoo Full Path & Barcode Preview */}
                <div
                  className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] space-y-0.5 border ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-400">
                      Barcode / Code:
                    </span>
                    <span className="font-bold text-[#8DDB05]">
                      {activeSlotAssignment.shortCode ||
                        activeSlotAssignment.locationCode ||
                        buildOdooShortCode(
                          curZone,
                          (parseInt(curRowNumber, 10) || 1) +
                            (activeSlotCoords.row - 1),
                          activeSlotCoords.bay,
                          activeSlotCoords.level
                        )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-400">Odoo Full Name:</span>
                    <span
                      className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-[190px]"
                      title={`WH/Stock/Zone ${curZone}/Row ${String(
                        (parseInt(curRowNumber, 10) || 1) +
                          (activeSlotCoords.row - 1)
                      ).padStart(2, '0')}/Rack ${String(
                        activeSlotCoords.bay
                      ).padStart(2, '0')}/Shelf ${String(
                        activeSlotCoords.level
                      ).padStart(2, '0')}`}
                    >
                      WH/Stock/Zone {curZone}/Row{' '}
                      {String(
                        (parseInt(curRowNumber, 10) || 1) +
                          (activeSlotCoords.row - 1)
                      ).padStart(2, '0')}
                      /Rack {String(activeSlotCoords.bay).padStart(2, '0')}
                      /Shelf {String(activeSlotCoords.level).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Synced Odoo Products in Stock */}
                {activeSlotAssignment.products &&
                  activeSlotAssignment.products.length > 0 && (
                    <div
                      className={`p-2.5 rounded-xl border space-y-2 ${
                        isDark
                          ? 'border-[#8DDB05]/30 bg-[#8DDB05]/5'
                          : 'border-[#8DDB05]/40 bg-[#8DDB05]/10 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#65a30d] dark:text-[#8DDB05]">
                          <Package className="w-3.5 h-3.5" /> Synced Odoo Stock (
                          {activeSlotAssignment.products.length} parts)
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-[#8DDB05]">
                          Total:{' '}
                          {activeSlotAssignment.totalQuantity ??
                            activeSlotAssignment.products.reduce(
                              (a, b) => a + b.quantity,
                              0
                            )}{' '}
                          units
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {activeSlotAssignment.products.map((p, idx) => (
                          <div
                            key={`prod-${p.id || idx}`}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-slate-900/80 border-slate-800'
                                : 'bg-white border-slate-200 shadow-xs'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-[#8DDB05] truncate">
                                {p.sku}
                              </div>
                              <div
                                className={`text-[10px] truncate ${
                                  isDark ? 'text-slate-300' : 'text-slate-600'
                                }`}
                              >
                                {p.name}
                              </div>
                              {p.lot && (
                                <div className="text-[9px] font-mono text-slate-400">
                                  Lot: {p.lot}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-extrabold bg-[#8DDB05]/20 text-[#65a30d] dark:text-[#8DDB05]">
                                {p.quantity} units
                              </span>
                              {p.reservedQuantity ? (
                                <div className="text-[9px] font-mono text-amber-500 mt-0.5">
                                  {p.reservedQuantity} reserved
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div>
                  <label
                    className={`text-[9px] uppercase font-bold block mb-0.5 ${labelClass}`}
                  >
                    Assigned Products / Bin Notes
                  </label>
                  <input
                    type="text"
                    value={activeSlotAssignment.notes || ''}
                    placeholder="Optional SKU filter or bin description..."
                    onChange={(e) =>
                      handleUpdateSlotAssignment(activeSlotKey, {
                        notes: e.target.value,
                      })
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium ${inputClass}`}
                  />
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* Tip Banner for 3D Drag Gizmo (Only in Edit Mode) */}
          {appMode === 'edit' && (
            <div className="px-3 py-2 rounded-xl bg-[#8DDB05]/10 border border-[#8DDB05]/30 text-[11px] text-[#65a30d] dark:text-[#8DDB05] font-medium">
              💡 Tip: Drag the <strong>3D Red/Green/Blue arrows</strong>{' '}
              directly in the viewport, or use the inch/foot controls below!
            </div>
          )}

          {/* DOOR CONTROLS: Open / Close & Snap to Wall */}
          {(selectedBlueprintItem.kind === 'overhead_door' ||
            selectedBlueprintItem.kind === 'service_door') && (
            <div className="p-3.5 rounded-2xl border border-[#8DDB05]/30 bg-[#8DDB05]/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#65a30d] dark:text-[#8DDB05]">
                  Door State (See-Through Cutout)
                </span>
                <button
                  onClick={() =>
                    onUpdateBlueprintItem({
                      ...selectedBlueprintItem,
                      isOpen: !selectedBlueprintItem.isOpen,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedBlueprintItem.isOpen
                      ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {selectedBlueprintItem.isOpen
                    ? 'Door Open (Click to Close)'
                    : 'Door Closed (Click to Open)'}
                </button>
              </div>
              {appMode === 'edit' && (
                <p className="text-[10px] text-slate-400">
                  Move this door along any wall using the 3D arrows or X/Z
                  controls — the wall opening automatically cuts out to match!
                </p>
              )}
            </div>
          )}

          {/* SHELF / RACK BUILDER: Choose how many Racks (Bays) & Shelves (Tiers) (Only in Edit Mode) */}
          {appMode === 'edit' && isShelfOrRack && (
            <div
              className={`p-3.5 rounded-2xl border space-y-3 ${
                isDark
                  ? 'border-[#8DDB05]/30 bg-[#8DDB05]/5'
                  : 'border-[#8DDB05]/40 bg-[#8DDB05]/10 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isDark ? 'text-[#8DDB05]' : 'text-[#3f6212] font-black'
                  }`}
                >
                  Shelf &amp; Rack Configuration
                </span>
                <span className="font-mono text-[10px] font-bold">
                  {curRows} {curRows === 1 ? 'Row' : 'Rows'} × {curBays} Bays ×{' '}
                  {curLevels} Tiers
                </span>
              </div>

              {/* Split Rack into Rows */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs ${headingClass}`}>
                    Split Rack into Rows
                  </div>
                  <div className={`text-[10px] ${labelClass}`}>
                    Depth rows (1 = single, 2 = back-to-back)
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        rows: Math.max(1, curRows - 1),
                      })
                    }
                    className={`w-7 h-7 rounded-lg font-extrabold text-sm flex items-center justify-center cursor-pointer transition ${btnSecClass}`}
                  >
                    -
                  </button>
                  <span className={`w-7 text-center font-mono text-xs font-black ${valueClass}`}>
                    {curRows}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        rows: Math.min(4, curRows + 1),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#8DDB05] text-slate-950 font-extrabold text-sm hover:opacity-90 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Number of Horizontal Rack Bays */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs ${headingClass}`}>
                    Number of Rack Bays
                  </div>
                  <div className={`text-[10px] ${labelClass}`}>
                    Side-by-side frame sections
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        bays: Math.max(1, curBays - 1),
                      })
                    }
                    className={`w-7 h-7 rounded-lg font-extrabold text-sm flex items-center justify-center cursor-pointer transition ${btnSecClass}`}
                  >
                    -
                  </button>
                  <span className={`w-7 text-center font-mono text-xs font-black ${valueClass}`}>
                    {curBays}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        bays: Math.min(10, curBays + 1),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#8DDB05] text-slate-950 font-extrabold text-sm hover:opacity-90 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Number of Vertical Shelf Tiers */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs ${headingClass}`}>
                    Number of Shelf Tiers
                  </div>
                  <div className={`text-[10px] ${labelClass}`}>
                    Vertical shelf levels
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        levels: Math.max(1, curLevels - 1),
                      })
                    }
                    className={`w-7 h-7 rounded-lg font-extrabold text-sm flex items-center justify-center cursor-pointer transition ${btnSecClass}`}
                  >
                    -
                  </button>
                  <span className={`w-7 text-center font-mono text-xs font-black ${valueClass}`}>
                    {curLevels}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        levels: Math.min(8, curLevels + 1),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#8DDB05] text-slate-950 font-extrabold text-sm hover:opacity-90 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Show / Hide Boxes on Shelves */}
              <div
                className={`flex items-center justify-between pt-1 border-t ${
                  isDark ? 'border-[#8DDB05]/20' : 'border-[#8DDB05]/30'
                }`}
              >
                <span className={`text-xs ${headingClass}`}>
                  Show Inventory Boxes on Shelves
                </span>
                <button
                  onClick={() =>
                    onUpdateBlueprintItem({
                      ...selectedBlueprintItem,
                      showBoxes: !curShowBoxes,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    curShowBoxes
                      ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                      : btnSecClass
                  }`}
                >
                  {curShowBoxes ? 'Boxes Shown' : 'Empty Frame'}
                </button>
              </div>
            </div>
          )}

          {/* Dimensions in Inches & Feet (Editable in Edit Mode, Read-Only Summary in View Mode) */}
          {appMode === 'edit' ? (
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDark
                  ? 'border-slate-700/80 bg-slate-800/60'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs ${headingClass}`}>
                  Size (Inches &amp; Feet)
                </span>
                <span
                  className={`text-[10px] font-mono font-extrabold ${
                    isDark ? 'text-[#8DDB05]' : 'text-[#4d7c0f]'
                  }`}
                >
                  {formatFeetInches(selectedBlueprintItem.size[0])} ×{' '}
                  {formatFeetInches(selectedBlueprintItem.size[1])} ×{' '}
                  {formatFeetInches(selectedBlueprintItem.size[2])}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['Width (X)', 0],
                    ['Height (Y)', 1],
                    ['Length (Z)', 2],
                  ] as const
                ).map(([label, idx]) => {
                  const inchesVal = metersToInches(
                    selectedBlueprintItem.size[idx]
                  );
                  return (
                    <div key={label}>
                      <label
                        className={`text-[10px] font-mono flex justify-between mb-1 ${labelClass}`}
                      >
                        <span>{label}</span>
                        <span
                          className={`font-bold ${
                            isDark ? 'text-[#8DDB05]' : 'text-[#4d7c0f]'
                          }`}
                        >
                          {formatFeetInches(selectedBlueprintItem.size[idx])}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={2}
                          min={4}
                          value={inchesVal}
                          onChange={(e) =>
                            updateBpSizeInches(
                              idx,
                              parseInt(e.target.value, 10) || 12
                            )
                          }
                          className={`w-full pl-2.5 pr-6 py-1.5 rounded-xl text-xs font-mono font-bold ${inputClass}`}
                        />
                        <span
                          className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold pointer-events-none ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          in
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isDark
                  ? 'border-slate-700/80 bg-slate-800/60'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <span className={`text-xs ${headingClass}`}>
                Dimensions (W × H × L)
              </span>
              <span
                className={`text-xs font-mono font-extrabold ${
                  isDark ? 'text-[#8DDB05]' : 'text-[#4d7c0f]'
                }`}
              >
                {formatFeetInches(selectedBlueprintItem.size[0])} ×{' '}
                {formatFeetInches(selectedBlueprintItem.size[1])} ×{' '}
                {formatFeetInches(selectedBlueprintItem.size[2])}
              </span>
            </div>
          )}

          {/* Manual Placement & Precision Nudge Controls (Only in Edit Mode) */}
          {appMode === 'edit' && (
            <>
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark
                    ? 'border-slate-700/80 bg-slate-800/60'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs flex items-center gap-1.5 ${headingClass}`}>
                    <MapPin
                      className={`w-3.5 h-3.5 ${
                        isDark ? 'text-[#8DDB05]' : 'text-[#4d7c0f]'
                      }`}
                    />{' '}
                    Position &amp; Fine Nudge (Feet / Inches)
                  </span>
                </div>

                {(
                  ['X (Front/Back)', 'Y (Elevation)', 'Z (Left/Right)'] as const
                ).map((axisTitle, idx) => {
                  const axis = idx as 0 | 1 | 2;
                  const ftVal = metersToFeetDecimal(
                    selectedBlueprintItem.position[axis]
                  );
                  return (
                    <div
                      key={axisTitle}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="w-28 shrink-0">
                        <div className={`text-[11px] ${headingClass}`}>
                          {axisTitle}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {formatFeetInches(
                            selectedBlueprintItem.position[axis]
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => nudgeByInches(axis, -6)}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${btnSecClass}`}
                          title="Move -6 inches"
                        >
                          -6&quot;
                        </button>
                        <button
                          onClick={() => nudgeByInches(axis, -1)}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${btnSecClass}`}
                          title="Move -1 inch"
                        >
                          -1&quot;
                        </button>
                        <input
                          type="number"
                          step={0.25}
                          value={ftVal}
                          onChange={(e) =>
                            updateBpPosMeters(
                              axis,
                              feetDecimalToMeters(
                                parseFloat(e.target.value) || 0
                              )
                            )
                          }
                          className={`w-16 px-1.5 py-1 rounded-lg text-center text-xs font-mono font-bold ${inputClass}`}
                          title="Position in Feet"
                        />
                        <button
                          onClick={() => nudgeByInches(axis, 1)}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${btnSecClass}`}
                          title="Move +1 inch"
                        >
                          +1&quot;
                        </button>
                        <button
                          onClick={() => nudgeByInches(axis, 6)}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${btnSecClass}`}
                          title="Move +6 inches"
                        >
                          +6&quot;
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Rotation Slider + 90 deg quick buttons */}
                <div
                  className={`pt-2 border-t ${
                    isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={labelClass}>Rotation Angle</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onUpdateBlueprintItem({
                            ...selectedBlueprintItem,
                            rotationY:
                              ((selectedBlueprintItem.rotationY || 0) -
                                Math.PI / 2) %
                              (Math.PI * 2),
                          })
                        }
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${btnSecClass}`}
                      >
                        -90°
                      </button>
                      <span
                        className={`font-mono text-xs font-black w-10 text-center ${valueClass}`}
                      >
                        {Math.round(
                          ((selectedBlueprintItem.rotationY || 0) * 180) /
                            Math.PI
                        )}
                        °
                      </span>
                      <button
                        onClick={() =>
                          onUpdateBlueprintItem({
                            ...selectedBlueprintItem,
                            rotationY:
                              ((selectedBlueprintItem.rotationY || 0) +
                                Math.PI / 2) %
                              (Math.PI * 2),
                          })
                        }
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${btnSecClass}`}
                      >
                        +90°
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.05}
                    value={selectedBlueprintItem.rotationY || 0}
                    onChange={(e) =>
                      onUpdateBlueprintItem({
                        ...selectedBlueprintItem,
                        rotationY: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-[#8DDB05] cursor-pointer"
                  />
                </div>
              </div>

              {/* Type Switcher */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark
                    ? 'border-slate-700/80 bg-slate-800/60'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <div className={`text-xs ${headingClass}`}>Model Type</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['rack', 'Storage Rack'],
                      ['work_station_rack', 'Work Bench + Light'],
                      ['workbench', 'Wire Shelf / Bench'],
                      ['forklift', 'Forklift Vehicle'],
                      ['overhead_door', 'Overhead Door'],
                      ['service_door', 'Service Door'],
                      ['desk', 'Office Desk'],
                      ['computer', 'Computer / Monitor'],
                      ['printer', 'Label Printer'],
                      ['chair', 'Office Chair'],
                      ['tote_bin', 'Storage Tote Bin'],
                    ] as const
                  ).map(([kindKey, label]) => (
                    <button
                      key={kindKey}
                      onClick={() =>
                        onUpdateBlueprintItem({
                          ...selectedBlueprintItem,
                          kind: kindKey,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border text-left transition cursor-pointer ${
                        selectedBlueprintItem.kind === kindKey
                          ? 'bg-[#8DDB05] text-slate-950 border-slate-950 shadow-sm'
                          : btnSecClass
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {appMode === 'edit' ? (
          <div
            className={`p-3.5 border-t flex items-center justify-between gap-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <button
              onClick={() => onDeleteBlueprintItem(selectedBlueprintItem.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Item</span>
            </button>
            <button
              onClick={onResetBlueprintItems}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${btnSecClass}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>
          </div>
        ) : (
          <div
            className={`p-3.5 border-t flex items-center justify-between gap-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <span className={`text-[11px] ${labelClass}`}>
              Switch to <strong>Edit Mode</strong> to move or resize
            </span>
            <button
              onClick={handleCopyConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 transition cursor-pointer shadow-sm"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied Odoo JSON
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Export Odoo JSON
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    );
  }

  // 1. Selected Marker Inspector View
  if (selectedMarker) {
    const [x, y, z] = selectedMarker.position;
    const isCam = selectedMarker.type === 'camera';
    const isAp = selectedMarker.type === 'network_ap';
    const isBin = selectedMarker.type === 'inventory_bin';

    const updateCoord = (axis: 0 | 1 | 2, val: number) => {
      const nextPos: [number, number, number] = [...selectedMarker.position];
      nextPos[axis] = val;
      onUpdateMarker({ ...selectedMarker, position: nextPos });
    };

    return (
      <>
        <aside
        className={`fixed top-20 right-4 bottom-4 w-88 sm:w-96 z-30 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all ${panelClass}`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-start justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                isCam
                  ? 'bg-cyan-500 text-white'
                  : isAp
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#8DDB05] text-slate-950'
              }`}
            >
              {isCam ? (
                <Camera className="w-5 h-5" />
              ) : isAp ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                    isDark
                      ? 'bg-[#8DDB05]/20 text-[#8DDB05]'
                      : 'bg-[#8DDB05]/25 text-[#3f6212]'
                  }`}
                >
                  {selectedMarker.id}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    selectedMarker.metadata.status === 'warning'
                      ? 'bg-amber-500/15 text-amber-500'
                      : isDark
                      ? 'bg-[#8DDB05]/20 text-[#8DDB05]'
                      : 'bg-[#8DDB05]/25 text-[#3f6212]'
                  }`}
                >
                  ● {selectedMarker.metadata.status || 'online'}
                </span>
              </div>
              <input
                type="text"
                value={selectedMarker.name}
                readOnly={appMode === 'view'}
                onChange={(e) =>
                  onUpdateMarker({ ...selectedMarker, name: e.target.value })
                }
                className="text-base font-bold tracking-tight mt-0.5 bg-transparent border-b border-transparent focus:border-[#8DDB05] outline-none w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo Edit"
              className={`p-1.5 rounded-xl border transition ${
                canUndo
                  ? isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  : 'border-transparent opacity-30 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo Edit"
              className={`p-1.5 rounded-xl border transition ${
                canRedo
                  ? isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  : 'border-transparent opacity-30 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onCloseMarker}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type-specific rich telemetry module */}
          {isCam && (() => {
            const currentRtsp =
              (selectedQuality === 'high'
                ? selectedMarker.metadata.rtspHigh
                : selectedQuality === 'medium'
                ? selectedMarker.metadata.rtspMedium
                : selectedMarker.metadata.rtspLow) ||
              selectedMarker.metadata.streamUrl ||
              '';

            const hasSnapshot =
              Boolean(selectedMarker.metadata.unifiId) &&
              Boolean(unifiConfig?.apiKey);

            const snapshotUrl = hasSnapshot
              ? `/api/unifi/snapshot?id=${selectedMarker.metadata.unifiId}&host=${encodeURIComponent(
                  unifiConfig?.baseUrl || ''
                )}&apiKey=${encodeURIComponent(
                  unifiConfig?.apiKey || ''
                )}&consoleId=${encodeURIComponent(
                  selectedMarker.metadata.unifiConsoleId || ''
                )}&allowSelfSigned=${unifiConfig?.allowSelfSigned !== false}&t=${snapshotNonce}`
              : null;

            const handleCopyRtsp = () => {
              if (currentRtsp) {
                navigator.clipboard.writeText(currentRtsp);
                setCopiedRtsp(true);
                setTimeout(() => setCopiedRtsp(false), 2000);
              }
            };

            return (
              <div className={`p-3.5 rounded-2xl border ${subCardClass} space-y-3`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-cyan-500">
                    <Video className="w-4 h-4" /> UniFi Video &amp; RTSP Feed
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasSnapshot && (
                      <button
                        type="button"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        title={autoRefresh ? 'Pause live auto-refresh' : 'Resume live auto-refresh (4s)'}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                          autoRefresh
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {autoRefresh ? 'AUTO-REFRESH' : 'PAUSED'}
                      </button>
                    )}
                    {hasSnapshot && (
                      <button
                        type="button"
                        onClick={() => setSnapshotNonce(Date.now())}
                        title="Refresh Live Snapshot"
                        className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-[10px] font-mono text-emerald-500 animate-pulse flex items-center gap-1">
                      {isPreloading && currentImageSrc && (
                        <RefreshCw className="w-2.5 h-2.5 text-cyan-400 animate-spin mr-0.5" />
                      )}
                      ● LIVE 30FPS
                    </span>
                  </div>
                </div>

                {/* Camera Viewport (Live UniFi Snapshot with click-to-expand) */}
                <div
                  onClick={() => setIsExpandedFeedOpen(true)}
                  title="Click to open live camera feed popup"
                  className="relative h-48 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex flex-col justify-between p-3 group cursor-pointer hover:border-cyan-500/50 transition-all shadow-inner select-none"
                >
                  {currentImageSrc && !snapshotError ? (
                    <>
                      <img
                        src={currentImageSrc}
                        alt={selectedMarker.name}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

                      {/* Hover Pill Affordance */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/30 backdrop-blur-[1px] pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/90 text-white shadow-lg flex items-center gap-1.5 transform group-hover:scale-105 transition-transform duration-200">
                          <Maximize2 className="w-3.5 h-3.5" /> Tap to open live feed popup
                        </span>
                      </div>
                    </>
                  ) : null}

                  {/* Stylized background grid and HUD (visible when loading initial snapshot, on error, or if no snapshot) */}
                  {(!currentImageSrc || snapshotError) && (
                    <>
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{
                          backgroundImage:
                            'radial-gradient(#22d3ee 1px, transparent 1px)',
                          backgroundSize: '14px 14px',
                        }}
                      />
                      <div className="relative z-10 my-auto text-center px-4">
                        <Camera
                          className={`w-7 h-7 mx-auto mb-1.5 ${
                            !snapshotError ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
                          }`}
                        />
                        <div className="text-xs font-semibold text-slate-200">
                          {!snapshotError ? 'Fetching camera snapshot...' : selectedMarker.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                          {currentRtsp || 'RTSP not enabled'}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Top HUD */}
                  <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-cyan-300 pointer-events-none">
                    <span className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      {selectedMarker.id} • {selectedMarker.metadata.unifiModel || 'UniFi Protect'}
                    </span>
                    <span className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1 text-slate-300">
                      <Maximize2 className="w-3 h-3 text-cyan-400" /> Expand
                    </span>
                  </div>

                  {/* Bottom HUD */}
                  <div className="relative z-10 flex justify-between items-end text-[10px] font-mono text-slate-300 pointer-events-none">
                    <span className="bg-slate-950/80 px-1.5 py-0.5 rounded text-emerald-400">
                      STATUS: {selectedMarker.metadata.status?.toUpperCase() || 'ONLINE'}
                    </span>
                    <span className="bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-400">
                      {lastSnapshotTime ? `UPDATED ${lastSnapshotTime}` : 'H.264/H.265 • RTSPS'}
                    </span>
                  </div>
                </div>

                {/* Quality Channel Selector (if multiple exist) */}
                {(selectedMarker.metadata.rtspHigh ||
                  selectedMarker.metadata.rtspMedium ||
                  selectedMarker.metadata.rtspLow) && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">
                      Stream Channel:
                    </span>
                    {(['high', 'medium', 'low'] as const).map((q) => {
                      const exists =
                        q === 'high'
                          ? Boolean(selectedMarker.metadata.rtspHigh)
                          : q === 'medium'
                          ? Boolean(selectedMarker.metadata.rtspMedium)
                          : Boolean(selectedMarker.metadata.rtspLow);
                      if (!exists) return null;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSelectedQuality(q)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold capitalize transition cursor-pointer ${
                            selectedQuality === q
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* RTSP Stream URL and Copy Action */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Live RTSP Feed URL
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentRtsp || 'No RTSP stream enabled in UniFi Protect'}
                      className={`flex-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono border truncate ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={handleCopyRtsp}
                      disabled={!currentRtsp}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                    >
                      {copiedRtsp ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy RTSP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Link to UniFi Protect Console */}
                {unifiConfig?.baseUrl && selectedMarker.metadata.unifiId && (
                  <a
                    href={`${unifiConfig.baseUrl.replace(/\/+$/, '')}/protect/devices/${selectedMarker.metadata.unifiId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline pt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Camera in UniFi Protect Web
                  </a>
                )}
              </div>
            );
          })()}

          {isAp && (
            <div className={`p-3.5 rounded-2xl border ${subCardClass} space-y-3`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <Activity className="w-4 h-4" /> Wireless Mesh Telemetry
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedMarker.metadata.ip}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-slate-400">Uplink Speed</div>
                  <div className="text-sm font-bold text-emerald-500 mt-0.5">
                    {selectedMarker.metadata.linkSpeed || '2.5 Gbps'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-[10px] text-slate-400">
                    Active Scanners
                  </div>
                  <div className="text-sm font-bold text-blue-500 mt-0.5">
                    {selectedMarker.metadata.connectedClients ?? 24} clients
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">6GHz Channel Utilization</span>
                  <span className="font-semibold text-emerald-500">22% Optimal</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full w-[22%] bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          )}

          {isBin && (
            <div className={`p-3.5 rounded-2xl border ${subCardClass} space-y-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    SKU Identifier
                  </div>
                  <input
                    type="text"
                    value={selectedMarker.metadata.sku || ''}
                    onChange={(e) =>
                      onUpdateMarker({
                        ...selectedMarker,
                        metadata: {
                          ...selectedMarker.metadata,
                          sku: e.target.value,
                        },
                      })
                    }
                    className="text-sm font-mono font-bold text-blue-500 bg-transparent outline-none border-b border-transparent focus:border-blue-500"
                  />
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Location Bay
                  </div>
                  <div className="text-xs font-semibold">
                    {selectedMarker.metadata.bay || 'Main Floor'}
                  </div>
                </div>
              </div>

              {/* Stock Quantity Bar & Adjuster */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Quantity in Bin</span>
                  <span className="font-bold">
                    {(selectedMarker.metadata.qty || 0).toLocaleString()} /{' '}
                    {(selectedMarker.metadata.maxQty || 1000).toLocaleString()}{' '}
                    units
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((selectedMarker.metadata.qty || 0) /
                            (selectedMarker.metadata.maxQty || 1000)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 mt-2.5">
                  <button
                    onClick={() =>
                      onUpdateMarker({
                        ...selectedMarker,
                        metadata: {
                          ...selectedMarker.metadata,
                          qty: Math.max(
                            0,
                            (selectedMarker.metadata.qty || 0) - 25
                          ),
                        },
                      })
                    }
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${btnSecClass}`}
                  >
                    -25 Units
                  </button>
                  <button
                    onClick={() =>
                      onUpdateMarker({
                        ...selectedMarker,
                        metadata: {
                          ...selectedMarker.metadata,
                          qty: (selectedMarker.metadata.qty || 0) + 25,
                        },
                      })
                    }
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 cursor-pointer shadow-sm"
                  >
                    +25 Units
                  </button>
                </div>
              </div>

              {/* 3D Representation Style Switcher */}
              <div>
                <div className={`text-[11px] font-bold mb-1.5 ${headingClass}`}>
                  3D Object Model Style
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['pallet_stack', 'Pallet Stack'],
                      ['rack', 'Storage Rack'],
                      ['forklift', 'Forklift Vehicle'],
                      ['pin', 'Amber Beacon Box'],
                    ] as [ModelVariant, string][]
                  ).map(([variantKey, label]) => (
                    <button
                      key={variantKey}
                      onClick={() =>
                        onUpdateMarker({
                          ...selectedMarker,
                          modelVariant: variantKey,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border text-left transition cursor-pointer shadow-sm ${
                        (selectedMarker.modelVariant || 'pin') === variantKey
                          ? 'bg-[#8DDB05] text-slate-950 border-slate-950'
                          : btnSecClass
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className={`p-3.5 rounded-2xl border ${subCardClass} shadow-sm`}>
            <div className={`text-[11px] font-bold mb-1 ${headingClass}`}>
              Notes &amp; Specification
            </div>
            <textarea
              rows={2}
              value={selectedMarker.metadata.description || ''}
              onChange={(e) =>
                onUpdateMarker({
                  ...selectedMarker,
                  metadata: {
                    ...selectedMarker.metadata,
                    description: e.target.value,
                  },
                })
              }
              className={`w-full text-xs font-medium bg-transparent outline-none resize-none ${valueClass}`}
            />
          </div>

          {/* 3D Coordinate Transform Editor (Feet & Inches) */}
          <div className={`p-3.5 rounded-2xl border ${subCardClass} space-y-2.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${headingClass}`}>
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> 3D Position [X,
                Y, Z]
              </span>
              <span className={`text-[10px] font-mono ${labelClass}`}>
                Feet &amp; Inches
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['X', 'Y', 'Z'] as const).map((axisLabel, idx) => (
                <div key={axisLabel}>
                  <label className={`text-[10px] font-mono flex justify-between mb-1 ${labelClass}`}>
                    <span>{axisLabel}</span>
                    <span className={`font-bold ${isDark ? 'text-[#8DDB05]' : 'text-[#4d7c0f]'}`}>
                      {formatFeetInches(selectedMarker.position[idx])}
                    </span>
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    value={metersToFeetDecimal(selectedMarker.position[idx])}
                    onChange={(e) =>
                      updateCoord(
                        idx as 0 | 1 | 2,
                        feetDecimalToMeters(parseFloat(e.target.value) || 0)
                      )
                    }
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold ${inputClass}`}
                  />
                </div>
              ))}
            </div>
            {/* Rotation Y slider */}
            <div>
              <div className="flex justify-between text-[10px] font-semibold mt-1">
                <span className={labelClass}>Rotation (Yaw)</span>
                <span className={`font-mono font-bold ${valueClass}`}>
                  {Math.round(
                    ((selectedMarker.rotation?.[1] || 0) * 180) / Math.PI
                  )}
                  °
                </span>
              </div>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={0.05}
                value={selectedMarker.rotation?.[1] || 0}
                onChange={(e) =>
                  onUpdateMarker({
                    ...selectedMarker,
                    rotation: [0, parseFloat(e.target.value), 0],
                  })
                }
                className="w-full accent-[#8DDB05] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Delete / Remove Object Button */}
        <div
          className={`p-3.5 border-t flex items-center justify-between gap-2 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          {appMode === 'edit' ? (
            <button
              onClick={() => onDeleteMarker(selectedMarker.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from Model</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              View Mode • Clean Blueprint
            </span>
          )}
          <button
            onClick={handleCopyConfig}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 transition cursor-pointer"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied JSON
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Export JSON
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Pop-up Live Feed Modal (Larger Window) */}
      {isExpandedFeedOpen && isCam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsExpandedFeedOpen(false)}
        >
          <div
            className={`relative w-full max-w-4xl max-h-[92vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              isDark
                ? 'bg-slate-900 border-slate-750 text-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100 truncate">
                      {selectedMarker.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ● LIVE FEED
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {selectedMarker.metadata.unifiModel || 'UniFi Protect Camera'} • IP: {selectedMarker.metadata.ip || '192.168.2.9'}
                  </div>
                </div>
              </div>

              {/* Header Right Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    autoRefresh
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                  title={autoRefresh ? 'Pause live auto-refresh' : 'Resume live auto-refresh'}
                >
                  <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {autoRefresh ? 'AUTO-REFRESH (4s)' : 'PAUSED'}
                </button>

                <button
                  type="button"
                  onClick={() => setSnapshotNonce(Date.now())}
                  title="Refresh snapshot now"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isPreloading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpandedFeedOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                  title="Close popup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Large Video Viewport */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {currentImageSrc && !snapshotError ? (
                <>
                  <img
                    src={currentImageSrc}
                    alt={selectedMarker.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }}
                  />
                  <Camera className="w-10 h-10 text-cyan-400 animate-pulse mb-3 relative z-10" />
                  <div className="text-sm font-semibold text-slate-200 relative z-10">
                    {snapshotError ? 'Snapshot unavailable' : 'Connecting to live camera feed...'}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 max-w-md truncate relative z-10">
                    {((selectedQuality === 'high'
                      ? selectedMarker.metadata.rtspHigh
                      : selectedQuality === 'medium'
                      ? selectedMarker.metadata.rtspMedium
                      : selectedMarker.metadata.rtspLow) || selectedMarker.metadata.streamUrl) || 'Querying UniFi Protect Cloud Connector'}
                  </div>
                </div>
              )}

              {/* Viewport Top Left Watermark */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/75 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-mono text-cyan-300 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">{selectedMarker.name}</span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-400">{selectedMarker.id}</span>
              </div>

              {/* Viewport Top Right Timestamp */}
              <div className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-mono text-slate-300 pointer-events-none">
                {lastSnapshotTime ? `SNAPSHOT: ${lastSnapshotTime}` : 'LIVE STREAM'}
              </div>

              {/* Viewport Bottom Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs font-mono text-slate-300 pointer-events-none">
                <span className="bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-700/60 text-emerald-400">
                  STATUS: {selectedMarker.metadata.status?.toUpperCase() || 'ONLINE'}
                </span>
                <span className="bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-700/60 text-slate-400">
                  4K 3840×2160 • RTSPS H.264
                </span>
              </div>
            </div>

            {/* Modal Bottom Controls & RTSP Copy */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Quality Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Quality:</span>
                {(['high', 'medium', 'low'] as const).map((q) => {
                  const hasQual =
                    q === 'high'
                      ? Boolean(selectedMarker.metadata.rtspHigh)
                      : q === 'medium'
                      ? Boolean(selectedMarker.metadata.rtspMedium)
                      : Boolean(selectedMarker.metadata.rtspLow);
                  if (!hasQual) return null;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSelectedQuality(q)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold capitalize transition cursor-pointer ${
                        selectedQuality === q
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>

              {/* RTSP Stream Copy & External Link */}
              <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
                {(() => {
                  const currentRtsp =
                    (selectedQuality === 'high'
                      ? selectedMarker.metadata.rtspHigh
                      : selectedQuality === 'medium'
                      ? selectedMarker.metadata.rtspMedium
                      : selectedMarker.metadata.rtspLow) ||
                    selectedMarker.metadata.streamUrl ||
                    '';

                  const handleCopy = () => {
                    if (currentRtsp) {
                      navigator.clipboard.writeText(currentRtsp);
                      setCopiedRtsp(true);
                      setTimeout(() => setCopiedRtsp(false), 2000);
                    }
                  };

                  return (
                    <>
                      <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!currentRtsp}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                      >
                        {copiedRtsp ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" /> Copied RTSP!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy RTSP Stream
                          </>
                        )}
                      </button>

                      <a
                        href={unifiConfig?.baseUrl || 'https://unifi.ui.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer border border-slate-700 flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> UniFi Protect
                      </a>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
  }

  // 2. Default WareTrack Right Overview & Model Editor Panel
  const bins = markers.filter((m) => m.type === 'inventory_bin');

  return (
    <aside
      className={`fixed top-20 right-4 bottom-4 w-88 sm:w-96 z-20 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all ${panelClass}`}
    >
      {/* Top Depot Header */}
      <div
        className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
            }`}
          >
            DEPOT • 4HG-01
          </div>
          <div className="text-base font-bold tracking-tight">
            4HG Shop Facility
          </div>
          <div className={`text-xs ${labelClass}`}>
            {appMode === 'view'
              ? 'Clean Blueprint • Odoo Location Directory'
              : 'Interactive 3D Digital Twin & Asset Editor'}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {appMode === 'edit' && (
            <>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo Last Edit"
                className={`p-1.5 rounded-xl border transition ${
                  canUndo
                    ? isDark
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                    : 'border-transparent opacity-30 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo Last Edit"
                className={`p-1.5 rounded-xl border transition ${
                  canRedo
                    ? isDark
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                    : 'border-transparent opacity-30 cursor-not-allowed'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={handleCopyConfig}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-sm"
            title="Copy Odoo rack locations & digital twin JSON"
          >
            {copiedJson ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedJson ? 'Saved' : 'Odoo JSON'}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add / Spawn New Shelves, Desks, Computers & Accessories (Only in Edit Mode) */}
        {appMode === 'edit' && (
          <div className={`p-3.5 rounded-2xl border ${subCardClass} space-y-2.5 shadow-sm`}>
            <div className="text-xs font-bold flex items-center justify-between">
              <span className={`flex items-center gap-1.5 ${headingClass}`}>
                <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'}`} />{' '}
                Add Shelves, Desks &amp; Equipment
              </span>
              <span className={`text-[10px] font-normal ${labelClass}`}>
                Draggable 3D
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('rack', 'Storage Rack')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-[#8DDB05]/15 text-[#3f6212] dark:text-[#8DDB05] border border-[#8DDB05]/30 hover:bg-[#8DDB05]/25 transition text-left cursor-pointer"
              >
                + Storage Rack
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture(
                    'work_station_rack',
                    'Work Bench + Light'
                  )
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25 transition text-left cursor-pointer"
              >
                + Work Bench + Light
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('workbench', 'Wire Shelf')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition text-left cursor-pointer"
              >
                + Wire Shelf / Bench
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('desk', 'Office Desk')
                }
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${btnSecClass}`}
              >
                + Office Desk
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('computer', 'Desktop Computer')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 transition text-left cursor-pointer"
              >
                + Computer / Monitor
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('printer', 'Label Printer')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition text-left cursor-pointer"
              >
                + Label Printer
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('chair', 'Office Chair')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500/25 transition text-left cursor-pointer"
              >
                + Office Chair
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('forklift', 'Forklift')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition text-left cursor-pointer"
              >
                + Forklift (Scan Scale)
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture(
                    'overhead_door',
                    'Overhead Door'
                  )
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition text-left cursor-pointer"
              >
                + Overhead Door
              </button>
              <button
                onClick={() =>
                  handleQuickAddBlueprintFixture('service_door', 'Service Door')
                }
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${btnSecClass}`}
              >
                + Service Door
              </button>
              <button
                onClick={() =>
                  handleQuickAddObject('camera', 'pin', 'Security Cam')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition text-left cursor-pointer"
              >
                + Security Cam Pin
              </button>
              <button
                onClick={() =>
                  handleQuickAddObject('network_ap', 'pin', 'Network AP')
                }
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition text-left cursor-pointer"
              >
                + Network AP Pin
              </button>
            </div>
          </div>
        )}

        {/* All Blueprint Shelves, Racks & Equipment List (Click to Assign Odoo Locations / Configure) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className={headingClass}>Shelves, Racks &amp; Odoo Locations</span>
            <span className={labelClass}>
              {blueprintItems.length} models
            </span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {blueprintItems.map((bp) => {
              const slotCount = bp.shelfLocations
                ? Object.values(bp.shelfLocations).filter(
                    (s) => s.locationCode || s.odooLocationId
                  ).length
                : 0;
              return (
                <button
                  key={bp.id}
                  onClick={() => onSelectBlueprintItem(bp.id)}
                  className={`w-full p-2.5 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer hover:border-[#8DDB05] ${subCardClass}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {bp.locationPrefix && (
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shrink-0 ${
                          isDark ? 'bg-[#8DDB05]/20 text-[#8DDB05]' : 'bg-[#8DDB05]/25 text-[#3f6212]'
                        }`}>
                          {bp.locationPrefix}
                        </span>
                      )}
                      <span className={`text-xs font-bold truncate ${valueClass}`}>
                        {bp.name}
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${labelClass}`}>
                      {formatFeetInches(bp.size[0])} ×{' '}
                      {formatFeetInches(bp.size[2])} •{' '}
                      {bp.kind === 'rack' || bp.kind === 'workbench'
                        ? `${bp.bays ?? 3} bays × ${bp.levels ?? 3} tiers${
                            slotCount > 0 ? ` • ${slotCount} Odoo slots` : ''
                          }`
                        : bp.kind}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                    isDark ? 'bg-[#8DDB05]/15 text-[#8DDB05]' : 'bg-[#8DDB05]/25 text-[#3f6212]'
                  }`}>
                    {appMode === 'view' ? 'Locations' : 'Edit'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* If Edit Model Mode is active, show 4HG Shop.glb Sub-Mesh Manager & Clutter Erasers */}
        {appMode === 'edit' && editModelMode && (
          <div
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isDark
                ? 'border-[#8DDB05]/30 bg-[#8DDB05]/5'
                : 'border-[#8DDB05]/40 bg-[#8DDB05]/10 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`text-xs font-bold flex items-center gap-1.5 ${
                isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
              }`}>
                <Layers className="w-4 h-4" /> 4HG Shop Scan Segments
              </div>
              <button
                onClick={onResetMeshOverrides}
                className="text-[11px] text-slate-400 hover:text-[#8DDB05] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            </div>
            <p className={`text-[11px] leading-relaxed ${labelClass}`}>
              Toggle the eye icon to hide/remove specific segments of{' '}
              <code>4HG Shop.glb</code>, or click a segment to recolor/offset it.
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {meshOverrides.map((m) => {
                const isSelected = selectedMeshIndex === m.meshIndex;
                return (
                  <div
                    key={m.meshIndex}
                    className={`p-2 rounded-xl border text-xs flex flex-col gap-2 transition ${
                      isSelected
                        ? 'border-[#8DDB05] bg-[#8DDB05]/10'
                        : isDark
                        ? 'border-slate-800'
                        : 'border-slate-200 bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() =>
                          onSelectMesh(isSelected ? null : m.meshIndex)
                        }
                        className={`font-semibold text-left flex-1 cursor-pointer ${valueClass}`}
                      >
                        {m.name}
                      </button>
                      <div className="flex items-center gap-1.5">
                        {/* Quick Color Swatches */}
                        {['#8DDB05', '#e2e8f0', '#94a3b8'].map((swatch) => (
                          <button
                            key={swatch}
                            onClick={() =>
                              onUpdateMeshOverride({
                                ...m,
                                colorOverride:
                                  m.colorOverride === swatch ? null : swatch,
                              })
                            }
                            className={`w-4 h-4 rounded-full border ${
                              m.colorOverride === swatch
                                ? 'ring-2 ring-[#8DDB05] scale-110'
                                : 'border-slate-400/50'
                            }`}
                            style={{ backgroundColor: swatch }}
                            title="Apply clean architectural color"
                          />
                        ))}
                        <button
                          onClick={() =>
                            onUpdateMeshOverride({ ...m, visible: !m.visible })
                          }
                          className={`p-1 rounded-lg cursor-pointer ${
                            m.visible
                              ? 'text-emerald-500 hover:bg-emerald-500/10'
                              : 'text-red-500 bg-red-500/10'
                          }`}
                          title={
                            m.visible
                              ? 'Hide / Remove this scan segment'
                              : 'Restore segment'
                          }
                        >
                          {m.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className={`grid grid-cols-3 gap-1.5 pt-1 border-t ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        {(['X', 'Y', 'Z'] as const).map((axis, aIdx) => (
                          <div key={axis}>
                            <label className={`text-[9px] block ${labelClass}`}>
                              Offset {axis}
                            </label>
                            <input
                              type="number"
                              step={0.25}
                              value={m.positionOffset[aIdx]}
                              onChange={(e) => {
                                const next: [number, number, number] = [
                                  ...m.positionOffset,
                                ];
                                next[aIdx] = parseFloat(e.target.value) || 0;
                                onUpdateMeshOverride({
                                  ...m,
                                  positionOffset: next,
                                });
                              }}
                              className={`w-full px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${inputClass}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clean Floor / Clutter Mask Patches */}
            <div
              className={`pt-2 border-t space-y-2 ${
                isDark ? 'border-[#8DDB05]/20' : 'border-[#8DDB05]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
                }`}>
                  <Box className="w-3.5 h-3.5" /> Clean Cover / Mask Blocks
                </span>
                <button
                  onClick={onAddCutoutBox}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#8DDB05] text-slate-950 cursor-pointer shadow-sm"
                >
                  + Add Mask Block
                </button>
              </div>
              {cutoutBoxes.map((box) => (
                <div
                  key={box.id}
                  className={`p-2 rounded-xl border text-xs space-y-1.5 shadow-sm ${
                    isDark
                      ? 'border-slate-800 bg-slate-900/70'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${valueClass}`}>{box.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleCutoutBox(box.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          box.active
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {box.active ? 'Active' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => onDeleteCutoutBox(box.id)}
                        className="p-1 text-red-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {box.active && (
                    <div className="grid grid-cols-3 gap-1">
                      {(['X', 'Y', 'Z'] as const).map((ax, idx) => (
                        <input
                          key={ax}
                          type="number"
                          step={0.5}
                          value={box.position[idx]}
                          onChange={(e) => {
                            const nextPos: [number, number, number] = [
                              ...box.position,
                            ];
                            nextPos[idx] = parseFloat(e.target.value) || 0;
                            onUpdateCutoutBox({ ...box, position: nextPos });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${inputClass}`}
                          title={`Position ${ax}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className={headingClass}>Inventory &amp; Scene Objects</span>
            <span className={labelClass}>
              {bins.length} items
            </span>
          </div>
          <div className="space-y-2">
            {bins.map((item) => {
              const isLow = item.metadata.status === 'warning';
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectMarker(item)}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer hover:border-[#8DDB05] ${subCardClass}`}
                >
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${valueClass}`}>
                      {item.name}
                    </div>
                    <div className={`text-[10px] font-mono ${labelClass}`}>
                      {item.metadata.sku} • {item.metadata.bay}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold ${valueClass}`}>
                      {(item.metadata.qty || 0).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                        isLow
                          ? 'bg-amber-500/15 text-amber-500'
                          : isDark
                          ? 'bg-[#8DDB05]/20 text-[#8DDB05]'
                          : 'bg-[#8DDB05]/25 text-[#3f6212]'
                      }`}
                    >
                      {isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
