"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kamon } from "@/components/layout";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      senha: form.get("senha"),
      redirect: false,
    });
    setCarregando(false);
    if (res?.error) toast.error("Credenciais inválidas");
    else { toast.success("Bem-vindo!"); router.push("/mapa"); }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-foreground/15 bg-card p-8 shadow-sm">
        <Kamon className="text-primary" size={34} />
        <h1 className="mt-4 text-2xl font-extrabold">Entrar</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Bem-vindo de volta ao tatame.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
          <div className="space-y-1"><Label htmlFor="senha">Senha</Label><Input id="senha" name="senha" type="password" required /></div>
          <Button type="submit" disabled={carregando} className="w-full">
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <a href="/registro" className="font-semibold text-primary underline">Criar conta</a>
        </p>
      </div>
    </main>
  );
}
