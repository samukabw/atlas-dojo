import { db } from "@/db";
import { dojos } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cria (ou atualiza) o registro de dojô ligado a um lugar do Google Places.
 * Usado quando alguém avalia um lugar descoberto no mapa: a avaliação precisa
 * de um dojo.id, então garantimos que exista uma linha em `dojo` com o place_id.
 */
export async function obterOuCriarDojoPorPlace(p: {
  placeId: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco?: string | null;
}): Promise<number> {
  const [row] = await db
    .insert(dojos)
    .values({
      placeId: p.placeId,
      nome: p.nome,
      latitude: String(p.latitude),
      longitude: String(p.longitude),
      endereco: p.endereco ?? null,
    })
    .onConflictDoUpdate({
      target: dojos.placeId,
      set: {
        nome: p.nome,
        latitude: String(p.latitude),
        longitude: String(p.longitude),
        endereco: p.endereco ?? null,
      },
    })
    .returning({ id: dojos.id });
  return row.id;
}

/** Retorna o dojo.id ligado a um place_id, ou null se ninguém avaliou ainda. */
export async function obterDojoIdPorPlace(placeId: string): Promise<number | null> {
  const [d] = await db.select({ id: dojos.id }).from(dojos).where(eq(dojos.placeId, placeId));
  return d?.id ?? null;
}
