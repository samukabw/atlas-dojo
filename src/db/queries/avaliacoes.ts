import { db } from "@/db";
import { avaliacoes, users, respostas } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { AvaliacaoInput } from "@/lib/validators";

export type AvaliacaoComAutor = {
  id: number; nota: number; descricao: string | null;
  usuarioId: number; autorNome: string; criadoEm: Date; atualizadoEm: Date;
  respostaTexto: string | null; respostaAutor: string | null;
};

const autorResposta = alias(users, "autor_resposta");

export async function listarAvaliacoes(dojoId: number): Promise<AvaliacaoComAutor[]> {
  return db
    .select({
      id: avaliacoes.id, nota: avaliacoes.nota, descricao: avaliacoes.descricao,
      usuarioId: avaliacoes.usuarioId, autorNome: users.nome,
      criadoEm: avaliacoes.criadoEm, atualizadoEm: avaliacoes.atualizadoEm,
      respostaTexto: respostas.texto, respostaAutor: autorResposta.nome,
    })
    .from(avaliacoes)
    .innerJoin(users, eq(users.id, avaliacoes.usuarioId))
    .leftJoin(respostas, eq(respostas.avaliacaoId, avaliacoes.id))
    .leftJoin(autorResposta, eq(autorResposta.id, respostas.usuarioId))
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
