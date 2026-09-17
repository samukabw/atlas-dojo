import { NextRequest, NextResponse } from "next/server";
import { listarAvaliacoes } from "@/db/queries/avaliacoes";
import { obterDojoIdPorPlace } from "@/db/queries/lugares";
import { ehResponsavelPorDojo } from "@/db/queries/sensei";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/avaliacoes?placeId=... → avaliações da comunidade para um lugar do Google.
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ erro: "placeId obrigatório" }, { status: 400 });
  }

  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  const usuarioId = u?.id ?? null;
  const sensei = u?.perfil === "sensei" || u?.perfil === "admin";

  const dojoId = await obterDojoIdPorPlace(placeId);
  if (!dojoId) {
    return NextResponse.json({ media: 0, total: 0, itens: [], usuarioId, podeResponder: false });
  }

  const itens = await listarAvaliacoes(dojoId);
  const total = itens.length;
  const media = total ? itens.reduce((s, a) => s + a.nota, 0) / total : 0;
  const podeResponder = Boolean(usuarioId && sensei) && (await ehResponsavelPorDojo(usuarioId!, dojoId));

  return NextResponse.json({ media, total, itens, usuarioId, podeResponder });
}
