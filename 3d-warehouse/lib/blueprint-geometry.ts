export type BlueprintItemKind =
  | 'perimeter_wall'
  | 'interior_wall'
  | 'alcove_wall'
  | 'overhead_door'
  | 'service_door'
  | 'rack'
  | 'workbench'
  | 'work_station_rack'
  | 'forklift'
  | 'desk'
  | 'computer'
  | 'printer'
  | 'chair'
  | 'tote_bin';

export interface OdooProductQuant {
  id: number;
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  reservedQuantity?: number;
  lot?: string;
  locationId?: number;
  locationName?: string;
  shortCode?: string;
  barcode?: string;
  aliases?: string[];
}

export interface ShelfLocationAssignment {
  row: number; // 1-based depth row
  bay: number; // 1-based horizontal rack bay
  level: number; // 1-based vertical shelf tier (1 = bottom shelf)
  locationCode: string; // e.g. "A-01-01-01" or full "WH/Stock/A-01-01-01"
  shortCode?: string; // e.g. "A-01-01-01"
  odooLocationId?: string; // e.g. "142" or external XML ID
  notes?: string;
  products?: OdooProductQuant[]; // Synced inventory products from Odoo
  totalQuantity?: number;
}

export interface BlueprintItem {
  id: string;
  name: string;
  kind: BlueprintItemKind;
  position: [number, number, number]; // [x, y, z] center in Three.js coordinates
  size: [number, number, number]; // [width X, height Y, length Z] in meters
  rotationY?: number; // Rotation around Y-axis in radians
  bays?: number; // Number of horizontal rack bays (columns)
  levels?: number; // Number of vertical shelf tiers (shelves)
  rows?: number; // Number of depth rows (1 = single-deep, 2 = back-to-back double-deep, etc.)
  showBoxes?: boolean; // Whether to show boxes/bins on the shelf tiers
  isOpen?: boolean; // For overhead_door and service_door: whether the door is open
  doorColor?: string; // Optional custom door panel color
  zone?: string; // Warehouse Zone code: "A", "B", "C", etc.
  rowNumber?: number | string; // Warehouse Row index: 1 -> "01", 2 -> "02"
  rackNumber?: number | string; // Rack index (alias to rowNumber)
  locationPrefix?: string; // e.g. "A-01" or "WH/Stock/A-01"
  odooWarehouseCode?: string; // e.g. "WH/Stock"
  isNonInventory?: boolean; // When true, shelf is general storage with no Odoo stock location
  shelfLocations?: Record<string, ShelfLocationAssignment>; // Keyed by "R{row}-B{bay}-L{level}"
  visible: boolean;
}

/**
 * Builds the standard warehouse shelf location short code:
 * Format: Zone - Row - Rack - Shelf
 * E.g. Zone "A", Row 2, Rack 1, Shelf 1 -> "A-02-01-01"
 */
export function buildOdooShortCode(
  zone: string,
  row: number | string,
  rack: number | string,
  shelf: number | string
): string {
  const z = (zone || 'A').trim().toUpperCase();
  const ro = String(row).padStart(2, '0');
  const ra = String(rack).padStart(2, '0');
  const sh = String(shelf).padStart(2, '0');
  return `${z}-${ro}-${ra}-${sh}`;
}

export function parseSlotKey(key: string): { row: number; bay: number; level: number } {
  const match = key.match(/R(\d+)-B(\d+)-L(\d+)/i);
  if (match) {
    return {
      row: parseInt(match[1], 10),
      bay: parseInt(match[2], 10),
      level: parseInt(match[3], 10),
    };
  }
  return { row: 1, bay: 1, level: 1 };
}

/**
 * Derives or extracts Zone ("A", "B", "C") and 2-digit Row Number ("01", "02")
 * from an item's explicit fields, locationPrefix, or name/id.
 */
