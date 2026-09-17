import { NextRequest, NextResponse } from "next/server";
import { buscarDojos } from "@/db/queries/dojos";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const num = (v: string | null) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const ordenar = sp.get("ordenar");
  const dados = await buscarDojos({
    q: sp.get("q") ?? undefined,
    cidade: sp.get("cidade") ?? undefined,
    bairro: sp.get("bairro") ?? undefined,
    lat: num(sp.get("lat")),
    lng: num(sp.get("lng")),
    ordenar: ordenar === "nota" || ordenar === "distancia" ? ordenar : undefined,
  });
  return NextResponse.json(dados);
}
