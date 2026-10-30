const METERS_PER_INCH = 0.0254;
const INCHES_PER_METER = 39.37007874;
const FEET_PER_METER = 3.280839895;

export function metersToInches(m: number): number {
  return Math.round(m * INCHES_PER_METER * 10) / 10;
}

export function inchesToMeters(inches: number): number {
  return Number((inches * METERS_PER_INCH).toFixed(4));
}

export function metersToFeetDecimal(m: number): number {
  return Number((m * FEET_PER_METER).toFixed(2));
}

export function feetDecimalToMeters(ft: number): number {
  return Number((ft / FEET_PER_METER).toFixed(4));
}

/**
 * Formats a metric value in meters as `X' Y"` (feet and inches)
 */
export function formatFeetInches(m: number): string {
  const sign = m < 0 ? '-' : '';
  const totalInches = Math.round(Math.abs(m) * INCHES_PER_METER);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  if (feet === 0) return `${sign}${inches}"`;
  if (inches === 0) return `${sign}${feet}'`;
  return `${sign}${feet}' ${inches}"`;
}

/**
 * Splits a metric value in meters into `{ feet, inches }`
 */
export function metersToFeetAndInches(m: number): {
  feet: number;
  inches: number;
} {
  const totalInches = Math.round(Math.abs(m) * INCHES_PER_METER);
  const sign = m < 0 ? -1 : 1;
  const feet = Math.floor(totalInches / 12) * sign;
  const inches = totalInches % 12;
  return { feet, inches };
}

export function feetAndInchesToMeters(feet: number, inches: number): number {
  const sign = feet < 0 ? -1 : 1;
  const totalInches = Math.abs(feet) * 12 + Math.abs(inches);
  return Number((sign * totalInches * METERS_PER_INCH).toFixed(4));
}
