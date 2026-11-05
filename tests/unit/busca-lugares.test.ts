import { describe, it, expect } from "vitest";
import { termosDeBusca, unirPorId, TERMOS_PADRAO } from "@/lib/busca-lugares";

describe("termosDeBusca", () => {
  it("usa todos os termos padrão quando a busca está em branco", () => {
    expect(termosDeBusca("")).toEqual(TERMOS_PADRAO);
    expect(termosDeBusca("   ")).toEqual(TERMOS_PADRAO);
    expect(TERMOS_PADRAO.length).toBeGreaterThan(1);
  });

  it("usa só o texto digitado, sem espaços nas pontas", () => {
    expect(termosDeBusca("  Dojo Sé ")).toEqual(["Dojo Sé"]);
  });
});

describe("unirPorId", () => {
  it("junta as listas sem repetir lugares", () => {
    const a = { id: "a", nome: "A" };
    const b = { id: "b", nome: "B" };
    const c = { id: "c", nome: "C" };
    expect(unirPorId([[a, b], [b, c], []])).toEqual([a, b, c]);
  });
});
