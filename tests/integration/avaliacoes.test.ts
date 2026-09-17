import "dotenv/config";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import { dojos, users, avaliacoes } from "@/db/schema";
import {
  criarOuAtualizarAvaliacao, excluirAvaliacao, listarAvaliacoes,
} from "@/db/queries/avaliacoes";
import { limparBanco } from "./_setup";

async function base() {
  const [d] = await db.insert(dojos).values({
    nome: "Dojo", latitude: "-23.5", longitude: "-46.6",
  }).returning();
  const [u1] = await db.insert(users).values({ nome: "U1", email: "u1@ex.com", senhaHash: "x" }).returning();
  const [u2] = await db.insert(users).values({ nome: "U2", email: "u2@ex.com", senhaHash: "x" }).returning();
  return { d, u1, u2 };
}

describe("avaliacoes", () => {
  beforeEach(limparBanco);

  it("cria e depois atualiza a mesma avaliação (1 por usuário/dojô)", async () => {
    const { d, u1 } = await base();
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 3, descricao: "ok" });
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 5, descricao: "melhorou" });
    const lista = await listarAvaliacoes(d.id);
    expect(lista).toHaveLength(1);
    expect(lista[0].nota).toBe(5);
  });

  it("permite avaliações de usuários diferentes no mesmo dojô", async () => {
    const { d, u1, u2 } = await base();
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 4 });
    await criarOuAtualizarAvaliacao(u2.id, { dojoId: d.id, nota: 2 });
    expect(await listarAvaliacoes(d.id)).toHaveLength(2);
  });

  it("só o dono exclui a própria avaliação", async () => {
    const { d, u1, u2 } = await base();
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 4 });
    const [a] = await listarAvaliacoes(d.id);
    const negado = await excluirAvaliacao(u2.id, a.id);
    expect(negado.ok).toBe(false);
    expect(await listarAvaliacoes(d.id)).toHaveLength(1);
    const ok = await excluirAvaliacao(u1.id, a.id);
    expect(ok.ok).toBe(true);
    expect(await listarAvaliacoes(d.id)).toHaveLength(0);
  });
});
