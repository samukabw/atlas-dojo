import "dotenv/config";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import { dojos, users, avaliacoes } from "@/db/schema";
import { buscarDojos } from "@/db/queries/dojos";
import { limparBanco } from "./_setup";

async function seedBasico() {
  const [d1] = await db.insert(dojos).values({
    nome: "Dojo Sé", cidade: "São Paulo", bairro: "Sé",
    latitude: "-23.5505", longitude: "-46.6333",
  }).returning();
  const [d2] = await db.insert(dojos).values({
    nome: "Dojo Rio", cidade: "Rio de Janeiro", bairro: "Centro",
    latitude: "-22.9068", longitude: "-43.1729",
  }).returning();
  return { d1, d2 };
}

describe("buscarDojos", () => {
  beforeEach(limparBanco);

  it("filtra por cidade", async () => {
    await seedBasico();
    const r = await buscarDojos({ cidade: "São Paulo" });
    expect(r).toHaveLength(1);
    expect(r[0].nome).toBe("Dojo Sé");
  });

  it("busca textual por nome/bairro", async () => {
    await seedBasico();
    const r = await buscarDojos({ q: "rio" });
    const nomes = r.map((d) => d.nome);
    expect(nomes).toContain("Dojo Rio");
    expect(nomes).not.toContain("Dojo Sé");
    expect(r).toHaveLength(1);
  });

  it("ordena por distância quando lat/lng são fornecidos", async () => {
    await seedBasico();
    const r = await buscarDojos({ lat: -23.55, lng: -46.63, ordenar: "distancia" });
    expect(r[0].nome).toBe("Dojo Sé");
    expect(r[0].distanciaKm).toBeLessThan(r[1].distanciaKm!);
  });

  it("calcula nota média e total", async () => {
    const { d1 } = await seedBasico();
    const [u] = await db.insert(users).values({
      nome: "U", email: "u@ex.com", senhaHash: "x",
    }).returning();
    await db.insert(avaliacoes).values({ usuarioId: u.id, dojoId: d1.id, nota: 4 });
    const r = await buscarDojos({ cidade: "São Paulo" });
    expect(r[0].notaMedia).toBeCloseTo(4, 1);
    expect(r[0].totalAvaliacoes).toBe(1);
  });

  it("dojo sem avaliações tem notaMedia 0 e total 0", async () => {
    await seedBasico();
    const r = await buscarDojos({ cidade: "São Paulo" });
    expect(r).toHaveLength(1);
    expect(r[0].notaMedia).toBe(0);
    expect(r[0].totalAvaliacoes).toBe(0);
    expect(Number.isNaN(r[0].notaMedia)).toBe(false);
  });

  it("ordena por nota (maior média primeiro)", async () => {
    const { d1, d2 } = await seedBasico();
    const [u1] = await db.insert(users).values({
      nome: "U1", email: "u1@ex.com", senhaHash: "x",
    }).returning();
    const [u2] = await db.insert(users).values({
      nome: "U2", email: "u2@ex.com", senhaHash: "x",
    }).returning();
    // d2 (Dojo Rio) melhor avaliado que d1 (Dojo Sé)
    await db.insert(avaliacoes).values({ usuarioId: u1.id, dojoId: d1.id, nota: 2 });
    await db.insert(avaliacoes).values({ usuarioId: u2.id, dojoId: d2.id, nota: 5 });
    const r = await buscarDojos({ ordenar: "nota" });
    expect(r[0].nome).toBe("Dojo Rio");
    expect(r[0].notaMedia).toBeGreaterThan(r[1].notaMedia);
  });
});