export function deriveZoneAndRack(item: Partial<BlueprintItem>): {
  zone: string;
  rowNumber: string;
  rackNumber: string;
} {
  const num = item.rowNumber || item.rackNumber;
  if (item.zone && num) {
    const formatted = String(num).padStart(2, '0');
    return {
      zone: item.zone.trim().toUpperCase(),
      rowNumber: formatted,
      rackNumber: formatted,
    };
  }

  // Try parsing from locationPrefix (e.g. "A-01", "WH/Stock/A1", "WH/Stock/A-02")
  if (item.locationPrefix) {
    const match = item.locationPrefix.match(/([A-Z])[-/]?(\d+)/i);
    if (match) {
      const r = match[2].padStart(2, '0');
      return {
        zone: match[1].toUpperCase(),
        rowNumber: r,
        rackNumber: r,
      };
    }
  }

  // Try parsing from item id or name (e.g. "RACK-EAST-01", "East Aisle Rack Row 2")
  const text = `${item.id || ''} ${item.name || ''}`;
  if (/EAST[-_ ]*0?1|ROW[-_ ]*1/i.test(text)) return { zone: 'A', rowNumber: '01', rackNumber: '01' };
  if (/EAST[-_ ]*0?2|ROW[-_ ]*2/i.test(text)) return { zone: 'A', rowNumber: '02', rackNumber: '02' };
  if (/EAST[-_ ]*0?3|ROW[-_ ]*3/i.test(text)) return { zone: 'A', rowNumber: '03', rackNumber: '03' };
  if (/EAST[-_ ]*0?4|ROW[-_ ]*4/i.test(text)) return { zone: 'A', rowNumber: '04', rackNumber: '04' };
  if (/ISLAND/i.test(text)) return { zone: 'B', rowNumber: '01', rackNumber: '01' };
  if (/SW.*VERTICAL|SW.*LONG/i.test(text)) return { zone: 'B', rowNumber: '02', rackNumber: '02' };
  if (/SW.*HORIZONTAL|SW.*FRONT/i.test(text)) return { zone: 'B', rowNumber: '03', rackNumber: '03' };
  if (/WEST/i.test(text)) return { zone: 'C', rowNumber: '01', rackNumber: '01' };

  return { zone: 'A', rowNumber: '01', rackNumber: '01' };
}

/**
 * Auto-generates all slot locations for a rack based on the standard Zone-Row-Rack-Shelf format.
 * When a rack is split into rows (e.g. rows=2), the first row is baseRow (e.g. 01)
 * and the next row is baseRow + 1 (e.g. 02) -> "A-02-01-01".
 */
export function generateAllShelfLocations(
  zone: string,
  baseRow: number | string,
  bays: number,
  levels: number,
  rows: number = 1,
  existingLocations?: Record<string, ShelfLocationAssignment>
): Record<string, ShelfLocationAssignment> {
  const next: Record<string, ShelfLocationAssignment> = { ...existingLocations };
  const z = (zone || 'A').trim().toUpperCase();
  const startRowInt = parseInt(String(baseRow), 10) || 1;

  for (let rIdx = 1; rIdx <= rows; rIdx++) {
    const currentRow = startRowInt + (rIdx - 1);
    for (let bIdx = 1; bIdx <= bays; bIdx++) {
      for (let lIdx = 1; lIdx <= levels; lIdx++) {
        const slotKey = `R${rIdx}-B${bIdx}-L${lIdx}`;
        const shortCode = buildOdooShortCode(
          z,
          currentRow,
          bIdx,
          lIdx
        );

        next[slotKey] = {
          row: rIdx,
          bay: bIdx,
          level: lIdx,
          shortCode: shortCode,
          locationCode: shortCode,
          odooLocationId: next[slotKey]?.odooLocationId || '',
          notes: next[slotKey]?.notes || '',
        };
      }
    }
  }
  return next;
}

/**
 * Millimeter-verified shelving, rack, and desk footprints measured directly from
 * the 379,000-vertex point cloud of `4HG Shop.glb` and matched 1:1 with the UniFi 3D layout.
 *
 * Note: All structural walls (Outer Perimeter, Enclosed Office Room, and Tan Utility Alcoves)
 * are rendered as unified, seamless extruded meshes in `WarehouseModel.tsx` so there are zero
 * corner or segment seams.
 */
