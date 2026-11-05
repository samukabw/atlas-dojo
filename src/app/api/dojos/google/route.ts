import { NextRequest, NextResponse } from "next/server";
import { listarDojosGoogleProximos } from "@/db/queries/dojos";

export const runtime = "nodejs";

// GET /api/dojos/google?lat=&lng= → dojôs do Google já salvos no banco (place_id preenchido) perto do ponto.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json([]);
  }
  const dados = await listarDojosGoogleProximos(lat, lng);
  return NextResponse.json(dados);
}
