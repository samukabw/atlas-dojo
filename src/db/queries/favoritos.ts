import { db } from "@/db";
import { favoritos, dojos, avaliacoes } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { obterOuCriarDojoPorPlace } from "./lugares";

/** O usuário já favoritou este lugar do Google? */
export async function ehFavoritoPorPlace(usuarioId: number, placeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: favoritos.id })
    .from(favoritos)
    .innerJoin(dojos, eq(dojos.id, favoritos.dojoId))
    .where(and(eq(favoritos.usuarioId, usuarioId), eq(dojos.placeId, placeId)));
  return Boolean(row);
}

/** Favorita um lugar: garante o registro do dojô (pelo place_id) e insere o favorito. */
export async function favoritarPorPlace(
  usuarioId: number,
  p: { placeId: string; nome: string; latitude: number; longitude: number; endereco?: string | null }
): Promise<void> {
  const dojoId = await obterOuCriarDojoPorPlace(p);
  await db
    .insert(favoritos)
    .values({ usuarioId, dojoId })
    .onConflictDoNothing({ target: [favoritos.usuarioId, favoritos.dojoId] });
}

/** Remove o favorito daquele lugar (se existir). */
export async function desfavoritarPorPlace(usuarioId: number, placeId: string): Promise<void> {
  const [d] = await db.select({ id: dojos.id }).from(dojos).where(eq(dojos.placeId, placeId));
  if (!d) return;
  await db
    .delete(favoritos)
    .where(and(eq(favoritos.usuarioId, usuarioId), eq(favoritos.dojoId, d.id)));
}

/* --- Versões por dojoId (dojôs manuais, sem place_id) --- */

export async function ehFavoritoPorDojo(usuarioId: number, dojoId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: favoritos.id })
    .from(favoritos)
    .where(and(eq(favoritos.usuarioId, usuarioId), eq(favoritos.dojoId, dojoId)));
  return Boolean(row);
}

export async function favoritarPorDojo(usuarioId: number, dojoId: number): Promise<void> {
  await db
    .insert(favoritos)
    .values({ usuarioId, dojoId })
    .onConflictDoNothing({ target: [favoritos.usuarioId, favoritos.dojoId] });
}

export async function desfavoritarPorDojo(usuarioId: number, dojoId: number): Promise<void> {
  await db
    .delete(favoritos)
    .where(and(eq(favoritos.usuarioId, usuarioId), eq(favoritos.dojoId, dojoId)));
}

export type FavoritoResumo = {
  placeId: string | null;
  dojoId: number;
  nome: string;
  endereco: string | null;
  latitude: number;
  longitude: number;
  notaMedia: number;
  totalAvaliacoes: number;
};

/** Lista os dojôs favoritados pelo usuário, com a nota média da comunidade. */
export async function listarFavoritos(usuarioId: number): Promise<FavoritoResumo[]> {
  const rows = await db
    .select({
      placeId: dojos.placeId,
      dojoId: dojos.id,
      nome: dojos.nome,
      endereco: dojos.endereco,
      latitude: sql<number>`${dojos.latitude}::double precision`,
      longitude: sql<number>`${dojos.longitude}::double precision`,
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
    })
    .from(favoritos)
    .innerJoin(dojos, eq(dojos.id, favoritos.dojoId))
    .leftJoin(avaliacoes, eq(avaliacoes.dojoId, dojos.id))
    .where(eq(favoritos.usuarioId, usuarioId))
    .groupBy(dojos.id, favoritos.criadoEm)
    .orderBy(desc(favoritos.criadoEm));
  return rows as FavoritoResumo[];
}
