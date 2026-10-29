export type CardinalFacing = 'north' | 'east' | 'south' | 'west';

export interface CardinalMapping {
  mainDoorWall: 'North' | 'East' | 'South' | 'West'; // Wall at Z ≈ -8.8 (12' Main Roll-Up Door & Service Door)
  oppositeDoorWall: 'North' | 'East' | 'South' | 'West'; // Wall at Z ≈ +8.5 (10' Roll-Up Door & Office Entry Door)
  zoneARacksWall: 'North' | 'East' | 'South' | 'West'; // Wall at X ≈ +6.05 (Forklift Aisle & Zone B Wall, 90° CW from -Z)
  officeWall: 'North' | 'East' | 'South' | 'West'; // Wall at X ≈ -6.05 (Office & Utility Alcove Back Wall, 90° CCW from -Z)
  rotationDegrees: number; // For compass widget rotation
}

/**
 * Returns the cardinal directions for the 4 sides of the warehouse based on
 * which direction the Main Overhead Door wall (Z ≈ -8.8) faces.
 */
export function getCardinalMapping(facing: CardinalFacing): CardinalMapping {
  switch (facing) {
    case 'north':
      return {
        mainDoorWall: 'North',
        oppositeDoorWall: 'South',
        zoneARacksWall: 'East',
        officeWall: 'West',
        rotationDegrees: 0,
      };
    case 'east':
      return {
        mainDoorWall: 'East',
        oppositeDoorWall: 'West',
        zoneARacksWall: 'South',
        officeWall: 'North',
        rotationDegrees: 90,
      };
    case 'south':
      return {
        mainDoorWall: 'South',
        oppositeDoorWall: 'North',
        zoneARacksWall: 'West',
        officeWall: 'East',
        rotationDegrees: 180,
      };
    case 'west':
      return {
        mainDoorWall: 'West',
        oppositeDoorWall: 'East',
        zoneARacksWall: 'North',
        officeWall: 'South',
        rotationDegrees: 270,
      };
  }
}

/**
 * Dynamically re-labels doors, racks, endcaps, and walls to accurately reflect
 * the selected cardinal direction of the building.
 */
export function applyCardinalOrientation<
  T extends {
    id: string;
    name: string;
    position: [number, number, number];
    kind?: string;
  }
>(items: T[], facing: CardinalFacing): T[] {
  const mapping = getCardinalMapping(facing);

  return items.map((item) => {
    let newName = item.name;
    const [, , z] = item.position;

    // 1. Doors on the Main Doors Wall (Z <= -6.0)
    if (
      z <= -6.0 &&
      (item.kind === 'overhead_door' ||
        item.kind === 'service_door' ||
        item.id.includes('MAIN') ||
        item.id.includes('EAST'))
    ) {
      newName = newName
        .replace(
          /^(East|West|North|South)\s+Main\s+Overhead\s+Door/i,
          `${mapping.mainDoorWall} Main Overhead Door`
        )
        .replace(
          /^(East|West|North|South)\s+Service\s+Door/i,
          `${mapping.mainDoorWall} Service Door`
        );
    }

    // 2. Doors on the Opposite Wall (Z >= 6.0)
    if (
      z >= 6.0 &&
      (item.kind === 'overhead_door' ||
        item.kind === 'service_door' ||
        item.id.includes('WEST') ||
        item.id.includes('OPPOSITE'))
    ) {
      newName = newName
        .replace(
          /^(East|West|North|South)\s+Opposite\s+Overhead\s+Door/i,
          `${mapping.oppositeDoorWall} Opposite Overhead Door`
        )
        .replace(
          /^(East|West|North|South)\s+Office\s+\/\s+Corridor\s+Entry\s+Door/i,
          `${mapping.oppositeDoorWall} Office / Corridor Entry Door`
        );
    }

    // 3. Zone A Racks near Z = -8.75 wall (RACK-EAST-01..03)
    if (item.id.startsWith('RACK-EAST-')) {
      newName = newName
        .replace(
          /\((East|West|North|South)\s+Wall\)/i,
          `(${mapping.mainDoorWall} Wall)`
        )
        .replace(
          /\((East|West|North|South)\s+Aisle\)/i,
          `(${mapping.mainDoorWall} Aisle)`
        )
        .replace(
          /Row\s+(\d+)\s+(East|West|North|South)\s+Endcap/i,
          `Row $1 ${mapping.zoneARacksWall} Endcap`
        );
    }

    // 4. Back Wall Shelf on X = -5.51 (officeWall)
    if (item.id === 'RACK-NORTH-BACK') {
      newName = `${mapping.officeWall} Back Wall Shelf (Behind Row 2)`;
    }

    // 5. Bench on Z = +7.8 wall (oppositeDoorWall)
    if (item.id === 'BENCH-WEST-WALL') {
      newName = `${mapping.oppositeDoorWall} Entrance Wall Shelf`;
    }

    // 6. Office & Corridor items
    if (item.id === 'BENCH-OFFICE-EXT') {
      newName = `Office ${mapping.mainDoorWall} Partition Exterior Shelf`;
    }
    if (item.id === 'CART-HALL-01') {
      newName = `Office Corridor Utility Cart (${mapping.oppositeDoorWall})`;
    }
    if (item.id === 'DESK-OFFICE-02') {
      newName = `Office ${mapping.officeWall} Wall Desk`;
    }
    if (item.id === 'DESK-OFFICE-03') {
      newName = `Office ${mapping.mainDoorWall} Wall Workstation`;
    }

    if (newName !== item.name) {
      return { ...item, name: newName };
    }
    return item;
  });
}
