import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ehFavoritoPorPlace } from "@/db/queries/favoritos";

export const runtime = "nodejs";

// GET /api/favoritos?placeId=... → estado do favorito para o usuário logado.
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ erro: "placeId obrigatório" }, { status: 400 });
  }

  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id ?? null;
  if (!usuarioId) {
    return NextResponse.json({ logado: false, favorito: false });
  }

  const favorito = await ehFavoritoPorPlace(usuarioId, placeId);
  return NextResponse.json({ logado: true, favorito });
}
