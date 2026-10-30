export type MarkerType = 'camera' | 'network_ap' | 'inventory_bin';

export type ModelVariant =
  | 'pin'
  | 'pallet_stack'
  | 'rack'
  | 'forklift'
  | 'box_zone';

export interface CameraVisionMapping {
  enabled: boolean;
  zoneCenterX: number;
  zoneCenterZ: number;
  zoneWidth: number;
  zoneDepth: number;
  rotationDeg: number;
  flipHorizontal: boolean;
  flipDepth: boolean;
  horizonCutoffPct: number;
  sceneContext: string;
  ignoredRegions?: { u: number; v: number; radius: number }[];
}

export interface FsdVisionSettingsConfig {
  minConfidencePct: number;
  showParkedVehicles: boolean;
  detectPeople: boolean;
  detectVehicles: boolean;
  detectForklifts: boolean;
  strictAiOnly: boolean;
  showCoverageZones3D: boolean;
}

export const DEFAULT_FSD_VISION_CONFIG: FsdVisionSettingsConfig = {
  minConfidencePct: 45,
  showParkedVehicles: true,
  detectPeople: true,
  detectVehicles: true,
  detectForklifts: true,
  strictAiOnly: true,
  showCoverageZones3D: false,
};

export interface FacilityMarker {
  id: string;
  type: MarkerType;
  name: string;
  position: [number, number, number]; // [x, y, z] in Three.js coordinates
  rotation?: [number, number, number]; // [rx, ry, rz] in radians
  scale?: [number, number, number]; // [sx, sy, sz]
  modelVariant?: ModelVariant;
  metadata: {
    sku?: string;
    description?: string;
    qty?: number;
    maxQty?: number;
    streamUrl?: string;
    ip?: string;
    linkSpeed?: string;
    connectedClients?: number;
    bay?: string;
    status?: 'online' | 'warning' | 'offline';
    unifiId?: string;
    unifiModel?: string;
    unifiConsoleId?: string;
    rtspHigh?: string;
    rtspMedium?: string;
    rtspLow?: string;
    lastSeen?: string;
    visionMapping?: CameraVisionMapping;
  };
}

export interface MeshOverride {
  meshIndex: number;
  name: string;
  visible: boolean;
  colorOverride: string | null;
  opacity: number;
  positionOffset: [number, number, number];
}

export interface CutoutBox {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  mode: 'hide_visual' | 'replacement_floor' | 'highlight_zone';
  color: string;
  active: boolean;
}

export type DisplayMode = 'stylized' | 'realistic' | 'ghost' | 'clean_shell';

export function getDefaultCameraVisionMapping(
  cam: FacilityMarker
): CameraVisionMapping {
  if (cam.metadata.visionMapping) {
    const rawIgnored = cam.metadata.visionMapping.ignoredRegions || [];
    // Strip default doorway exclusion so exiting people are never suppressed
    const cleanIgnored = rawIgnored.filter(
      (r) => !(Math.abs(r.u - 0.55) < 0.05 && Math.abs(r.v - 0.33) < 0.05)
    );
    return {
      ...cam.metadata.visionMapping,
      ignoredRegions: cleanIgnored,
    };
  }
  const nameLower = cam.name.toLowerCase();
  const unifiId = cam.metadata.unifiId || '';

  // Shop West (Faces Overhead Door + Office Entry Door at Z=+8.45)
  if (
    unifiId === '6ac68c2001871c03e41d13fc' ||
    nameLower.includes('west') ||
    cam.id === 'CAM-03'
  ) {
    return {
      enabled: true,
      zoneCenterX: 1.8,
      zoneCenterZ: 12.8,
      zoneWidth: 12.0,
      zoneDepth: 8.0,
      rotationDeg: 0,
      flipHorizontal: false,
      flipDepth: false,
      horizonCutoffPct: 36,
      sceneContext:
        'Overhead Bay Door, Office Walkway Door & Gravel Parking Lot (Z = +8.45 Wall)',
      ignoredRegions: [],
    };
  }

  // Shop Front (Faces Main Roll-Up Door & Service Door at Z=-8.75)
  if (
    unifiId === '690664a40043a803e400a496' ||
    nameLower.includes('front') ||
    cam.id === 'CAM-01'
  ) {
    return {
      enabled: true,
      zoneCenterX: 2.2,
      zoneCenterZ: -13.2,
      zoneWidth: 12.0,
      zoneDepth: 8.5,
      rotationDeg: 180,
      flipHorizontal: false,
      flipDepth: false,
      horizonCutoffPct: 24,
      sceneContext: 'Main 12ft Roll-Up Door & Front Gravel Driveway (Z = -8.75 Wall)',
      ignoredRegions: [],
    };
  }

  // Shop Rear (Faces Rear Turnaround Loop along +X / +Z Corner)
  return {
    enabled: true,
    zoneCenterX: 10.2,
    zoneCenterZ: 4.5,
    zoneWidth: 11.0,
    zoneDepth: 8.0,
    rotationDeg: -90,
    flipHorizontal: false,
    flipDepth: false,
    horizonCutoffPct: 30,
    sceneContext: 'Rear Gravel Turnaround Loop & Perimeter Fence',
    ignoredRegions: [{ u: 0.92, v: 0.85, radius: 0.12 }],
  };
}

