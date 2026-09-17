import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { registrarUsuario } from "@/features/auth";
import { limparBanco } from "./_setup";

function fd(obj: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

describe("registrarUsuario", () => {
  beforeEach(limparBanco);

  it("cria usuário com senha em hash (não texto puro)", async () => {
    const res = await registrarUsuario(
      fd({ nome: "Ana", email: "ana@ex.com", senha: "senhaforte1", perfil: "comum" })
    );
    expect(res.ok).toBe(true);
    const [u] = await db.select().from(users).where(eq(users.email, "ana@ex.com"));
    expect(u).toBeTruthy();
    expect(u.senhaHash).not.toBe("senhaforte1");
    expect(await bcrypt.compare("senhaforte1", u.senhaHash)).toBe(true);
  });

  it("rejeita e-mail duplicado", async () => {
    await registrarUsuario(fd({ nome: "Ana", email: "a@ex.com", senha: "senhaforte1", perfil: "comum" }));
    const res = await registrarUsuario(fd({ nome: "Outra", email: "a@ex.com", senha: "senhaforte1", perfil: "comum" }));
    expect(res.ok).toBe(false);
  });
});
