"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { vincularPorPlace, cadastrarDojoNovo } from "@/db/queries/sensei";

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

/**
 * Sensei cadastra um dojô novo (fora do Google). Cria o dojô e o vínculo.
 * Retorna o id do dojô criado para redirecionamento.
 */
export async function cadastrarDojoAction(
  formData: FormData
): Promise<{ ok: boolean; dojoId?: number; erro?: string }> {
  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  if (!u?.id) return { ok: false, erro: "Faça login" };
  if (u.perfil !== "sensei" && u.perfil !== "admin") {
    return { ok: false, erro: "Apenas senseis podem cadastrar um dojô" };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const endereco = formData.get("endereco") ? String(formData.get("endereco")).trim() : null;
  const cidade = formData.get("cidade") ? String(formData.get("cidade")).trim() : null;
  const bairro = formData.get("bairro") ? String(formData.get("bairro")).trim() : null;
  const lat = Number(formData.get("latitude"));
  const lng = Number(formData.get("longitude"));

  if (nome.length < 2) return { ok: false, erro: "Informe o nome do dojô" };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, erro: "Escolha a localização do dojô no mapa" };
  }

  const dojoId = await cadastrarDojoNovo(u.id, { nome, endereco, cidade, bairro, lat, lng });
  revalidatePath("/meus-dojos");
  revalidatePath("/mapa");
  return { ok: true, dojoId };
}