export const DEFAULT_BLUEPRINT_ITEMS: BlueprintItem[] = [
  // ===========================================================================
  // 1. FOUR PARALLEL EAST RACKS (Zone A • Racks 01-04)
  // ===========================================================================
  {
    id: 'RACK-EAST-01',
    name: 'Zone A - Rack 01 (East Wall)',
    kind: 'rack',
    // Scan bounds: X=[-5.48, 0.25], Z=[-8.48, -7.23], Height=2.21m
    position: [-2.61, -0.45, -7.85],
    size: [5.73, 2.2, 1.26],
    bays: 3,
    levels: 3,
    zone: 'A',
    rackNumber: '01',
    locationPrefix: 'A-01',
    shelfLocations: generateAllShelfLocations('A', '01', 3, 3, 1),
    visible: true,
  },
  {
    id: 'RACK-EAST-01-ENDCAP',
    name: 'Row 1 South Endcap Shelf',
    kind: 'workbench',
    position: [0.58, -0.65, -7.85],
    size: [0.6, 1.8, 1.05],
    bays: 1,
    levels: 4,
    zone: 'A',
    rackNumber: '01',
    locationPrefix: 'A-01-EC',
    visible: true,
  },
  {
    id: 'RACK-EAST-02',
    name: 'Zone A - Rack 02 (East Aisle)',
    kind: 'rack',
    // Scan bounds: X=[-4.39, 0.21], Z=[-5.95, -5.01], Height=2.21m
    position: [-2.09, -0.45, -5.48],
    size: [4.6, 2.2, 0.94],
    bays: 3,
    levels: 3,
    zone: 'A',
    rackNumber: '02',
    locationPrefix: 'A-02',
    shelfLocations: generateAllShelfLocations('A', '02', 3, 3, 1),
    visible: true,
  },
  {
    id: 'RACK-EAST-02-ENDCAP',
    name: 'Row 2 South Endcap Wire Shelf',
    kind: 'workbench',
    position: [0.52, -0.65, -5.48],
    size: [0.58, 1.8, 0.85],
    bays: 1,
    levels: 4,
    zone: 'A',
    rackNumber: '02',
    locationPrefix: 'A-02-EC',
    visible: true,
  },
  {
    id: 'RACK-EAST-03',
    name: 'Zone A - Rack 03 (East Aisle)',
    kind: 'rack',
    // Scan bounds: X=[-3.34, 0.34], Z=[-4.03, -3.11], Height=2.20m
    position: [-1.5, -0.45, -3.57],
    size: [3.68, 2.2, 0.92],
    bays: 3,
    levels: 3,
    zone: 'A',
    rackNumber: '03',
    locationPrefix: 'A-03',
    shelfLocations: generateAllShelfLocations('A', '03', 3, 3, 1),
    visible: true,
  },
  {
    id: 'RACK-EAST-03-ENDCAP',
    name: 'Row 3 South Endcap Wire Shelf',
    kind: 'workbench',
    position: [0.65, -0.65, -3.57],
    size: [0.58, 1.8, 0.85],
    bays: 1,
    levels: 4,
    zone: 'A',
    rackNumber: '03',
    locationPrefix: 'A-03-EC',
    visible: true,
  },
  {
    id: 'RACK-EAST-04',
    name: 'Zone A - Rack 04 (Center Alcove)',
    kind: 'rack',
    // Scan bounds: X=[-2.70, -0.18], Z=[-1.67, -0.68], Height=2.36m
    position: [-1.44, -0.4, -1.17],
    size: [2.52, 2.3, 0.99],
    bays: 2,
    levels: 3,
    zone: 'A',
    rackNumber: '04',
    locationPrefix: 'A-04',
    shelfLocations: generateAllShelfLocations('A', '04', 2, 3, 1),
    visible: true,
  },
  {
    id: 'RACK-NORTH-BACK',
    name: 'North Back Wall Shelf (Behind Row 2)',
    kind: 'workbench',
    // Scan bounds: X=[-5.77, -5.24], Z=[-6.45, -4.55]
    position: [-5.51, -0.5, -5.5],
    size: [0.55, 2.1, 1.9],
    bays: 2,
    levels: 4,
    zone: 'A',
    rackNumber: '05',
    locationPrefix: 'A-05',
    visible: true,
  },

  // ===========================================================================
  // 2. CENTER ISLAND & SOUTH-WEST L-RACK SYSTEM (Zone B • Racks 01-03)
  // ===========================================================================
  {
    id: 'RACK-ISLAND-CENTER',
    name: 'Zone B - Rack 01 (Center Island)',
    kind: 'rack',
    // Scan bounds: X=[2.00, 4.85], Z=[-0.66, 1.37], Height=2.28m
    position: [3.42, -0.41, 0.35],
    size: [2.85, 2.28, 2.03],
    bays: 2,
    levels: 3,
    rows: 2,
    zone: 'B',
    rackNumber: '01',
    locationPrefix: 'B-01',
    shelfLocations: generateAllShelfLocations('B', '01', 2, 3, 2),
    visible: true,
  },
  {
    id: 'RACK-SW-VERTICAL-LEG',
    name: 'Zone B - Rack 02 (SW Long Leg)',
    kind: 'rack',
    // Scan bounds: X=[1.99, 5.10], Z=[2.64, 3.74], Height=2.30m
    position: [3.55, -0.4, 3.19],
    size: [3.11, 2.3, 1.1],
    bays: 2,
    levels: 3,
    zone: 'B',
    rackNumber: '02',
    locationPrefix: 'B-02',
    shelfLocations: generateAllShelfLocations('B', '02', 2, 3, 1),
    visible: true,
  },
  {
    id: 'RACK-SW-ENDCAP',
    name: 'South-West L-Rack North Endcap Shelf',
    kind: 'workbench',
    // Scan bounds: X=[1.50, 2.00], Z=[2.65, 3.69]
    position: [1.68, -0.6, 3.19],
    size: [0.58, 1.9, 0.92],
    bays: 1,
    levels: 4,
    zone: 'B',
    rackNumber: '02',
    locationPrefix: 'B-02-EC',
    visible: true,
  },
  {
    id: 'RACK-SW-HORIZONTAL',
    name: 'Zone B - Rack 03 (SW Front Leg)',
    kind: 'rack',
    // Scan bounds: X=[3.82, 5.05], Z=[3.73, 7.43], Height=2.25m
    position: [4.44, -0.42, 5.58],
    size: [1.23, 2.25, 3.7],
    bays: 3,
    levels: 3,
    zone: 'B',
    rackNumber: '03',
    locationPrefix: 'B-03',
    shelfLocations: generateAllShelfLocations('B', '03', 3, 3, 1),
    visible: true,
  },

  // ===========================================================================
  // 3. PERIMETER & CORRIDOR SECONDARY SHELVES / CARTS (Verified Scan Bounds)
  // ===========================================================================
  {
    id: 'BENCH-WEST-WALL',
    name: 'West Entrance Wall Shelf',
    kind: 'workbench',
    // Scan bounds: X=[-0.76, 1.07], Z=[7.31, 8.28]
    position: [0.16, -0.5, 7.8],
    size: [1.83, 2.1, 0.78],
    bays: 2,
    levels: 4,
    visible: true,
  },
  {
    id: 'BENCH-OFFICE-EXT',
    name: 'Office East Partition Exterior Shelf',
    kind: 'workbench',
    // Scan bounds: X=[-3.85, -1.22], Z=[0.35, 0.77]
    position: [-2.53, -0.5, 0.56],
    size: [2.63, 2.1, 0.52],
    bays: 2,
    levels: 4,
    visible: true,
  },
  {
    id: 'CART-HALL-01',
    name: 'Office Corridor Utility Cart (West)',
    kind: 'desk',
    // Scan bounds: X=[-1.00, 0.07], Z=[5.07, 6.41]
    position: [-0.46, -1.1, 5.74],
    size: [0.85, 0.9, 0.95],
    visible: true,
  },
  {
    id: 'CART-HALL-02',
    name: 'Office Corridor Cabinet (Center)',
    kind: 'workbench',
    // Scan bounds: X=[-0.99, -0.01], Z=[3.53, 4.76]
    position: [-0.5, -0.8, 4.14],
    size: [0.8, 1.5, 0.95],
    bays: 1,
    levels: 3,
    visible: true,
  },

  // ===========================================================================
  // 4. ENCLOSED OFFICE ROOM & UTILITY ALCOVE DESKS (Verified Scan Bounds)
  // ===========================================================================
  {
    id: 'DESK-OFFICE-01',
    name: 'Office Main Conference / Work Table',
    kind: 'desk',
    // Scan bounds: X=[-4.56, -3.36], Z=[4.93, 7.46]
    position: [-3.96, -1.15, 6.19],
    size: [1.1, 0.8, 2.45],
    visible: true,
  },
  {
    id: 'DESK-OFFICE-02',
    name: 'Office North Wall Desk',
    kind: 'desk',
    // Scan bounds: X=[-5.77, -4.52], Z=[4.14, 6.27]
    position: [-5.14, -1.15, 5.2],
    size: [0.95, 0.8, 1.95],
    visible: true,
  },
  {
    id: 'DESK-OFFICE-03',
    name: 'Office East Wall Workstation',
    kind: 'desk',
    // Scan bounds: X=[-4.75, -1.95], Z=[1.13, 1.93]
    position: [-3.35, -1.15, 1.53],
    size: [2.6, 0.8, 0.8],
    visible: true,
  },
  {
    id: 'DESK-NOOK-TABLE',
    name: 'Tan Utility Alcove Workbench',
    kind: 'desk',
    // Scan bounds: X=[-5.79, -4.33], Z=[-3.02, -0.79]
    position: [-5.15, -1.1, -1.9],
    size: [0.85, 0.9, 1.85],
    visible: true,
  },
  // ===========================================================================
  // 5. COMPUTERS, CHAIRS & WORKSTATION ACCESSORIES (Editable & Draggable)
  // ===========================================================================
  {
    id: 'PC-OFFICE-01',
    name: 'Dual-Monitor Workstation PC #1',
    kind: 'computer',
    position: [-3.96, -0.58, 6.2],
    size: [0.45, 0.42, 0.75],
    rotationY: Math.PI / 2,
    visible: true,
  },
  {
    id: 'PC-OFFICE-02',
    name: 'North Desk iMac / Monitor',
    kind: 'computer',
    position: [-5.14, -0.58, 5.2],
    size: [0.4, 0.42, 0.65],
    rotationY: 0,
    visible: true,
  },
  {
    id: 'PC-OFFICE-03',
    name: 'East Desk Terminal & Scanner',
    kind: 'computer',
    position: [-3.35, -0.58, 1.53],
    size: [0.65, 0.42, 0.4],
    rotationY: 0,
    visible: true,
  },
  {
    id: 'PRINTER-NOOK-01',
    name: 'Zebra Thermal Label Printer (Alcove)',
    kind: 'printer',
    position: [-5.15, -0.48, -1.9],
    size: [0.45, 0.35, 0.45],
    rotationY: 0,
    visible: true,
  },
  {
    id: 'CHAIR-OFFICE-01',
    name: 'Ergonomic Task Chair #1',
    kind: 'chair',
    position: [-3.2, -1.1, 6.2],
    size: [0.6, 0.9, 0.6],
    rotationY: -Math.PI / 2,
    visible: true,
  },
  {
    id: 'CHAIR-OFFICE-02',
    name: 'Ergonomic Task Chair #2',
    kind: 'chair',
    position: [-4.35, -1.1, 5.2],
    size: [0.6, 0.9, 0.6],
    rotationY: Math.PI,
    visible: true,
  },
  {
    id: 'CHAIR-OFFICE-03',
    name: 'Ergonomic Task Chair #3',
    kind: 'chair',
    position: [-3.35, -1.1, 2.25],
    size: [0.6, 0.9, 0.6],
    rotationY: 0,
    visible: true,
  },
  // ===========================================================================
  // 6. FORKLIFT (Measured directly from 4HG Shop.glb Scan at [2.93, -3.86]: 44" W × 86" H × 100" L)
  // ===========================================================================
  {
    id: 'FORKLIFT-01',
    name: 'Warehouse Counterbalance Forklift',
    kind: 'forklift',
    // Exact scan bounds: X=[2.37, 3.49] (1.12m / 44"), Z=[-5.14, -2.58] (2.55m / 8'4"), Height=2.18m (7'2")
    position: [2.93, -0.46, -3.86],
    size: [1.12, 2.18, 2.55],
    rotationY: 0,
    visible: true,
  },
  // ===========================================================================
  // 7. MOVABLE & DELETABLE OVERHEAD DOORS & SERVICE DOORS (Real Cutout Openings in Walls)
  // ===========================================================================
  {
    id: 'DOOR-OVERHEAD-EAST',
    name: 'East Main Overhead Door (12\' × 7\')',
    kind: 'overhead_door',
    position: [3.2, -0.48, -8.75],
    size: [3.65, 2.15, 0.28],
    rotationY: 0,
    isOpen: false,
    visible: true,
  },
  {
    id: 'DOOR-SERVICE-EAST',
    name: 'East Service Door (3\' × 6\'8")',
    kind: 'service_door',
    position: [0.8, -0.52, -8.75],
    size: [0.95, 2.05, 0.28],
    rotationY: 0,
    isOpen: false,
    doorColor: '#9ca3af',
    visible: true,
  },
  {
    id: 'DOOR-OVERHEAD-WEST',
    name: 'West Opposite Overhead Door (10\' × 7\')',
    kind: 'overhead_door',
    position: [2.45, -0.48, 8.45],
    size: [3.05, 2.15, 0.28],
    rotationY: Math.PI,
    isOpen: false,
    visible: true,
  },
  {
    id: 'DOOR-OFFICE-INTERIOR',
    name: 'Office Interior Entry Door (3\'8" × 6\'8")',
    kind: 'service_door',
    position: [-1.18, -0.52, 2.95],
    size: [1.12, 2.05, 0.26],
    rotationY: Math.PI / 2,
    isOpen: false,
    doorColor: '#b5a397',
    visible: true,
  },
  {
    id: 'DOOR-OFFICE-WEST',
    name: 'West Office / Corridor Entry Door (3\' × 6\'8")',
    kind: 'service_door',
    position: [-0.25, -0.52, 8.45],
    size: [0.95, 2.05, 0.28],
    rotationY: Math.PI,
    isOpen: false,
    doorColor: '#9ca3af',
    visible: true,
  },
];
