"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registroSchema } from "@/lib/validators";

export async function registrarUsuario(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = registroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    perfil: formData.get("perfil") ?? "comum",
  });
  if (!parsed.success) return { ok: false, erro: "Dados inválidos" };

  const { nome, email, senha, perfil } = parsed.data;

  const [existente] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existente) return { ok: false, erro: "E-mail já cadastrado" };

  const senhaHash = await bcrypt.hash(senha, 10);
  await db.insert(users).values({ nome, email, senhaHash, perfil });
  return { ok: true };
}
