import { db } from "@/db";
import { dojoSenseis, dojos, avaliacoes } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { obterOuCriarDojoPorPlace } from "./lugares";

/** O usuário já é responsável por este lugar do Google? */
export async function ehResponsavelPorPlace(usuarioId: number, placeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: dojoSenseis.id })
    .from(dojoSenseis)
    .innerJoin(dojos, eq(dojos.id, dojoSenseis.dojoId))
    .where(and(eq(dojoSenseis.usuarioId, usuarioId), eq(dojos.placeId, placeId)));
  return Boolean(row);
}

/** Vincula o sensei a um lugar do Google (cria/acha o dojô pelo place_id). */
export async function vincularPorPlace(
  usuarioId: number,
  p: { placeId: string; nome: string; latitude: number; longitude: number; endereco?: string | null }
): Promise<void> {
  const dojoId = await obterOuCriarDojoPorPlace(p);
  await db
    .insert(dojoSenseis)
    .values({ usuarioId, dojoId })
    .onConflictDoNothing({ target: [dojoSenseis.dojoId, dojoSenseis.usuarioId] });
}

export type DojoDoSensei = {
  dojoId: number;
  placeId: string | null;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  notaMedia: number;
  totalAvaliacoes: number;
};

/** Lista os dojôs pelos quais o sensei é responsável, com a nota da comunidade. */
export async function listarDojosDoSensei(usuarioId: number): Promise<DojoDoSensei[]> {
  const rows = await db
    .select({
      dojoId: dojos.id,
      placeId: dojos.placeId,
      nome: dojos.nome,
      endereco: dojos.endereco,
      cidade: dojos.cidade,
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
    })
    .from(dojoSenseis)
    .innerJoin(dojos, eq(dojos.id, dojoSenseis.dojoId))
    .leftJoin(avaliacoes, eq(avaliacoes.dojoId, dojos.id))
    .where(eq(dojoSenseis.usuarioId, usuarioId))
    .groupBy(dojos.id, dojoSenseis.criadoEm)
    .orderBy(desc(dojoSenseis.criadoEm));
  return rows as DojoDoSensei[];
}
