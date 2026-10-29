'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  CutoutBox,
  DEFAULT_CUTOUT_BOXES,
  DEFAULT_FSD_VISION_CONFIG,
  DEFAULT_MARKERS,
  DEFAULT_MESH_OVERRIDES,
  DisplayMode,
  FacilityMarker,
  FsdVisionSettingsConfig,
  MarkerType,
  MeshOverride,
} from '@/lib/markers';
import {
  BlueprintItem,
  DEFAULT_BLUEPRINT_ITEMS,
  OdooProductQuant,
  buildOdooShortCode,
  deriveZoneAndRack,
  generateAllShelfLocations,
  parseSlotKey,
} from '@/lib/blueprint-geometry';
import { TopNavbar, SearchResultItem } from '@/components/ui/TopNavbar';
import { HudOverlays } from '@/components/ui/HudOverlays';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { CalibrationOverlay } from '@/components/ui/CalibrationOverlay';
import {
  SettingsDrawer,
  DEFAULT_ODOO_CONFIG,
  OdooSettingsConfig,
  DEFAULT_UNIFI_CONFIG,
  UnifiSettingsConfig,
} from '@/components/ui/SettingsDrawer';
import { FsdVisionSettingsPanel } from '@/components/ui/FsdVisionSettingsPanel';
import {
  CardinalFacing,
  applyCardinalOrientation,
} from '@/lib/compass';

const WarehouseCanvas = dynamic(
  () =>
    import('@/components/scene/WarehouseCanvas').then(
      (mod) => mod.WarehouseCanvas
    ),
  { ssr: false }
);

const STORAGE_KEY = 'waretrack_4hg_twin_state_v9';

interface HistorySnapshot {
  markers: FacilityMarker[];
  blueprintItems: BlueprintItem[];
}

