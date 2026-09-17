import { describe, it, expect } from "vitest";
import { registroSchema, loginSchema, avaliacaoSchema } from "@/lib/validators";

describe("registroSchema", () => {
  it("aceita entrada válida", () => {
    const r = registroSchema.safeParse({
      nome: "Ana", email: "ana@ex.com", senha: "12345678", perfil: "comum",
    });
    expect(r.success).toBe(true);
  });
  it("rejeita e-mail inválido", () => {
    const r = registroSchema.safeParse({
      nome: "Ana", email: "nao-email", senha: "12345678", perfil: "comum",
    });
    expect(r.success).toBe(false);
  });
  it("rejeita senha curta", () => {
    const r = registroSchema.safeParse({
      nome: "Ana", email: "ana@ex.com", senha: "123", perfil: "comum",
    });
    expect(r.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita entrada válida", () => {
    expect(loginSchema.safeParse({ email: "a@ex.com", senha: "x" }).success).toBe(true);
  });
  it("rejeita e-mail inválido", () => {
    expect(loginSchema.safeParse({ email: "nao-email", senha: "x" }).success).toBe(false);
  });
});

describe("avaliacaoSchema", () => {
  it("aceita nota entre 1 e 5", () => {
    expect(avaliacaoSchema.safeParse({ dojoId: 1, nota: 5, descricao: "ótimo" }).success).toBe(true);
  });
  it("rejeita nota 0 e 6", () => {
    expect(avaliacaoSchema.safeParse({ dojoId: 1, nota: 0 }).success).toBe(false);
    expect(avaliacaoSchema.safeParse({ dojoId: 1, nota: 6 }).success).toBe(false);
  });
  it("coage strings numéricas para número", () => {
    const r = avaliacaoSchema.safeParse({ dojoId: "3", nota: "5", descricao: "ok" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dojoId).toBe(3);
      expect(r.data.nota).toBe(5);
    }
  });
  it("rejeita dojoId não numérico", () => {
    expect(avaliacaoSchema.safeParse({ dojoId: "abc", nota: "5" }).success).toBe(false);
  });
  it("rejeita nota string fora do intervalo", () => {
    expect(avaliacaoSchema.safeParse({ dojoId: "1", nota: "6" }).success).toBe(false);
  });
});
