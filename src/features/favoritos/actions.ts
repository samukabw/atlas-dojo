"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  favoritarPorPlace,
  desfavoritarPorPlace,
  favoritarPorDojo,
  desfavoritarPorDojo,
} from "@/db/queries/favoritos";

/**
 * Alterna o favorito de um lugar do Google. `favoritar=1` adiciona (e cria o dojô
 * pelo place_id se necessário); qualquer outro valor remove.
 */
export async function alternarFavoritoAction(
  formData: FormData
): Promise<{ ok: boolean; favorito?: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Faça login para favoritar" };

  const placeId = String(formData.get("placeId") ?? "");
  if (!placeId) return { ok: false, erro: "Lugar inválido" };

  const favoritar = String(formData.get("favoritar") ?? "") === "1";

  if (favoritar) {
    const nome = String(formData.get("nome") ?? "");
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const endereco = formData.get("endereco") ? String(formData.get("endereco")) : null;
    if (!nome || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, erro: "Dados do lugar inválidos" };
    }
    await favoritarPorPlace(usuarioId, { placeId, nome, latitude, longitude, endereco });
  } else {
    await desfavoritarPorPlace(usuarioId, placeId);
  }

  revalidatePath("/favoritos");
  return { ok: true, favorito: favoritar };
}

/** Alterna o favorito de um dojô do banco (manual), identificado por dojoId. */
export async function alternarFavoritoDojoAction(
  formData: FormData
): Promise<{ ok: boolean; favorito?: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Faça login para favoritar" };

  const dojoId = Number(formData.get("dojoId"));
  if (!Number.isFinite(dojoId)) return { ok: false, erro: "Dojô inválido" };

  const favoritar = String(formData.get("favoritar") ?? "") === "1";
  if (favoritar) await favoritarPorDojo(usuarioId, dojoId);
  else await desfavoritarPorDojo(usuarioId, dojoId);

  revalidatePath(`/dojos/${dojoId}`);
  revalidatePath("/favoritos");
  return { ok: true, favorito: favoritar };
}
