"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarUsuario } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kamon } from "@/components/layout";
import { toast } from "sonner";

export default function RegistroPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const res = await registrarUsuario(new FormData(e.currentTarget));
    setCarregando(false);
    if (res.ok) {
      toast.success("Conta criada! Faça login.");
      router.push("/login");
    } else {
      toast.error(res.erro ?? "Erro ao registrar");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-foreground/15 bg-card p-8 shadow-sm">
        <Kamon className="text-primary" size={34} />
        <h1 className="mt-4 text-2xl font-extrabold">Criar conta</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Entre para a comunidade e avalie dojôs.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1"><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" required /></div>
          <div className="space-y-1"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
          <div className="space-y-1"><Label htmlFor="senha">Senha</Label><Input id="senha" name="senha" type="password" minLength={8} required /></div>
          <div className="space-y-1">
            <Label htmlFor="perfil">Perfil</Label>
            <select id="perfil" name="perfil" className="h-9 w-full rounded-md border bg-transparent px-2">
              <option value="comum">Praticante</option>
              <option value="sensei">Sensei</option>
            </select>
          </div>
          <Button type="submit" disabled={carregando} className="w-full">
            {carregando ? "Enviando..." : "Registrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <a href="/login" className="font-semibold text-primary underline">Entrar</a>
        </p>
      </div>
    </main>
  );
}
