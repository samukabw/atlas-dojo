import { describe, it, expect } from "vitest";
import { haversineKm } from "@/lib/distancia";

describe("haversineKm", () => {
  it("retorna 0 para o mesmo ponto", () => {
    const p = { lat: -23.55, lng: -46.63 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });

  it("mede ~2,6 km entre dois pontos em São Paulo", () => {
    const a = { lat: -23.5505, lng: -46.6333 }; // Sé
    const b = { lat: -23.5617, lng: -46.6560 }; // Av. Paulista aprox.
    expect(haversineKm(a, b)).toBeGreaterThan(2);
    expect(haversineKm(a, b)).toBeLessThan(4);
  });

  it("é simétrica", () => {
    const a = { lat: -23.5, lng: -46.6 };
    const b = { lat: -22.9, lng: -43.2 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});
