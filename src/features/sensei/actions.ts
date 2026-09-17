"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { vincularPorPlace } from "@/db/queries/sensei";

/**
 * Sensei reivindica a responsabilidade por um dojô descoberto no mapa (Google).
 * Aprovação automática por ora: cria o vínculo na hora.
 */
export async function reivindicarDojoAction(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  if (!u?.id) return { ok: false, erro: "Faça login para reivindicar um dojô" };
  if (u.perfil !== "sensei" && u.perfil !== "admin") {
    return { ok: false, erro: "Apenas senseis podem reivindicar um dojô" };
  }

  const placeId = String(formData.get("placeId") ?? "");
  const nome = String(formData.get("nome") ?? "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const endereco = formData.get("endereco") ? String(formData.get("endereco")) : null;

  if (!placeId || !nome || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, erro: "Dados do lugar inválidos" };
  }

  await vincularPorPlace(u.id, { placeId, nome, latitude, longitude, endereco });
  revalidatePath(`/dojos/place/${placeId}`);
  revalidatePath("/meus-dojos");
  return { ok: true };
}