export const DEFAULT_MARKERS: FacilityMarker[] = [
  {
    id: 'CAM-01',
    type: 'camera',
    name: 'Shop Front',
    position: [5.95, 1.05, -8.55],
    rotation: [0, -Math.PI * 0.75, 0],
    modelVariant: 'pin',
    metadata: {
      ip: '192.168.2.9',
      streamUrl: 'rtsps://192.168.2.9:7441/PGQRYkM5A5UtWP7Z?enableSrtp',
      rtspHigh: 'rtsps://192.168.2.9:7441/PGQRYkM5A5UtWP7Z?enableSrtp',
      unifiId: '690664a40043a803e400a496',
      unifiModel: 'UVC G6 Bullet',
      unifiConsoleId: '6C63F87AF3F700000000091F2C0C00000000099C30EF00000000682F238C:58244400',
      description: 'UniFi G6 Bullet • Covers East Roll-Up Door & Main Aisle',
      bay: 'East Corner',
      status: 'online',
      visionMapping: {
        enabled: true,
        zoneCenterX: 2.2,
        zoneCenterZ: -13.2,
        zoneWidth: 12.0,
        zoneDepth: 8.5,
        rotationDeg: 180,
        flipHorizontal: false,
        flipDepth: false,
        horizonCutoffPct: 24,
        sceneContext: 'Main 12ft Roll-Up Door & Front Gravel Driveway (Z = -8.75 Wall)',
        ignoredRegions: [],
      },
    },
  },
  {
    id: 'CAM-02',
    type: 'camera',
    name: 'Shop Rear',
    position: [5.95, 1.05, 8.35],
    rotation: [0, Math.PI * 0.75, 0],
    modelVariant: 'pin',
    metadata: {
      ip: '192.168.2.9',
      streamUrl: 'rtsps://192.168.2.9:7441/jeOXhwjlvWIA9THa?enableSrtp',
      rtspHigh: 'rtsps://192.168.2.9:7441/jeOXhwjlvWIA9THa?enableSrtp',
      unifiId: '6941cc880038c003e4310d9c',
      unifiModel: 'UVC G6 Bullet',
      unifiConsoleId: '6C63F87AF3F700000000091F2C0C00000000099C30EF00000000682F238C:58244400',
      description: 'UniFi G6 Bullet 2 • Monitors Front-Left Rack & West Entry',
      bay: 'West Corner',
      status: 'online',
      visionMapping: {
        enabled: true,
        zoneCenterX: 10.2,
        zoneCenterZ: 4.5,
        zoneWidth: 11.0,
        zoneDepth: 8.0,
        rotationDeg: -90,
        flipHorizontal: false,
        flipDepth: false,
        horizonCutoffPct: 30,
        sceneContext: 'Rear Gravel Turnaround Loop & Perimeter Fence',
        ignoredRegions: [{ u: 0.92, v: 0.85, radius: 0.12 }],
      },
    },
  },
  {
    id: 'CAM-03',
    type: 'camera',
    name: 'Shop West',
    position: [-5.95, 1.05, 0.85],
    rotation: [0, 0, 0],
    modelVariant: 'pin',
    metadata: {
      ip: '192.168.2.9',
      streamUrl: 'rtsps://192.168.2.9:7441/Ogu9T5sV2ZjStxM3?enableSrtp',
      rtspHigh: 'rtsps://192.168.2.9:7441/Ogu9T5sV2ZjStxM3?enableSrtp',
      unifiId: '6ac68c2001871c03e41d13fc',
      unifiModel: 'UVC G6 Bullet',
      unifiConsoleId: '6C63F87AF3F700000000091F2C0C00000000099C30EF00000000682F238C:58244400',
      description: 'UniFi G6 Bullet 3 • Rear Perimeter & Utility Nook',
      bay: 'North Exterior',
      status: 'online',
      visionMapping: {
        enabled: true,
        zoneCenterX: 1.8,
        zoneCenterZ: 12.8,
        zoneWidth: 12.0,
        zoneDepth: 8.0,
        rotationDeg: 0,
        flipHorizontal: false,
        flipDepth: false,
        horizonCutoffPct: 36,
        sceneContext: 'Overhead Bay Door, Office Walkway Door & Gravel Parking Lot (Z = +8.45 Wall)',
        ignoredRegions: [],
      },
    },
  },
  {
    id: 'AP-01',
    type: 'network_ap',
    name: 'U7 Pro (Office Corridor)',
    position: [-0.45, 1.1, 5.2],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.11',
      linkSpeed: '2.5 Gbps PoE+',
      connectedClients: 24,
      description: 'UniFi U7 Pro • Mounted outside Enclosed Office Room',
      bay: 'Office Hallway',
      status: 'online',
    },
  },
  {
    id: 'AP-02',
    type: 'network_ap',
    name: 'U7 Pro XG (Center Racks)',
    position: [0.1, 1.15, -2.2],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.12',
      linkSpeed: '10 Gbps PoE++',
      connectedClients: 38,
      description: 'UniFi U7 Pro XG • Central Warehouse Racking Coverage',
      bay: 'Center Aisle',
      status: 'online',
    },
  },
  {
    id: 'AP-03',
    type: 'network_ap',
    name: 'SuperLink Gateway',
    position: [-1.1, 0.65, 1.65],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.10',
      linkSpeed: '1 Gbps IoT Gateway',
      connectedClients: 64,
      description: 'UniFi SuperLink Gateway • Mounted at Office Corner Wall',
      bay: 'Office Corner',
      status: 'online',
    },
  },
  {
    id: 'BIN-101',
    type: 'inventory_bin',
    name: 'Rack Row 1 • Cardboard Stock',
    position: [-2.42, -1.45, -7.91],
    rotation: [0, 0, 0],
    modelVariant: 'pin',
    metadata: {
      sku: 'SKU-CBX-440',
      description: 'Far East Wall 3-Bay Storage Rack (5.3m × 1.3m)',
      qty: 1906,
      maxQty: 2200,
      bay: 'Rack Row 1 (East)',
      status: 'online',
    },
  },
  {
    id: 'BIN-102',
    type: 'inventory_bin',
    name: 'Rack Row 2 • Euro Containers',
    position: [-2.09, -1.45, -5.48],
    rotation: [0, 0, 0],
    modelVariant: 'pin',
    metadata: {
      sku: 'SKU-PLC-297',
      description: 'Inner East Aisle 3-Bay Storage Rack (4.6m × 1.0m)',
      qty: 297,
      maxQty: 400,
      bay: 'Rack Row 2',
      status: 'online',
    },
  },
  {
    id: 'BIN-103',
    type: 'inventory_bin',
    name: 'Rack Row 3 • Safety & PPE',
    position: [-2.13, -1.45, -3.61],
    rotation: [0, 0, 0],
    modelVariant: 'pin',
    metadata: {
      sku: 'SKU-PPE-212',
      description: 'Center-Right Aisle 3-Bay Storage Rack (4.8m × 1.0m)',
      qty: 212,
      maxQty: 600,
      bay: 'Rack Row 3',
      status: 'warning',
    },
  },
  {
    id: 'BIN-104',
    type: 'inventory_bin',
    name: 'Center Island • Bulk Inventory',
    position: [3.43, -1.45, 0.38],
    rotation: [0, 0, 0],
    modelVariant: 'pin',
    metadata: {
      sku: 'SKU-PKT-880',
      description: 'Double-Deep Square Center Rack Island (2.8m × 2.2m)',
      qty: 4448,
      maxQty: 5000,
      bay: 'Center Island',
      status: 'online',
    },
  },
  {
    id: 'BIN-105',
    type: 'inventory_bin',
    name: 'Front-Left L-Rack Assembly',
    position: [4.45, -1.45, 5.05],
    rotation: [0, 0, 0],
    modelVariant: 'pin',
    metadata: {
      sku: 'SKU-LRK-510',
      description: 'South-West L-Shaped Storage Rack System',
      qty: 840,
      maxQty: 1000,
      bay: 'South-West Bay',
      status: 'online',
    },
  },
];

export const DEFAULT_MESH_OVERRIDES: MeshOverride[] = Array.from(
  { length: 11 },
  (_, index) => ({
    meshIndex: index,
    name: `Scan Segment #${index + 1}`,
    visible: true,
    colorOverride: null,
    opacity: 1,
    positionOffset: [0, 0, 0],
  })
);

export const DEFAULT_CUTOUT_BOXES: CutoutBox[] = [
  {
    id: 'CUT-01',
    name: 'Center Floor Clean Patch',
    position: [0, -1.48, 0],
    size: [3.2, 0.12, 4.5],
    mode: 'replacement_floor',
    color: '#e2e8f0',
    active: false,
  },
];
