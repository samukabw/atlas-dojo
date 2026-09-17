"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { avaliacaoSchema } from "@/lib/validators";
import { criarOuAtualizarAvaliacao, excluirAvaliacao } from "@/db/queries/avaliacoes";
import { obterOuCriarDojoPorPlace } from "@/db/queries/lugares";

export async function salvarAvaliacaoAction(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Faça login para avaliar" };

  const parsed = avaliacaoSchema.safeParse({
    dojoId: formData.get("dojoId"),
    nota: formData.get("nota"),
    descricao: formData.get("descricao") ?? undefined,
  });
  if (!parsed.success) return { ok: false, erro: "Dados inválidos" };

  const res = await criarOuAtualizarAvaliacao(usuarioId, parsed.data);
  if (res.ok) revalidatePath(`/dojos/${parsed.data.dojoId}`);
  return res;
}

/**
 * Avalia um lugar descoberto no mapa (Google Places). Cria/atualiza o registro
 * de dojô ligado ao place_id e então grava a avaliação (1 por usuário/lugar).
 */
export async function salvarAvaliacaoPlaceAction(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Faça login para avaliar" };

  const placeId = String(formData.get("placeId") ?? "");
  const nome = String(formData.get("nome") ?? "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const endereco = formData.get("endereco") ? String(formData.get("endereco")) : null;
  const nota = Number(formData.get("nota"));
  const descricao = formData.get("descricao") ? String(formData.get("descricao")) : undefined;

  if (!placeId || !nome || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, erro: "Dados do lugar inválidos" };
  }
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return { ok: false, erro: "Nota inválida" };
  }

  const dojoId = await obterOuCriarDojoPorPlace({ placeId, nome, latitude, longitude, endereco });
  const res = await criarOuAtualizarAvaliacao(usuarioId, { dojoId, nota, descricao });
  if (res.ok) revalidatePath(`/dojos/place/${placeId}`);
  return res;
}

export async function excluirAvaliacaoAction(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Não autenticado" };

  const avaliacaoId = Number(formData.get("avaliacaoId"));
  const dojoId = Number(formData.get("dojoId"));
  const res = await excluirAvaliacao(usuarioId, avaliacaoId);
  if (res.ok) revalidatePath(`/dojos/${dojoId}`);
  return res;
}
