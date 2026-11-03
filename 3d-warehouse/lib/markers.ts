import baselineWarehouseDefaults from './baseline-warehouse-defaults.json';

export type MarkerType =
  | 'camera'
  | 'network_ap'
  | 'network_switch'
  | 'network_gateway'
  | 'network_ups'
  | 'network_cloudkey'
  | 'network_superlink'
  | 'network_nas'
  | 'inventory_bin';

export type ModelVariant =
  | 'pin'
  | 'pallet_stack'
  | 'rack'
  | 'forklift'
  | 'box_zone';

export interface NetworkClientStation {
  mac: string;
  ip: string;
  hostname: string;
  deviceType?: 'scanner' | 'tablet' | 'phone' | 'laptop' | 'iot' | 'workstation';
  signalDbm: number;
  wifiExperiencePct: number;
  radio: '2.4GHz' | '5GHz' | '6GHz';
  channel: number;
  rxRateMbps: number;
  txRateMbps: number;
  uptimeSeconds: number;
  downloadBytes?: number;
  uploadBytes?: number;
}

export interface SwitchPortInfo {
  portNumber: number;
  name: string;
  up: boolean;
  speed: string;
  poePowerWatts?: number;
  poeClass?: string;
  connectedDevice?: string;
  connectedType?: 'ap' | 'camera' | 'nas' | 'gateway' | 'cloudkey' | 'workstation' | 'spare';
  rxBytes?: number;
  txBytes?: number;
}

export interface ApRadioInfo {
  band: '2.4GHz' | '5GHz' | '6GHz';
  channel: number;
  channelWidth: string;
  utilizationPct: number;
  txPowerDbm: number;
  interferencePct?: number;
}

export interface NetworkDeviceStats {
  throughputRxMbps: number;
  throughputTxMbps: number;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
  temperatureC?: number;
  uptime?: string;
  mac?: string;
  gatewayIp?: string;
  firmwareVersion?: string;
  clients?: NetworkClientStation[];
  ports?: SwitchPortInfo[];
  radios?: ApRadioInfo[];
  poeTotalWatts?: number;
  poeBudgetWatts?: number;
  batteryPct?: number;
  batteryRuntimeMin?: number;
  acPowerState?: 'normal' | 'on_battery' | 'warning';
  batteryLoadWatts?: number;
  storageUsedGb?: number;
  storageTotalGb?: number;
  appsRunning?: { name: string; status: 'running' | 'stopped'; version?: string }[];
  wanStatus?: 'connected' | 'disconnected';
  wanIp?: string;
  wanLatencyMs?: number;
  ispName?: string;
  superlinkFrequency?: string;
  superlinkPairedNodes?: number;
  superlinkRssi?: number;
}

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
    networkStats?: NetworkDeviceStats;
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

