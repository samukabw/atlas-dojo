import { db } from "@/db";
import { dojos, avaliacoes, contatos } from "@/db/schema";
import { and, or, ilike, eq, sql, asc, desc, isNull } from "drizzle-orm";
import { haversineSqlKm } from "@/lib/distancia";

export type DojoManual = {
  dojoId: number;
  nome: string;
  endereco: string | null;
  latitude: number;
  longitude: number;
  notaMedia: number;
  totalAvaliacoes: number;
  distanciaKm: number;
};

/** Dojôs cadastrados manualmente (place_id nulo) mais próximos de um ponto. */
export async function listarDojosManuaisProximos(
  lat: number,
  lng: number,
  raioKm = 30
): Promise<DojoManual[]> {
  const dist = haversineSqlKm(dojos.latitude, dojos.longitude, lat, lng);
  const rows = await db
    .select({
      dojoId: dojos.id,
      nome: dojos.nome,
      endereco: dojos.endereco,
      latitude: sql<number>`${dojos.latitude}::double precision`,
      longitude: sql<number>`${dojos.longitude}::double precision`,
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
      distanciaKm: dist,
    })
    .from(dojos)
    .leftJoin(avaliacoes, eq(avaliacoes.dojoId, dojos.id))
    .where(isNull(dojos.placeId))
    .groupBy(dojos.id)
    .orderBy(asc(dist))
    .limit(60);
  return (rows as DojoManual[]).filter((r) => r.distanciaKm <= raioKm);
}

export type DojoResumo = {
  id: number; nome: string; cidade: string | null; bairro: string | null;
  latitude: number; longitude: number;
  notaMedia: number; totalAvaliacoes: number; distanciaKm: number | null;
};

type BuscarParams = {
  q?: string; cidade?: string; bairro?: string;
  lat?: number; lng?: number; ordenar?: "distancia" | "nota";
};

export async function buscarDojos(params: BuscarParams): Promise<DojoResumo[]> {
  const { q, cidade, bairro, lat, lng, ordenar } = params;
  const temGeo = typeof lat === "number" && typeof lng === "number";

  const distancia = temGeo
    ? haversineSqlKm(dojos.latitude, dojos.longitude, lat!, lng!)
    : sql<number | null>`null`;

  const filtros = [];
  if (q) filtros.push(or(ilike(dojos.nome, `%${q}%`), ilike(dojos.bairro, `%${q}%`), ilike(dojos.cidade, `%${q}%`)));
  if (cidade) filtros.push(ilike(dojos.cidade, `%${cidade}%`));
  if (bairro) filtros.push(ilike(dojos.bairro, `%${bairro}%`));

  const rows = await db
    .select({
      id: dojos.id,
      nome: dojos.nome,
      cidade: dojos.cidade,
      bairro: dojos.bairro,
      latitude: sql<number>`${dojos.latitude}::double precision`,
      longitude: sql<number>`${dojos.longitude}::double precision`,
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
      distanciaKm: distancia,
    })
    .from(dojos)
    .leftJoin(avaliacoes, eq(avaliacoes.dojoId, dojos.id))
    .where(filtros.length ? and(...filtros) : undefined)
    .groupBy(dojos.id)
    .orderBy(
      ordenar === "nota"
        ? desc(sql`coalesce(avg(${avaliacoes.nota}), 0)`)
        : temGeo && ordenar === "distancia"
        ? asc(distancia)
        : asc(dojos.nome)
    );

  return rows as DojoResumo[];
}

export type DojoDetalhe = {
  id: number; nome: string; descricao: string | null;
  cep: string | null; cidade: string | null; bairro: string | null;
  rua: string | null; numero: string | null;
  endereco: string | null;
  latitude: number; longitude: number;
  notaMedia: number; totalAvaliacoes: number;
  contatos: { telefone: string | null; email: string | null }[];
};

export async function obterDojo(id: number): Promise<DojoDetalhe | null> {
  const [d] = await db.select().from(dojos).where(eq(dojos.id, id));
  if (!d) return null;

  const [agg] = await db
    .select({
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
    })
    .from(avaliacoes)
    .where(eq(avaliacoes.dojoId, id));

  const cts = await db
    .select({ telefone: contatos.telefone, email: contatos.email })
    .from(contatos)
    .where(eq(contatos.dojoId, id));

  return {
    id: d.id, nome: d.nome, descricao: d.descricao,
    cep: d.cep, cidade: d.cidade, bairro: d.bairro, rua: d.rua, numero: d.numero,
    endereco: d.endereco,
    latitude: Number(d.latitude), longitude: Number(d.longitude),
    notaMedia: agg?.notaMedia ?? 0, totalAvaliacoes: agg?.totalAvaliacoes ?? 0,
    contatos: cts,
  };
}
