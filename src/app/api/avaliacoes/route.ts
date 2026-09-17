import { NextRequest, NextResponse } from "next/server";
import { listarAvaliacoes } from "@/db/queries/avaliacoes";
import { obterDojoIdPorPlace } from "@/db/queries/lugares";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/avaliacoes?placeId=... → avaliações da comunidade para um lugar do Google.
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ erro: "placeId obrigatório" }, { status: 400 });
  }

  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id ?? null;

  const dojoId = await obterDojoIdPorPlace(placeId);
  if (!dojoId) {
    return NextResponse.json({ media: 0, total: 0, itens: [], usuarioId });
  }

  const itens = await listarAvaliacoes(dojoId);
  const total = itens.length;
  const media = total ? itens.reduce((s, a) => s + a.nota, 0) / total : 0;
  return NextResponse.json({ media, total, itens, usuarioId });
}
