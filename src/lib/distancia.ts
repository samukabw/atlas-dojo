import { sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Expressão SQL para distância em km entre a coluna (lat,lng) e um ponto.
export function haversineSqlKm(
  latCol: AnyColumn,
  lngCol: AnyColumn,
  lat: number,
  lng: number
): SQL<number> {
  return sql<number>`(
    ${R_KM} * 2 * asin( least(1, sqrt(
      power(sin(radians(${latCol}::double precision - ${lat}) / 2), 2) +
      cos(radians(${lat})) * cos(radians(${latCol}::double precision)) *
      power(sin(radians(${lngCol}::double precision - ${lng}) / 2), 2)
    )))
  )`;
}