export default function WarehouseDigitalTwinPage() {
  const [appMode, setAppMode] = useState<'view' | 'edit'>('edit');
  const [theme, setTheme] = useState<'daylight' | 'dark'>('daylight');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('clean_shell');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MarkerType | 'all'>('all');
  const [roofCutoffY, setRoofCutoffY] = useState<number>(1.45);

  const [markers, setMarkers] = useState<FacilityMarker[]>(DEFAULT_MARKERS);
  const [meshOverrides, setMeshOverrides] = useState<MeshOverride[]>(
    DEFAULT_MESH_OVERRIDES
  );
  const [blueprintItems, setBlueprintItems] = useState<BlueprintItem[]>(
    DEFAULT_BLUEPRINT_ITEMS
  );
  const [pastHistory, setPastHistory] = useState<HistorySnapshot[]>([]);
  const [futureHistory, setFutureHistory] = useState<HistorySnapshot[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(
    null
  );
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(
    'R1-B1-L1'
  );
  const [cutoutBoxes, setCutoutBoxes] = useState<CutoutBox[]>(
    DEFAULT_CUTOUT_BOXES
  );

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [editModelMode, setEditModelMode] = useState<boolean>(false);
  const [selectedMeshIndex, setSelectedMeshIndex] = useState<number | null>(
    null
  );

  const [calibrationMode, setCalibrationMode] = useState<boolean>(false);
  const [panMode, setPanMode] = useState<boolean>(false);
  const [calibratedPoint, setCalibratedPoint] = useState<
    [number, number, number] | null
  >(null);
  const [calibratedMeshIndex, setCalibratedMeshIndex] = useState<number | null>(
    null
  );

  const [cameraCommand, setCameraCommand] = useState<{
    type: 'reset' | 'zoom_in' | 'zoom_out' | 'top_down' | 'focus' | null;
    target?: [number, number, number];
    position?: [number, number, number];
    timestamp: number;
  }>({ type: null, timestamp: 0 });

  // Settings & ERP Integration States
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [odooConfig, setOdooConfig] =
    useState<OdooSettingsConfig>(DEFAULT_ODOO_CONFIG);
  const [unifiConfig, setUnifiConfig] =
    useState<UnifiSettingsConfig>(DEFAULT_UNIFI_CONFIG);
  const [cardinalFacing, setCardinalFacing] = useState<CardinalFacing>('north');
  const [showShelfTags, setShowShelfTags] = useState<boolean>(true);
  const [showCameraFeeds3D, setShowCameraFeeds3D] = useState<boolean>(false);
  const [showSpatialVision3D, setShowSpatialVision3D] = useState<boolean>(false);
  const [isFsdSettingsOpen, setIsFsdSettingsOpen] = useState<boolean>(false);
  const [selectedFsdCameraId, setSelectedFsdCameraId] =
    useState<string>('CAM-03');
  const [clickGroundToPlaceZone, setClickGroundToPlaceZone] =
    useState<boolean>(false);
  const [testPreviewPoint, setTestPreviewPoint] = useState<{
    cameraId: string;
    u: number;
    v: number;
  } | null>(null);
  const [fsdConfig, setFsdConfig] = useState<FsdVisionSettingsConfig>(
    DEFAULT_FSD_VISION_CONFIG
  );
  const [latestDetectionsByCamera, setLatestDetectionsByCamera] = useState<
    Record<string, { u: number; v: number; label: string; confidence: number }[]>
  >({});
  const [isSyncingOdoo, setIsSyncingOdoo] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSyncingUnifi, setIsSyncingUnifi] = useState<boolean>(false);
  const [lastUnifiSyncTime, setLastUnifiSyncTime] = useState<string | null>(null);
  const [unifiSyncStatusMsg, setUnifiSyncStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync theme class to html root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'daylight');
    }
  }, [theme]);

  // Hydrate persisted modifications from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('waretrack_odoo_config');
      if (savedConfig) setOdooConfig(JSON.parse(savedConfig));

      const savedUnifi = localStorage.getItem('waretrack_unifi_config');
      if (savedUnifi) setUnifiConfig(JSON.parse(savedUnifi));

      const savedFsd = localStorage.getItem('waretrack_fsd_vision_config');
      if (savedFsd) {
        setFsdConfig({
          ...DEFAULT_FSD_VISION_CONFIG,
          ...JSON.parse(savedFsd),
        });
      }

      const savedFacing = localStorage.getItem(
        'waretrack_cardinal_facing'
      ) as CardinalFacing;
      const initialFacing: CardinalFacing =
        savedFacing && ['north', 'east', 'south', 'west'].includes(savedFacing)
          ? savedFacing
          : 'north';
      if (savedFacing) setCardinalFacing(initialFacing);

      const savedTags = localStorage.getItem('waretrack_show_shelf_tags');
      if (savedTags !== null) setShowShelfTags(savedTags === 'true');

      const savedLastSync = localStorage.getItem('waretrack_last_sync_time');
      if (savedLastSync) setLastSyncTime(savedLastSync);

      const savedLastUnifiSync = localStorage.getItem('waretrack_last_unifi_sync_time');
      if (savedLastUnifiSync) setLastUnifiSyncTime(savedLastUnifiSync);

      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('waretrack_4hg_twin_state_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.markers)) {
          const defaultCamMap = new Map(
            DEFAULT_MARKERS.filter((m) => m.type === 'camera').map((m) => [m.id, m])
          );
          const hydratedMarkers = parsed.markers.map((m: FacilityMarker) => {
            if (m.type === 'camera' && !m.metadata?.unifiId) {
              const fallbackCam = defaultCamMap.get(m.id);
              if (fallbackCam) {
                return {
                  ...m,
                  metadata: {
                    ...fallbackCam.metadata,
                    ...m.metadata,
                    unifiId: fallbackCam.metadata.unifiId,
                    unifiModel: m.metadata?.unifiModel || fallbackCam.metadata.unifiModel,
                    unifiConsoleId:
                      m.metadata?.unifiConsoleId || fallbackCam.metadata.unifiConsoleId,
                    rtspHigh: m.metadata?.rtspHigh || fallbackCam.metadata.rtspHigh,
                  },
                };
              }
            }
            return m;
          });
          setMarkers(hydratedMarkers);
        }
        if (Array.isArray(parsed.meshOverrides))
          setMeshOverrides(parsed.meshOverrides);
        if (Array.isArray(parsed.blueprintItems)) {
          const upgraded = parsed.blueprintItems.map((item: BlueprintItem) => {
            const derived = deriveZoneAndRack(item);
            const z = item.zone || derived.zone;
            const r = item.rowNumber || item.rackNumber || derived.rowNumber;

            let cleanedLocations = item.shelfLocations;
            if (cleanedLocations) {
              const nextLocs: Record<string, any> = {};
              let hasChanges = false;
              for (const [key, slot] of Object.entries(cleanedLocations)) {
                if (slot.shortCode && /-R(\d+)-/.test(slot.shortCode)) {
                  hasChanges = true;
                  const match = slot.shortCode.match(/^([A-Z])-(\d+)-R(\d+)-(\d+)-(\d+)$/);
                  if (match) {
                    const zone = match[1];
                    const baseRow = parseInt(match[2], 10);
                    const rowOffset = parseInt(match[3], 10) - 1;
                    const finalRow = baseRow + rowOffset;
                    const bay = match[4];
                    const shelf = match[5];
                    const fixedCode = `${zone}-${String(finalRow).padStart(2, '0')}-${bay}-${shelf}`;
                    nextLocs[key] = {
                      ...slot,
                      shortCode: fixedCode,
                      locationCode: fixedCode,
                    };
                    continue;
                  }
                }
                nextLocs[key] = slot;
              }
              if (hasChanges) cleanedLocations = nextLocs;
            }

            return {
              ...item,
              zone: z,
              rowNumber: r,
              rackNumber: r,
              shelfLocations: cleanedLocations,
            };
          });
          setBlueprintItems(applyCardinalOrientation(upgraded, initialFacing));
        }
        if (Array.isArray(parsed.cutoutBoxes))
          setCutoutBoxes(parsed.cutoutBoxes);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          markers,
          meshOverrides,
          blueprintItems,
          cutoutBoxes,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [markers, meshOverrides, blueprintItems, cutoutBoxes]);

  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      if (activeFilter !== 'all' && m.type !== activeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.metadata.sku && m.metadata.sku.toLowerCase().includes(q)) ||
        (m.metadata.ip && m.metadata.ip.toLowerCase().includes(q)) ||
        (m.metadata.bay && m.metadata.bay.toLowerCase().includes(q))
      );
    });
  }, [markers, activeFilter, searchQuery]);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const results: SearchResultItem[] = [];

    // 1. Search products and locations across all blueprint items (racks/shelves)
    for (const item of blueprintItems) {
      if (item.isNonInventory) continue;

      const rackMatches =
        item.name.toLowerCase().includes(q) ||
        (item.zone && `zone ${item.zone}`.toLowerCase().includes(q)) ||
        (item.locationPrefix && item.locationPrefix.toLowerCase().includes(q));

      if (item.shelfLocations) {
        for (const [slotKey, slot] of Object.entries(item.shelfLocations)) {
          const shortCode = slot.shortCode || slot.locationCode || '';
          const cleanShortCode = shortCode.toUpperCase();
          const slotMatches =
            cleanShortCode.toLowerCase().includes(q) ||
            (slot.locationCode && slot.locationCode.toLowerCase().includes(q)) ||
            (slot.odooLocationId && slot.odooLocationId.toLowerCase().includes(q));

          // Check products inside this slot
          if (slot.products && slot.products.length > 0) {
            for (const prod of slot.products) {
              const skuMatches = prod.sku.toLowerCase().includes(q);
              const nameMatches = prod.name.toLowerCase().includes(q);
              const lotMatches = prod.lot ? prod.lot.toLowerCase().includes(q) : false;

              if (skuMatches || nameMatches || lotMatches || slotMatches) {
                results.push({
                  type: 'product',
                  title: `${prod.sku} • ${prod.name}`,
                  subtitle: `${cleanShortCode || slotKey} (${item.name}) • On Hand: ${prod.quantity}${prod.lot ? ` • Lot: ${prod.lot}` : ''}`,
                  badge: `${prod.quantity} in stock`,
                  rackId: item.id,
                  slotKey,
                  shortCode: cleanShortCode,
                  position: item.position,
                });
              }
            }
          } else if (slotMatches) {
            results.push({
              type: 'location',
              title: cleanShortCode || slotKey,
              subtitle: `Slot in ${item.name}${slot.odooLocationId ? ` (Odoo ID: ${slot.odooLocationId})` : ''}`,
              badge: 'Location',
              rackId: item.id,
              slotKey,
              shortCode: cleanShortCode,
              position: item.position,
            });
          }
        }
      }

      if (rackMatches && !results.some((r) => r.rackId === item.id)) {
        results.push({
          type: 'rack',
          title: item.name,
          subtitle: `${item.kind.toUpperCase()} • ${item.bays ?? 3} bays × ${item.levels ?? 3} tiers`,
          badge: item.zone ? `Zone ${item.zone}` : 'Rack',
          rackId: item.id,
          position: item.position,
        });
      }
    }

    // 2. Search markers (cameras, APs, bins)
    for (const marker of markers) {
      const nameMatches = marker.name.toLowerCase().includes(q);
      const idMatches = marker.id.toLowerCase().includes(q);
      const skuMatches = marker.metadata.sku ? marker.metadata.sku.toLowerCase().includes(q) : false;
      const ipMatches = marker.metadata.ip ? marker.metadata.ip.toLowerCase().includes(q) : false;

      if (nameMatches || idMatches || skuMatches || ipMatches) {
        results.push({
          type: 'marker',
          title: marker.name,
          subtitle: `${marker.type.toUpperCase()} • ${marker.metadata.sku || marker.metadata.ip || marker.metadata.bay || ''}`,
          badge: marker.type === 'camera' ? 'Camera' : marker.type === 'network_ap' ? 'AP' : 'Bin',
          rackId: '',
          position: marker.position,
        });
      }
    }

    return results.slice(0, 12);
  }, [searchQuery, blueprintItems, markers]);

  const selectedMarker = useMemo(
    () => markers.find((m) => m.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId]
  );

  const selectedBlueprintItem = useMemo(
    () => blueprintItems.find((b) => b.id === selectedBlueprintId) ?? null,
    [blueprintItems, selectedBlueprintId]
  );

  const visibleMeshCount = useMemo(
    () => meshOverrides.filter((m) => m.visible).length,
    [meshOverrides]
  );

  // Record a snapshot before mutating markers or blueprintItems
  const pushHistory = () => {
    setPastHistory((prev) => [
      ...prev.slice(-39),
      { markers, blueprintItems },
    ]);
    setFutureHistory([]);
  };

  const handleUndo = () => {
    if (pastHistory.length === 0) return;
    const previous = pastHistory[pastHistory.length - 1];
    setFutureHistory((prev) => [{ markers, blueprintItems }, ...prev]);
    setPastHistory((prev) => prev.slice(0, -1));
    setMarkers(previous.markers);
    setBlueprintItems(previous.blueprintItems);
  };

  const handleRedo = () => {
    if (futureHistory.length === 0) return;
    const next = futureHistory[0];
    setPastHistory((prev) => [...prev, { markers, blueprintItems }]);
    setFutureHistory((prev) => prev.slice(1));
    setMarkers(next.markers);
    setBlueprintItems(next.blueprintItems);
  };

  const handleUpdateMarker = (updated: FacilityMarker) => {
    pushHistory();
    setMarkers((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  };

  const handleDeleteMarker = (id: string) => {
    pushHistory();
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMarkerId === id) setSelectedMarkerId(null);
  };

  const handleAddMarker = (newMarker: FacilityMarker) => {
    pushHistory();
    setMarkers((prev) => [...prev, newMarker]);
  };

  const handleUpdateMeshOverride = (override: MeshOverride) => {
    setMeshOverrides((prev) =>
      prev.map((m) => (m.meshIndex === override.meshIndex ? override : m))
    );
  };

  const handleCreateMarkerAtPoint = (
    type: MarkerType,
    point: [number, number, number]
  ) => {
    const prefix =
      type === 'camera' ? 'CAM' : type === 'network_ap' ? 'AP' : 'BIN';
    const num = markers.length + 101;
    const created: FacilityMarker = {
      id: `${prefix}-${num}`,
      type,
      name:
        type === 'camera'
          ? `Calibrated Camera #${markers.length + 1}`
          : type === 'network_ap'
          ? `Calibrated AP #${markers.length + 1}`
          : `Calibrated Pallet #${markers.length + 1}`,
      position: point,
      rotation: [0, 0, 0],
      modelVariant: type === 'inventory_bin' ? 'pallet_stack' : 'pin',
      metadata:
        type === 'camera'
          ? {
              ip: `10.24.10.${num}`,
              streamUrl: `rtsp://10.24.10.${num}:554/stream`,
              description: 'Placed via 3D Anchor Calibration',
              bay: 'Calibrated Node',
              status: 'online',
            }
          : type === 'network_ap'
          ? {
              ip: `10.24.20.${num}`,
              linkSpeed: '2.5 Gbps PoE+',
              connectedClients: 18,
              description: 'Placed via 3D Anchor Calibration',
              bay: 'Calibrated Node',
              status: 'online',
            }
          : {
              sku: `SKU-CAL-${num}`,
              description: 'Placed via 3D Anchor Calibration',
              qty: 240,
              maxQty: 500,
              bay: 'Calibrated Floor',
              status: 'online',
            },
    };
    setMarkers((prev) => [...prev, created]);
    setSelectedMarkerId(created.id);
  };

  const handleAppModeChange = (mode: 'view' | 'edit') => {
    setAppMode(mode);
    if (mode === 'view') {
      // In View Mode, strictly lock to Clean Blueprint model and disable edit/calibration modes
      setDisplayMode('clean_shell');
      setEditModelMode(false);
      setCalibrationMode(false);
    }
  };

  const handleSelectCardinalFacing = (newFacing: CardinalFacing) => {
    pushHistory();
    setCardinalFacing(newFacing);
    setBlueprintItems((prev) => applyCardinalOrientation(prev, newFacing));
    try {
      localStorage.setItem('waretrack_cardinal_facing', newFacing);
    } catch {
      // Ignore
    }
  };

  const handleRotateOrientation = (dir: 'cw' | 'ccw') => {
    const facings: CardinalFacing[] = ['north', 'east', 'south', 'west'];
    const curIdx = facings.indexOf(cardinalFacing);
    const nextIdx =
      dir === 'cw'
        ? (curIdx + 1) % facings.length
        : (curIdx - 1 + facings.length) % facings.length;
    handleSelectCardinalFacing(facings[nextIdx]);
  };

  const handleSaveOdooConfig = (cfg: OdooSettingsConfig) => {
    setOdooConfig(cfg);
    try {
      localStorage.setItem('waretrack_odoo_config', JSON.stringify(cfg));
    } catch {
      // Ignore
    }
  };

  const handleToggleShelfTags = () => {
    setShowShelfTags((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('waretrack_show_shelf_tags', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleResetToDefaults = () => {
    pushHistory();
    setMarkers(DEFAULT_MARKERS);
    setMeshOverrides(DEFAULT_MESH_OVERRIDES);
    setBlueprintItems(
      applyCardinalOrientation(DEFAULT_BLUEPRINT_ITEMS, cardinalFacing)
    );
    setCutoutBoxes(DEFAULT_CUTOUT_BOXES);
  };

  const handleSelectSearchResult = (result: SearchResultItem) => {
    if (result.type === 'marker') {
      const foundMarker = markers.find(
        (m) => m.name === result.title || m.position === result.position
      );
      if (foundMarker) {
        setSelectedMarkerId(foundMarker.id);
        setSelectedBlueprintId(null);
      }
    } else if (result.rackId) {
      setSelectedBlueprintId(result.rackId);
      setSelectedMarkerId(null);
      if (result.slotKey) {
        setSelectedSlotKey(result.slotKey);
      }
    }

    // Smooth camera focus onto target
    const [tx, ty, tz] = result.position;
    setCameraCommand({
      type: 'focus',
      target: [tx, ty, tz],
      position: [tx + 3.2, ty + 2.8, tz + 3.6],
      timestamp: Date.now(),
    });
  };

  const handleSyncOdoo = async () => {
    setIsSyncingOdoo(true);
    setSyncStatusMsg(null);

    try {
      const res = await fetch('/api/odoo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(odooConfig),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || `HTTP ${res.status} from sync endpoint`);
      }

      const inventory: Array<{
        id: number;
        productId: number;
        sku: string;
        name: string;
        quantity: number;
        reservedQuantity: number;
        lot?: string;
        locationId: number;
        locationName: string;
        shortCode: string;
        barcode?: string;
        aliases?: string[];
      }> = data.inventory || [];

      // Map all possible lookup keys (shortCode e.g. "A-01-01-01", barcode, locationName, and aliases)
      const inventoryByCode = new Map<string, OdooProductQuant[]>();
      const locationIdByCode = new Map<string, number>();

      const registerQuant = (
        code: string | undefined,
        quant: OdooProductQuant,
        locId?: number
      ) => {
        if (!code) return;
        const normalized = code.toUpperCase().trim();
        if (!normalized) return;

        if (!inventoryByCode.has(normalized)) {
          inventoryByCode.set(normalized, []);
        }
        const list = inventoryByCode.get(normalized)!;
        if (!list.some((existing) => existing.id === quant.id)) {
          list.push(quant);
        }

        if (locId) {
          locationIdByCode.set(normalized, locId);
        }
      };

      for (const item of inventory) {
        const quant: OdooProductQuant = {
          id: item.id,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          reservedQuantity: item.reservedQuantity,
          lot: item.lot,
          locationId: item.locationId,
          locationName: item.locationName,
          shortCode: item.shortCode,
          barcode: item.barcode,
          aliases: item.aliases,
        };

        registerQuant(item.shortCode, quant, item.locationId);
        registerQuant(item.barcode, quant, item.locationId);
        registerQuant(item.locationName, quant, item.locationId);
        if (item.locationId) {
          registerQuant(String(item.locationId), quant, item.locationId);
        }
        if (Array.isArray(item.aliases)) {
          for (const a of item.aliases) {
            registerQuant(a, quant, item.locationId);
          }
        }
      }

      pushHistory();
      let matchedSlotCount = 0;
      let matchedProductCount = 0;

      setBlueprintItems((prev) =>
        prev.map((bp) => {
          if (bp.isNonInventory) return bp;
          const isShelfOrRack =
            bp.kind === 'rack' ||
            bp.kind === 'workbench' ||
            bp.kind === 'work_station_rack';
          if (!isShelfOrRack) return bp;

          const derived = deriveZoneAndRack(bp);
          const zone = (bp.zone || derived.zone || 'A').toUpperCase();
          const baseRowInt =
            parseInt(
              String(bp.rowNumber || bp.rackNumber || derived.rowNumber),
              10
            ) || 1;

          const bays = bp.bays ?? (bp.kind === 'rack' ? 3 : 2);
          const levels = bp.levels ?? 3;
          const rows = bp.rows ?? 1;

          // Ensure shelfLocations exists with all slot keys
          const currentLocations =
            bp.shelfLocations && Object.keys(bp.shelfLocations).length > 0
              ? { ...bp.shelfLocations }
              : generateAllShelfLocations(
                  zone,
                  baseRowInt,
                  bays,
                  levels,
                  rows
                );

          const updatedLocations = { ...currentLocations };
          let changed = false;

          for (let r = 1; r <= rows; r++) {
            const slotRow = baseRowInt + (r - 1);
            for (let b = 1; b <= bays; b++) {
              for (let l = 1; l <= levels; l++) {
                const slotKey = `R${r}-B${b}-L${l}`;
                const slot = updatedLocations[slotKey] || {
                  row: r,
                  bay: b,
                  level: l,
                  locationCode: '',
                  shortCode: '',
                };

                const stdCode = buildOdooShortCode(zone, slotRow, b, l); // e.g. "A-01-01-01"
                const stdHierarchical = `WH/Stock/Zone ${zone}/Row ${String(
                  slotRow
                ).padStart(2, '0')}/Rack ${String(b).padStart(
                  2,
                  '0'
                )}/Shelf ${String(l).padStart(2, '0')}`;
                const stdHierarchicalShort = `Zone ${zone}/Row ${String(
                  slotRow
                ).padStart(2, '0')}/Rack ${String(b).padStart(
                  2,
                  '0'
                )}/Shelf ${String(l).padStart(2, '0')}`;

                // All candidate search keys for this slot
                const candidates = [
                  slot.shortCode,
                  slot.locationCode,
                  slot.odooLocationId,
                  stdCode,
                  stdHierarchical,
                  stdHierarchicalShort,
                ]
                  .filter(Boolean)
                  .map((k) => String(k).toUpperCase().trim());

                let matchedProds: OdooProductQuant[] | undefined;
                let matchedLocId: number | undefined;

                for (const cand of candidates) {
                  if (inventoryByCode.has(cand)) {
                    matchedProds = inventoryByCode.get(cand);
                    matchedLocId = locationIdByCode.get(cand);
                    break;
                  }
                }

                // Also check fuzzy partial match if exact didn't hit
                if (!matchedProds) {
                  for (const [invCode, prods] of inventoryByCode.entries()) {
                    for (const cand of candidates) {
                      if (invCode.includes(cand) || cand.includes(invCode)) {
                        matchedProds = prods;
                        matchedLocId = locationIdByCode.get(invCode);
                        break;
                      }
                    }
                    if (matchedProds) break;
                  }
                }

                if (matchedProds && matchedProds.length > 0) {
                  const totalQty = matchedProds.reduce(
                    (sum, p) => sum + (p.quantity || 0),
                    0
                  );
                  updatedLocations[slotKey] = {
                    ...slot,
                    row: r,
                    bay: b,
                    level: l,
                    shortCode: slot.shortCode || stdCode,
                    locationCode: slot.locationCode || stdCode,
                    products: matchedProds,
                    totalQuantity: totalQty,
                    odooLocationId: matchedLocId
                      ? String(matchedLocId)
                      : slot.odooLocationId,
                    notes: `Synced from Odoo (${matchedProds.length} products, ${totalQty} units)`,
                  };
                  matchedSlotCount++;
                  matchedProductCount += matchedProds.length;
                  changed = true;
                } else if (!slot.shortCode) {
                  updatedLocations[slotKey] = {
                    ...slot,
                    row: r,
                    bay: b,
                    level: l,
                    shortCode: stdCode,
                    locationCode: stdCode,
                  };
                  changed = true;
                }
              }
            }
          }

          return changed ? { ...bp, shelfLocations: updatedLocations } : bp;
        })
      );

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSyncTime(timeStr);
      try {
        localStorage.setItem('waretrack_last_sync_time', timeStr);
      } catch {}

      setSyncStatusMsg({
        type: 'success',
        text: `Sync complete! Synced ${inventory.length} quants from Odoo. Matched ${matchedSlotCount} shelf slots (${matchedProductCount} products).`,
      });
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to sync inventory from Odoo.',
      });
    } finally {
      setIsSyncingOdoo(false);
    }
  };

  const handleSaveUnifiConfig = (cfg: UnifiSettingsConfig) => {
    setUnifiConfig(cfg);
    try {
      localStorage.setItem('waretrack_unifi_config', JSON.stringify(cfg));
    } catch {
      // Ignore
    }
  };

  const handleUpdateFsdConfig = (cfg: FsdVisionSettingsConfig) => {
    setFsdConfig(cfg);
    try {
      localStorage.setItem('waretrack_fsd_vision_config', JSON.stringify(cfg));
    } catch {
      // Ignore
    }
  };

  const handleSyncUnifiCameras = async () => {
    setIsSyncingUnifi(true);
    setUnifiSyncStatusMsg(null);

    try {
      const res = await fetch('/api/unifi/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unifiConfig),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || `HTTP ${res.status} from UniFi Protect`);
      }

      const discovered = data.cameras || [];
      if (discovered.length === 0) {
        setUnifiSyncStatusMsg({
          type: 'success',
          text: `Connected to ${data.nvrName || 'UniFi Protect'}, but no cameras were found on this console.`,
        });
        return;
      }

      pushHistory();

      setMarkers((prevMarkers) => {
        const existingCams = prevMarkers.filter((m) => m.type === 'camera');
        const otherMarkers = prevMarkers.filter((m) => m.type !== 'camera');

        const usedMarkerIds = new Set<string>();
        const updatedCams: FacilityMarker[] = [];

        // Map each discovered UniFi Protect camera
        discovered.forEach((uCam: any, idx: number) => {
          // 1. Try to match by unifiId, IP, or name
          let matched = existingCams.find(
            (m) =>
              !usedMarkerIds.has(m.id) &&
              (m.metadata.unifiId === uCam.id ||
                (uCam.ip && m.metadata.ip === uCam.ip) ||
                m.name.toLowerCase().includes(uCam.name.toLowerCase()) ||
                uCam.name.toLowerCase().includes(m.name.toLowerCase()))
          );

          // 2. Fallback: match first available unassigned camera slot
          if (!matched) {
            matched = existingCams.find((m) => !usedMarkerIds.has(m.id));
          }

          if (matched) {
            usedMarkerIds.add(matched.id);
            updatedCams.push({
              ...matched,
              name: uCam.name,
              metadata: {
                ...matched.metadata,
                ip: uCam.ip || matched.metadata.ip,
                streamUrl: uCam.streamUrl || matched.metadata.streamUrl,
                status: uCam.state === 'online' ? 'online' : 'offline',
                unifiId: uCam.id,
                unifiModel: uCam.model,
                unifiConsoleId: uCam.consoleId || data.consoleId,
                rtspHigh: uCam.rtspHigh,
                rtspMedium: uCam.rtspMedium,
                rtspLow: uCam.rtspLow,
                description: `UniFi ${uCam.model} • IP: ${uCam.ip || 'DHCP'} • Status: ${uCam.state}`,
              },
            });
          } else {
            // 3. Create a new camera pin along the perimeter walls
            const newId = `CAM-${String(existingCams.length + idx + 1).padStart(2, '0')}`;
            const perimeterSlots: [number, number, number][] = [
              [5.95, 1.05, -8.55],
              [5.95, 1.05, 8.35],
              [-5.95, 1.05, 0.85],
              [-5.95, 1.05, -6.5],
              [-5.95, 1.05, 6.5],
              [0, 1.05, -8.55],
            ];
            const p = perimeterSlots[idx % perimeterSlots.length];
            const offsetZ = Math.floor(idx / perimeterSlots.length) * 1.5;

            updatedCams.push({
              id: newId,
              type: 'camera',
              name: uCam.name,
              position: [p[0], p[1], p[2] + offsetZ],
              rotation: [0, 0, 0],
              modelVariant: 'pin',
              metadata: {
                ip: uCam.ip,
                streamUrl: uCam.streamUrl,
                status: uCam.state === 'online' ? 'online' : 'offline',
                unifiId: uCam.id,
                unifiModel: uCam.model,
                unifiConsoleId: uCam.consoleId || data.consoleId,
                rtspHigh: uCam.rtspHigh,
                rtspMedium: uCam.rtspMedium,
                rtspLow: uCam.rtspLow,
                description: `UniFi ${uCam.model} • IP: ${uCam.ip || 'DHCP'}`,
                bay: 'UniFi Discovered',
              },
            });
          }
        });

        // Keep any remaining manual cameras that were not matched
        existingCams.forEach((m) => {
          if (!usedMarkerIds.has(m.id)) {
            updatedCams.push(m);
          }
        });

        return [...otherMarkers, ...updatedCams];
      });

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastUnifiSyncTime(timeStr);
      try {
        localStorage.setItem('waretrack_last_unifi_sync_time', timeStr);
      } catch {}

      setUnifiSyncStatusMsg({
        type: 'success',
        text: `Successfully mapped ${discovered.length} camera feed(s) from ${data.nvrName || 'UniFi Protect'}!`,
      });
    } catch (err: any) {
      setUnifiSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to sync cameras from UniFi Protect.',
      });
    } finally {
      setIsSyncingUnifi(false);
    }
  };

  const activeDisplayMode: DisplayMode =
    appMode === 'view' ? 'clean_shell' : displayMode;

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <TopNavbar
        appMode={appMode}
        onAppModeChange={handleAppModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSelectSearchResult={handleSelectSearchResult}
        isSyncingOdoo={isSyncingOdoo}
        onSyncOdoo={handleSyncOdoo}
        lastSyncTime={lastSyncTime}
        displayMode={activeDisplayMode}
        onDisplayModeChange={(mode) => {
          if (appMode === 'edit') setDisplayMode(mode);
        }}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === 'daylight' ? 'dark' : 'daylight'))
        }
        editModelMode={editModelMode}
        onToggleEditModel={() => {
          setEditModelMode((prev) => !prev);
          setSelectedMarkerId(null);
        }}
        calibrationMode={calibrationMode}
        onToggleCalibration={() => setCalibrationMode((prev) => !prev)}
        visibleMeshCount={visibleMeshCount}
        totalMeshCount={meshOverrides.length}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => {
          setIsSettingsOpen((prev) => !prev);
          if (!isSettingsOpen) {
            setSelectedBlueprintId(null);
            setSelectedMarkerId(null);
          }
        }}
        showCameraFeeds3D={showCameraFeeds3D}
        onToggleCameraFeeds3D={() => {
          setShowCameraFeeds3D((prev) => {
            const next = !prev;
            if (next && activeFilter !== 'all' && activeFilter !== 'camera') {
              setActiveFilter('all');
            }
            return next;
          });
        }}
        showSpatialVision3D={showSpatialVision3D}
        onToggleSpatialVision3D={() => {
          setShowSpatialVision3D((prev) => !prev);
        }}
        isFsdSettingsOpen={isFsdSettingsOpen}
        onToggleFsdSettings={() => {
          setIsFsdSettingsOpen((prev) => {
            const next = !prev;
            if (next && !showSpatialVision3D) {
              setShowSpatialVision3D(true);
            }
            return next;
          });
        }}
      />

      <HudOverlays
        appMode={appMode}
        markers={filteredMarkers}
        theme={theme}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        roofCutoffY={roofCutoffY}
        onRoofCutoffChange={setRoofCutoffY}
        displayMode={activeDisplayMode}
        onDisplayModeChange={(mode) => {
          if (appMode === 'edit') setDisplayMode(mode);
        }}
        panMode={panMode}
        onTogglePanMode={() => setPanMode((prev) => !prev)}
        cardinalFacing={cardinalFacing}
        onRotateOrientation={handleRotateOrientation}
        onCameraAction={(type) =>
          setCameraCommand({ type, timestamp: Date.now() })
        }
        onSelectMarker={(marker) => setSelectedMarkerId(marker.id)}
        selectedMarkerId={selectedMarkerId}
      />

      <WarehouseCanvas
        appMode={appMode}
        displayMode={activeDisplayMode}
        theme={theme}
        roofCutoffY={roofCutoffY}
        markers={filteredMarkers}
        selectedMarker={selectedMarker}
        meshOverrides={meshOverrides}
        blueprintItems={blueprintItems}
        selectedBlueprintId={selectedBlueprintId}
        selectedSlotKey={selectedSlotKey}
        cutoutBoxes={cutoutBoxes}
        selectedMeshIndex={selectedMeshIndex}
        editModelMode={editModelMode}
        calibrationMode={calibrationMode}
        panMode={panMode}
        calibratedPoint={calibratedPoint}
        cameraCommand={cameraCommand}
        searchQuery={searchQuery}
        showCameraFeeds3D={appMode === 'view' && showCameraFeeds3D}
        showSpatialVision3D={appMode === 'view' && showSpatialVision3D}
        fsdConfig={fsdConfig}
        unifiConfig={unifiConfig}
        cardinalFacing={cardinalFacing}
        onSelectCardinalFacing={handleSelectCardinalFacing}
        isFsdSettingsOpen={appMode === 'view' && isFsdSettingsOpen}
        selectedFsdCameraId={selectedFsdCameraId}
        onSelectFsdCameraId={setSelectedFsdCameraId}
        onUpdateMarker={handleUpdateMarker}
        clickGroundToPlaceZone={clickGroundToPlaceZone}
        testPreviewPoint={testPreviewPoint}
        onReportRawDetections={setLatestDetectionsByCamera}
        onSelectMarker={(marker) => {
          setSelectedMarkerId(marker.id);
          setSelectedBlueprintId(null);
        }}
        onSelectMesh={(meshIndex) => {
          if (meshIndex >= 0) {
            setSelectedMeshIndex(meshIndex);
            setSelectedMarkerId(null);
            setSelectedBlueprintId(null);
          }
        }}
        onSelectBlueprintItem={(id) => {
          setSelectedBlueprintId(id);
          setSelectedMarkerId(null);
          setSelectedSlotKey('R1-B1-L1');
        }}
        onSelectSlot={(slotKey) => setSelectedSlotKey(slotKey)}
        onUpdateBlueprintItem={(updated) => {
          pushHistory();
          setBlueprintItems((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          );
        }}
        onCalibrateClick={(pt, meshIdx) => {
          setCalibratedPoint(pt);
          setCalibratedMeshIndex(meshIdx !== undefined ? meshIdx : null);
        }}
      />

      <DetailDrawer
        appMode={appMode}
        theme={theme}
        selectedMarker={selectedMarker}
        selectedBlueprintItem={selectedBlueprintItem}
        selectedSlotKey={selectedSlotKey}
        onSelectSlot={setSelectedSlotKey}
        editModelMode={editModelMode}
        selectedMeshIndex={selectedMeshIndex}
        markers={markers}
        meshOverrides={meshOverrides}
        blueprintItems={blueprintItems}
        cutoutBoxes={cutoutBoxes}
        onCloseMarker={() => setSelectedMarkerId(null)}
        onCloseBlueprintItem={() => setSelectedBlueprintId(null)}
        onSelectMarker={(m) => {
          setSelectedMarkerId(m.id);
          setSelectedBlueprintId(null);
        }}
        onUpdateMarker={handleUpdateMarker}
        onDeleteMarker={handleDeleteMarker}
        onAddMarker={handleAddMarker}
        onSelectBlueprintItem={(id) => {
          setSelectedBlueprintId(id);
          setSelectedMarkerId(null);
          setSelectedSlotKey('R1-B1-L1');
        }}
        onAddBlueprintItem={(item) => {
          pushHistory();
          setBlueprintItems((prev) => [...prev, item]);
        }}
        onUpdateBlueprintItem={(updated) => {
          pushHistory();
          setBlueprintItems((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          );
        }}
        onDeleteBlueprintItem={(id) => {
          pushHistory();
          setBlueprintItems((prev) => prev.filter((b) => b.id !== id));
          if (selectedBlueprintId === id) setSelectedBlueprintId(null);
        }}
        onResetBlueprintItems={() => {
          pushHistory();
          setBlueprintItems(DEFAULT_BLUEPRINT_ITEMS);
        }}
        onSelectMesh={setSelectedMeshIndex}
        onUpdateMeshOverride={handleUpdateMeshOverride}
        onResetMeshOverrides={() => setMeshOverrides(DEFAULT_MESH_OVERRIDES)}
        onToggleCutoutBox={(id) =>
          setCutoutBoxes((prev) =>
            prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
          )
        }
        onAddCutoutBox={() => {
          const nextId = `CUT-0${cutoutBoxes.length + 1}`;
          setCutoutBoxes((prev) => [
            ...prev,
            {
              id: nextId,
              name: `Clean Mask Block #${cutoutBoxes.length + 1}`,
              position: calibratedPoint || [0, -1.35, 0],
              size: [2.4, 0.4, 2.4],
              mode: 'replacement_floor',
              color: '#e2e8f0',
              active: true,
            },
          ]);
        }}
        onDeleteCutoutBox={(id) =>
          setCutoutBoxes((prev) => prev.filter((b) => b.id !== id))
        }
        onUpdateCutoutBox={(updated) =>
          setCutoutBoxes((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          )
        }
        canUndo={pastHistory.length > 0}
        canRedo={futureHistory.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        unifiConfig={unifiConfig}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === 'daylight' ? 'dark' : 'daylight'))
        }
        odooConfig={odooConfig}
        onSaveOdooConfig={handleSaveOdooConfig}
        unifiConfig={unifiConfig}
        onSaveUnifiConfig={handleSaveUnifiConfig}
        cardinalFacing={cardinalFacing}
        onSelectCardinalFacing={handleSelectCardinalFacing}
        showShelfTags={showShelfTags}
        onToggleShelfTags={handleToggleShelfTags}
        onResetToDefaults={handleResetToDefaults}
        isSyncingOdoo={isSyncingOdoo}
        onSyncOdoo={handleSyncOdoo}
        lastSyncTime={lastSyncTime}
        syncStatusMsg={syncStatusMsg}
        isSyncingUnifi={isSyncingUnifi}
        onSyncUnifi={handleSyncUnifiCameras}
        lastUnifiSyncTime={lastUnifiSyncTime}
        unifiSyncStatusMsg={unifiSyncStatusMsg}
      />

      <CalibrationOverlay
        calibrationMode={calibrationMode}
        calibratedPoint={calibratedPoint}
        calibratedMeshIndex={calibratedMeshIndex}
        onClose={() => setCalibrationMode(false)}
        onCreateMarkerAtPoint={handleCreateMarkerAtPoint}
        onHideClickedMesh={(meshIdx) => {
          setMeshOverrides((prev) =>
            prev.map((m) =>
              m.meshIndex === meshIdx ? { ...m, visible: false } : m
            )
          );
        }}
      />

      {appMode === 'view' && (
        <FsdVisionSettingsPanel
          isOpen={isFsdSettingsOpen}
          onClose={() => setIsFsdSettingsOpen(false)}
          theme={theme}
          fsdConfig={fsdConfig}
          onUpdateFsdConfig={handleUpdateFsdConfig}
          cameras={markers.filter((m) => m.type === 'camera')}
          selectedCameraId={selectedFsdCameraId}
          onSelectCameraId={setSelectedFsdCameraId}
          onUpdateCameraMarker={handleUpdateMarker}
          unifiConfig={unifiConfig}
          cardinalFacing={cardinalFacing}
          onSelectCardinalFacing={handleSelectCardinalFacing}
          clickGroundToPlaceZone={clickGroundToPlaceZone}
          onToggleClickGroundToPlaceZone={setClickGroundToPlaceZone}
          testPreviewPoint={testPreviewPoint}
          onChangeTestPreviewPoint={setTestPreviewPoint}
          onFocus3DCamera={(target, position) =>
            setCameraCommand({
              type: 'focus',
              target,
              position,
              timestamp: Date.now(),
            })
          }
          latestDetectionsByCamera={latestDetectionsByCamera}
        />
      )}
    </main>
  );
}
