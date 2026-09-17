import { NextRequest, NextResponse } from "next/server";
import { listarDojosManuaisProximos } from "@/db/queries/dojos";

export const runtime = "nodejs";

// GET /api/dojos/manuais?lat=&lng= → dojôs cadastrados manualmente (place_id nulo) perto do ponto.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json([]);
  }
  const dados = await listarDojosManuaisProximos(lat, lng);
  return NextResponse.json(dados);
}
