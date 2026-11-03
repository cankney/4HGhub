import { BlueprintItem } from './blueprint-geometry';
import { FacilityMarker, MeshOverride, CutoutBox } from './markers';

/**
 * Sanitizes and compacts the warehouse digital twin state before saving to
 * localStorage, Firestore, or exporting to baseline defaults.
 * 
 * Prevents HTTP 413 (Payload Too Large) and browser QuotaExceededError while
 * strictly preserving 100% of the 3D model geometry, shelf positions, custom
 * locations, and marker device configurations.
 */
export function sanitizeTwinStateForPersistence(rawState: Record<string, any>): Record<string, any> {
  if (!rawState || typeof rawState !== 'object') return {};

  const clean: Record<string, any> = {};

  // 1. Blueprint items: preserve 100% of spatial architecture, dimensions, rotations, slots, and codes
  if (Array.isArray(rawState.blueprintItems) && rawState.blueprintItems.length > 0) {
    clean.blueprintItems = rawState.blueprintItems.map((bp: any) => {
      const cleanBp: any = {
        id: bp.id,
        name: bp.name,
        kind: bp.kind,
        position: bp.position,
        size: bp.size,
      };
      if (bp.rotationY !== undefined) cleanBp.rotationY = bp.rotationY;
      if (bp.color !== undefined) cleanBp.color = bp.color;
      if (bp.bays !== undefined) cleanBp.bays = bp.bays;
      if (bp.levels !== undefined) cleanBp.levels = bp.levels;
      if (bp.rows !== undefined) cleanBp.rows = bp.rows;
      if (bp.zone !== undefined) cleanBp.zone = bp.zone;
      if (bp.rowNumber !== undefined) cleanBp.rowNumber = bp.rowNumber;
      if (bp.rackNumber !== undefined) cleanBp.rackNumber = bp.rackNumber;
      if (bp.locationPrefix !== undefined) cleanBp.locationPrefix = bp.locationPrefix;
      if (bp.customLocation !== undefined) cleanBp.customLocation = bp.customLocation;
      if (bp.isNonInventory !== undefined) cleanBp.isNonInventory = bp.isNonInventory;
      if (bp.odooWarehouseCode !== undefined) cleanBp.odooWarehouseCode = bp.odooWarehouseCode;
      if (bp.trackZoneInventory !== undefined) cleanBp.trackZoneInventory = bp.trackZoneInventory;
      if (bp.totalQuantity !== undefined) cleanBp.totalQuantity = bp.totalQuantity;

      // Clean shelfLocations: keep codes and slot configs, strip redundant heavy quant trees
      if (bp.shelfLocations && typeof bp.shelfLocations === 'object') {
        const cleanSlots: Record<string, any> = {};
        for (const [slotKey, slot] of Object.entries(bp.shelfLocations)) {
          if (!slot || typeof slot !== 'object') continue;
          const s = slot as any;
          const cleanSlot: any = {
            row: s.row,
            bay: s.bay,
            level: s.level,
            locationCode: s.locationCode,
            shortCode: s.shortCode,
          };
          if (s.odooLocationId) cleanSlot.odooLocationId = s.odooLocationId;
          if (s.totalQuantity !== undefined) cleanSlot.totalQuantity = s.totalQuantity;
          if (s.notes) cleanSlot.notes = s.notes;

          // If products exist, store a compact representation (id, sku, name, qty) max 20 per slot
          if (Array.isArray(s.products)) {
            cleanSlot.products = s.products.slice(0, 20).map((p: any) => ({
              id: p.id,
              sku: p.sku || '',
              name: p.name || '',
              quantity: p.quantity || 0,
            }));
          }
          cleanSlots[slotKey] = cleanSlot;
        }
        cleanBp.shelfLocations = cleanSlots;
      }

      // If zone has products, store compact representation max 30 items
      if (Array.isArray(bp.products)) {
        cleanBp.products = bp.products.slice(0, 30).map((p: any) => ({
          id: p.id,
          sku: p.sku || '',
          name: p.name || '',
          quantity: p.quantity || 0,
        }));
      }

      return cleanBp;
    });
  }

  // 2. Markers: preserve all marker IDs, types, positions, rotations, scales, model variants, camera/network config
  if (Array.isArray(rawState.markers) && rawState.markers.length > 0) {
    clean.markers = rawState.markers.map((m: any) => {
      const cleanMarker: any = {
        id: m.id,
        name: m.name,
        type: m.type,
        position: m.position,
      };
      if (m.rotation) cleanMarker.rotation = m.rotation;
      if (m.scale) cleanMarker.scale = m.scale;
      if (m.modelVariant) cleanMarker.modelVariant = m.modelVariant;
      if (m.status) cleanMarker.status = m.status;

      // Metadata: keep device IDs, IPs, RTSP config, but strip ephemeral live polling telemetry (networkStats)
      if (m.metadata && typeof m.metadata === 'object') {
        const { networkStats, ...persistentMeta } = m.metadata;
        cleanMarker.metadata = persistentMeta;
      } else {
        cleanMarker.metadata = {};
      }

      return cleanMarker;
    });
  }

  // 3. Mesh Overrides
  if (Array.isArray(rawState.meshOverrides)) {
    clean.meshOverrides = rawState.meshOverrides;
  }

  // 4. Cutout Boxes
  if (Array.isArray(rawState.cutoutBoxes)) {
    clean.cutoutBoxes = rawState.cutoutBoxes;
  }

  // 5. User settings & display configurations
  if (rawState.cardinalFacing) clean.cardinalFacing = rawState.cardinalFacing;
  if (rawState.odooConfig) clean.odooConfig = rawState.odooConfig;
  if (rawState.unifiConfig) clean.unifiConfig = rawState.unifiConfig;
  if (rawState.fsdConfig) clean.fsdConfig = rawState.fsdConfig;
  if (rawState.showSpatialVision3D !== undefined) clean.showSpatialVision3D = rawState.showSpatialVision3D;
  if (rawState.showCameraFeeds3D !== undefined) clean.showCameraFeeds3D = rawState.showCameraFeeds3D;
  if (rawState.showShelfTags !== undefined) clean.showShelfTags = rawState.showShelfTags;
  if (rawState.displayMode) clean.displayMode = rawState.displayMode;
  if (rawState.theme) clean.theme = rawState.theme;
  if (rawState.roofCutoffY !== undefined) clean.roofCutoffY = rawState.roofCutoffY;
  if (rawState.lastSyncTime) clean.lastSyncTime = rawState.lastSyncTime;

  return clean;
}
