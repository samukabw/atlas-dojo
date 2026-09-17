import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ehResponsavelPorPlace } from "@/db/queries/sensei";

export const runtime = "nodejs";

// GET /api/sensei/responsavel?placeId=... → estado do vínculo do usuário logado.
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ erro: "placeId obrigatório" }, { status: 400 });
  }

  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  const sensei = u?.perfil === "sensei" || u?.perfil === "admin";

  let responsavel = false;
  if (u?.id && sensei) {
    responsavel = await ehResponsavelPorPlace(u.id, placeId);
  }

  return NextResponse.json({ logado: Boolean(u?.id), sensei: Boolean(sensei), responsavel });
}