const STATIC_MARKERS: FacilityMarker[] = [
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
      unifiModel: 'U7 Pro',
      description: 'UniFi U7 Pro • Ceiling mounted outside Enclosed Office',
      bay: 'Office Hallway',
      status: 'online',
      networkStats: {
        throughputRxMbps: 142.8,
        throughputTxMbps: 28.4,
        cpuUsagePct: 18,
        memoryUsagePct: 42,
        temperatureC: 46,
        uptime: '28d 14h 22m',
        mac: '68:d7:9a:12:44:01',
        gatewayIp: '10.24.20.1',
        firmwareVersion: '7.0.59',
        radios: [
          { band: '2.4GHz', channel: 6, channelWidth: 'HE20', utilizationPct: 24, txPowerDbm: 20 },
          { band: '5GHz', channel: 44, channelWidth: 'HE80', utilizationPct: 38, txPowerDbm: 24 },
          { band: '6GHz', channel: 69, channelWidth: 'HE160', utilizationPct: 12, txPowerDbm: 22 },
        ],
        clients: [
          { mac: 'f4:d4:88:1a:2b:01', ip: '10.24.20.101', hostname: 'Forklift-Tablet-01', deviceType: 'tablet', signalDbm: -52, wifiExperiencePct: 99, radio: '5GHz', channel: 44, rxRateMbps: 433, txRateMbps: 390, uptimeSeconds: 18400, downloadBytes: 420000000, uploadBytes: 85000000 },
          { mac: 'ac:bc:32:4f:55:02', ip: '10.24.20.102', hostname: 'Zebra-TC57-Barcode-01', deviceType: 'scanner', signalDbm: -56, wifiExperiencePct: 98, radio: '5GHz', channel: 44, rxRateMbps: 288, txRateMbps: 240, uptimeSeconds: 29300, downloadBytes: 154000000, uploadBytes: 32000000 },
          { mac: 'e8:80:2e:91:12:03', ip: '10.24.20.103', hostname: 'iPad-Inventory-West', deviceType: 'tablet', signalDbm: -48, wifiExperiencePct: 100, radio: '6GHz', channel: 69, rxRateMbps: 1200, txRateMbps: 980, uptimeSeconds: 43200, downloadBytes: 1850000000, uploadBytes: 240000000 },
          { mac: '3c:22:fb:78:90:04', ip: '10.24.20.104', hostname: 'MacBook-Pro-Cole', deviceType: 'laptop', signalDbm: -50, wifiExperiencePct: 99, radio: '6GHz', channel: 69, rxRateMbps: 1440, txRateMbps: 1200, uptimeSeconds: 52100, downloadBytes: 4200000000, uploadBytes: 890000000 },
          { mac: '28:6b:35:bc:41:05', ip: '10.24.20.105', hostname: 'Office-iPhone-15', deviceType: 'phone', signalDbm: -58, wifiExperiencePct: 96, radio: '5GHz', channel: 44, rxRateMbps: 400, txRateMbps: 350, uptimeSeconds: 12800, downloadBytes: 310000000, uploadBytes: 45000000 },
          { mac: '94:b4:0f:7a:82:06', ip: '10.24.20.106', hostname: 'Packing-Scale-IoT', deviceType: 'iot', signalDbm: -62, wifiExperiencePct: 94, radio: '2.4GHz', channel: 6, rxRateMbps: 72, txRateMbps: 54, uptimeSeconds: 84000, downloadBytes: 45000000, uploadBytes: 12000000 },
        ],
      },
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
      unifiModel: 'U7 Pro XG',
      description: 'UniFi U7 Pro XG • Central Warehouse Racking Coverage',
      bay: 'Center Aisle',
      status: 'online',
      networkStats: {
        throughputRxMbps: 218.6,
        throughputTxMbps: 64.2,
        cpuUsagePct: 24,
        memoryUsagePct: 48,
        temperatureC: 49,
        uptime: '28d 14h 22m',
        mac: '68:d7:9a:12:44:02',
        gatewayIp: '10.24.20.1',
        firmwareVersion: '7.0.59',
        radios: [
          { band: '2.4GHz', channel: 1, channelWidth: 'HE20', utilizationPct: 32, txPowerDbm: 22 },
          { band: '5GHz', channel: 149, channelWidth: 'HE80', utilizationPct: 44, txPowerDbm: 26 },
          { band: '6GHz', channel: 37, channelWidth: 'HE160', utilizationPct: 18, txPowerDbm: 24 },
        ],
        clients: [
          { mac: 'ac:bc:32:4f:55:10', ip: '10.24.20.110', hostname: 'Zebra-TC57-Barcode-02', deviceType: 'scanner', signalDbm: -54, wifiExperiencePct: 98, radio: '5GHz', channel: 149, rxRateMbps: 300, txRateMbps: 270, uptimeSeconds: 24100, downloadBytes: 210000000, uploadBytes: 48000000 },
          { mac: 'ac:bc:32:4f:55:11', ip: '10.24.20.111', hostname: 'Zebra-TC57-Barcode-03', deviceType: 'scanner', signalDbm: -58, wifiExperiencePct: 96, radio: '5GHz', channel: 149, rxRateMbps: 240, txRateMbps: 200, uptimeSeconds: 21000, downloadBytes: 180000000, uploadBytes: 39000000 },
          { mac: 'f4:d4:88:1a:2b:12', ip: '10.24.20.112', hostname: 'Forklift-Tablet-02', deviceType: 'tablet', signalDbm: -51, wifiExperiencePct: 99, radio: '5GHz', channel: 149, rxRateMbps: 433, txRateMbps: 390, uptimeSeconds: 31200, downloadBytes: 540000000, uploadBytes: 98000000 },
          { mac: 'e8:80:2e:91:12:13', ip: '10.24.20.113', hostname: 'Warehouse-iPad-East', deviceType: 'tablet', signalDbm: -49, wifiExperiencePct: 100, radio: '6GHz', channel: 37, rxRateMbps: 1200, txRateMbps: 1100, uptimeSeconds: 41000, downloadBytes: 2100000000, uploadBytes: 320000000 },
          { mac: '70:cf:4f:81:92:14', ip: '10.24.20.114', hostname: 'Field-ThinkPad-L14', deviceType: 'laptop', signalDbm: -55, wifiExperiencePct: 97, radio: '6GHz', channel: 37, rxRateMbps: 960, txRateMbps: 840, uptimeSeconds: 15400, downloadBytes: 1420000000, uploadBytes: 410000000 },
          { mac: '94:b4:0f:7a:82:15', ip: '10.24.20.115', hostname: 'East-Scale-Telemetry', deviceType: 'iot', signalDbm: -64, wifiExperiencePct: 93, radio: '2.4GHz', channel: 1, rxRateMbps: 65, txRateMbps: 54, uptimeSeconds: 76000, downloadBytes: 38000000, uploadBytes: 9500000 },
        ],
      },
    },
  },
  {
    id: 'AP-03',
    type: 'network_superlink',
    name: 'SuperLink Gateway',
    position: [-1.1, 0.65, 1.65],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.10',
      linkSpeed: '1 Gbps IoT Gateway',
      connectedClients: 64,
      unifiModel: 'UniFi SuperLink',
      description: 'UniFi SuperLink • Protect Sub-GHz Long-Range Sensor Bridge',
      bay: 'Office Corner Wall',
      status: 'online',
      networkStats: {
        throughputRxMbps: 1.4,
        throughputTxMbps: 0.8,
        cpuUsagePct: 9,
        memoryUsagePct: 24,
        temperatureC: 38,
        uptime: '28d 14h 22m',
        mac: '68:d7:9a:70:00:01',
        superlinkFrequency: '915 MHz Sub-GHz',
        superlinkPairedNodes: 12,
        superlinkRssi: -48,
      },
    },
  },
  {
    id: 'SW-01',
    type: 'network_switch',
    name: 'Switch 16 Port PoE',
    position: [-2.8, -0.4, 1.4],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.2',
      linkSpeed: '1 Gbps / SFP Uplink',
      unifiModel: 'Switch 16 Port PoE',
      description: 'UniFi Switch 16 Port PoE • Powers APs, Cameras & CloudKey',
      bay: 'Server Rack',
      status: 'online',
      networkStats: {
        throughputRxMbps: 385.4,
        throughputTxMbps: 112.8,
        cpuUsagePct: 14,
        memoryUsagePct: 36,
        temperatureC: 44,
        uptime: '28d 14h 22m',
        mac: '68:d7:9a:16:00:01',
        gatewayIp: '10.24.20.1',
        firmwareVersion: '7.0.50',
        poeTotalWatts: 54.2,
        poeBudgetWatts: 180,
        ports: [
          { portNumber: 1, name: 'Port 1 (PoE+)', up: true, speed: '2.5 Gbps', poePowerWatts: 14.8, poeClass: 'PoE+', connectedDevice: 'U7 Pro (Office Corridor)', connectedType: 'ap' },
          { portNumber: 2, name: 'Port 2 (PoE++)', up: true, speed: '10 Gbps', poePowerWatts: 21.4, poeClass: 'PoE++', connectedDevice: 'U7 Pro XG (Center Racks)', connectedType: 'ap' },
          { portNumber: 3, name: 'Port 3 (PoE)', up: true, speed: '1 Gbps', poePowerWatts: 4.8, poeClass: 'PoE', connectedDevice: 'Shop Front (Cam 1)', connectedType: 'camera' },
          { portNumber: 4, name: 'Port 4 (PoE)', up: true, speed: '1 Gbps', poePowerWatts: 5.2, poeClass: 'PoE', connectedDevice: 'Shop Rear (Cam 2)', connectedType: 'camera' },
          { portNumber: 5, name: 'Port 5 (PoE)', up: true, speed: '1 Gbps', poePowerWatts: 4.6, poeClass: 'PoE', connectedDevice: 'Shop West (Cam 3)', connectedType: 'camera' },
          { portNumber: 6, name: 'Port 6 (PoE)', up: true, speed: '1 Gbps', poePowerWatts: 3.4, poeClass: 'PoE', connectedDevice: 'SuperLink Bridge', connectedType: 'cloudkey' },
          { portNumber: 7, name: 'Port 7 (PoE)', up: true, speed: '1 Gbps', poePowerWatts: 6.8, poeClass: 'PoE', connectedDevice: '4HG CloudKey+', connectedType: 'cloudkey' },
          { portNumber: 8, name: 'Port 8 (LAG 1)', up: true, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Synology NAS (Port 1)', connectedType: 'nas' },
          { portNumber: 9, name: 'Port 9 (LAG 2)', up: true, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Synology NAS (Port 2)', connectedType: 'nas' },
          { portNumber: 10, name: 'Port 10', up: true, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Shipping Bench PC', connectedType: 'workstation' },
          { portNumber: 11, name: 'Port 11', up: false, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Spare Port', connectedType: 'spare' },
          { portNumber: 12, name: 'Port 12', up: false, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Spare Port', connectedType: 'spare' },
          { portNumber: 13, name: 'Port 13', up: false, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Spare Port', connectedType: 'spare' },
          { portNumber: 14, name: 'Port 14', up: false, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Spare Port', connectedType: 'spare' },
          { portNumber: 15, name: 'Port 15', up: false, speed: '1 Gbps', poePowerWatts: 0, connectedDevice: 'Spare Port', connectedType: 'spare' },
          { portNumber: 16, name: 'Port 16', up: true, speed: '1 Gbps Uplink', poePowerWatts: 0, connectedDevice: 'Gateway Max (LAN 1)', connectedType: 'gateway' },
        ],
      },
    },
  },
  {
    id: 'GW-01',
    type: 'network_gateway',
    name: 'Gateway Max',
    position: [-2.8, -0.15, 1.4],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.1',
      linkSpeed: '2.5 Gbps Multi-WAN',
      unifiModel: 'Gateway Max',
      description: 'UniFi Gateway Max • Routing, Multi-WAN & DPI Threat Protection',
      bay: 'Server Rack',
      status: 'online',
      networkStats: {
        throughputRxMbps: 385.4,
        throughputTxMbps: 112.8,
        cpuUsagePct: 22,
        memoryUsagePct: 46,
        temperatureC: 48,
        uptime: '28d 14h 22m',
        mac: '68:d7:9a:10:00:01',
        firmwareVersion: '4.0.6',
        wanStatus: 'connected',
        wanIp: '74.125.18.24',
        wanLatencyMs: 8.4,
        ispName: 'Fiber 1 Gbps / 1 Gbps',
      },
    },
  },
  {
    id: 'UPS-01',
    type: 'network_ups',
    name: 'UPS Tower',
    position: [-2.8, -0.9, 1.4],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.5',
      linkSpeed: 'SmartPower Battery Bus',
      unifiModel: 'UPS Tower',
      description: 'UniFi SmartPower UPS Tower • Battery Backup for Critical Core',
      bay: 'Server Rack Base',
      status: 'online',
      networkStats: {
        throughputRxMbps: 0.1,
        throughputTxMbps: 0.1,
        cpuUsagePct: 5,
        memoryUsagePct: 18,
        temperatureC: 32,
        uptime: '84d 06h 11m',
        mac: '68:d7:9a:90:00:01',
        acPowerState: 'normal',
        batteryPct: 100,
        batteryRuntimeMin: 185,
        batteryLoadWatts: 142,
      },
    },
  },
  {
    id: 'UCK-01',
    type: 'network_cloudkey',
    name: '4HG CloudKey+',
    position: [-2.8, 0.05, 1.4],
    modelVariant: 'pin',
    metadata: {
      ip: '192.168.2.9',
      linkSpeed: '1 Gbps PoE',
      unifiModel: 'CloudKey+ Gen2',
      description: 'UniFi CloudKey+ Gen2 • Hosting UniFi Network & Protect Apps',
      bay: 'Server Rack Shelf',
      status: 'online',
      networkStats: {
        throughputRxMbps: 48.2,
        throughputTxMbps: 12.6,
        cpuUsagePct: 31,
        memoryUsagePct: 58,
        temperatureC: 45,
        uptime: '28d 14h 22m',
        mac: '68:d7:9a:80:00:01',
        storageUsedGb: 1340,
        storageTotalGb: 2000,
        appsRunning: [
          { name: 'UniFi Network', status: 'running', version: '8.5.6' },
          { name: 'UniFi Protect', status: 'running', version: '4.1.53' },
        ],
      },
    },
  },
  {
    id: 'NAS-01',
    type: 'network_nas',
    name: 'Synology NAS',
    position: [-2.8, -0.65, 1.4],
    modelVariant: 'pin',
    metadata: {
      ip: '10.24.20.50',
      linkSpeed: 'Dual 1 Gbps Link Aggregation',
      description: 'Synology DiskStation DS923+ • 4-Bay Storage Server (RAID-5)',
      bay: 'Server Rack Shelf',
      status: 'online',
      networkStats: {
        throughputRxMbps: 0,
        throughputTxMbps: 0,
      },
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

export const DEFAULT_MARKERS: FacilityMarker[] =
  Array.isArray((baselineWarehouseDefaults as any)?.markers) &&
  (baselineWarehouseDefaults as any).markers.length > 0
    ? ((baselineWarehouseDefaults as any).markers as FacilityMarker[])
    : STATIC_MARKERS;

const STATIC_MESH_OVERRIDES: MeshOverride[] = Array.from(
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

export const DEFAULT_MESH_OVERRIDES: MeshOverride[] =
  Array.isArray((baselineWarehouseDefaults as any)?.meshOverrides) &&
  (baselineWarehouseDefaults as any).meshOverrides.length > 0
    ? ((baselineWarehouseDefaults as any).meshOverrides as MeshOverride[])
    : STATIC_MESH_OVERRIDES;

const STATIC_CUTOUT_BOXES: CutoutBox[] = [
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

export const DEFAULT_CUTOUT_BOXES: CutoutBox[] =
  Array.isArray((baselineWarehouseDefaults as any)?.cutoutBoxes) &&
  (baselineWarehouseDefaults as any).cutoutBoxes.length > 0
    ? ((baselineWarehouseDefaults as any).cutoutBoxes as CutoutBox[])
    : STATIC_CUTOUT_BOXES;
