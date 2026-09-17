import { db } from "@/db";
import { avaliacoes, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { AvaliacaoInput } from "@/lib/validators";

export type AvaliacaoComAutor = {
  id: number; nota: number; descricao: string | null;
  usuarioId: number; autorNome: string; criadoEm: Date; atualizadoEm: Date;
};

export async function listarAvaliacoes(dojoId: number): Promise<AvaliacaoComAutor[]> {
  return db
    .select({
      id: avaliacoes.id, nota: avaliacoes.nota, descricao: avaliacoes.descricao,
      usuarioId: avaliacoes.usuarioId, autorNome: users.nome,
      criadoEm: avaliacoes.criadoEm, atualizadoEm: avaliacoes.atualizadoEm,
    })
    .from(avaliacoes)
    .innerJoin(users, eq(users.id, avaliacoes.usuarioId))
    .where(eq(avaliacoes.dojoId, dojoId))
    .orderBy(desc(avaliacoes.atualizadoEm));
}

export async function criarOuAtualizarAvaliacao(
  usuarioId: number, input: AvaliacaoInput
): Promise<{ ok: boolean; erro?: string }> {
  await db
    .insert(avaliacoes)
    .values({ usuarioId, dojoId: input.dojoId, nota: input.nota, descricao: input.descricao })
    .onConflictDoUpdate({
      target: [avaliacoes.usuarioId, avaliacoes.dojoId],
      set: { nota: input.nota, descricao: input.descricao, atualizadoEm: new Date() },
    });
  return { ok: true };
}

export async function excluirAvaliacao(
  usuarioId: number, avaliacaoId: number
): Promise<{ ok: boolean; erro?: string }> {
  const res = await db
    .delete(avaliacoes)
    .where(and(eq(avaliacoes.id, avaliacaoId), eq(avaliacoes.usuarioId, usuarioId)))
    .returning({ id: avaliacoes.id });
  if (res.length === 0) return { ok: false, erro: "Não autorizado ou inexistente" };
  return { ok: true };
}
