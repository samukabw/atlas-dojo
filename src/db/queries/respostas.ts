import { db } from "@/db";
import { respostas, avaliacoes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ehResponsavelPorDojo } from "./sensei";

/**
 * Sensei responde uma avaliação. Só é permitido se ele for responsável pelo
 * dojô da avaliação. Uma resposta por avaliação (upsert).
 */
export async function responderAvaliacao(
  usuarioId: number,
  avaliacaoId: number,
  texto: string
): Promise<{ ok: boolean; erro?: string }> {
  const [a] = await db
    .select({ dojoId: avaliacoes.dojoId })
    .from(avaliacoes)
    .where(eq(avaliacoes.id, avaliacaoId));
  if (!a) return { ok: false, erro: "Avaliação não encontrada" };

  const resp = await ehResponsavelPorDojo(usuarioId, a.dojoId);
  if (!resp) return { ok: false, erro: "Você não é responsável por este dojô" };

  await db
    .insert(respostas)
    .values({ avaliacaoId, usuarioId, texto })
    .onConflictDoUpdate({
      target: respostas.avaliacaoId,
      set: { texto, usuarioId, atualizadoEm: new Date() },
    });
  return { ok: true };
}

/** Remove a resposta (apenas quem a escreveu). */
export async function excluirResposta(
  usuarioId: number,
  avaliacaoId: number
): Promise<{ ok: boolean; erro?: string }> {
  const res = await db
    .delete(respostas)
    .where(and(eq(respostas.avaliacaoId, avaliacaoId), eq(respostas.usuarioId, usuarioId)))
    .returning({ id: respostas.id });
  return res.length ? { ok: true } : { ok: false, erro: "Não autorizado" };
}
