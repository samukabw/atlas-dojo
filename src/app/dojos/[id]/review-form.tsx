"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { salvarAvaliacaoAction } from "@/features/avaliacoes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ReviewForm({
  dojoId,
  inicial,
}: {
  dojoId: number;
  inicial?: { nota: number; descricao: string };
}) {
  const router = useRouter();
  const [nota, setNota] = useState(inicial?.nota ?? 5);
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    const fd = new FormData();
    fd.set("dojoId", String(dojoId));
    fd.set("nota", String(nota));
    fd.set("descricao", descricao);
    const res = await salvarAvaliacaoAction(fd);
    setEnviando(false);
    if (res.ok) {
      toast.success("Avaliação carimbada!");
      router.refresh();
    } else {
      toast.error(res.erro ?? "Erro ao salvar");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="nota">Nota</Label>
        <select
          id="nota"
          value={nota}
          onChange={(e) => setNota(Number(e.target.value))}
          className="h-10 w-full rounded-md border bg-card px-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="descricao">Comentário</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Como foi treinar aqui? Ambiente, professores, estrutura..."
        />
      </div>
      <Button type="submit" disabled={enviando}>
        {enviando ? "Carimbando..." : "Carimbar avaliação"}
      </Button>
    </form>
  );
}
