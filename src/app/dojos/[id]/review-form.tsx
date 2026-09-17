"use client";

import { useState } from "react";
import { salvarAvaliacaoAction } from "@/features/avaliacoes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ReviewForm({
  dojoId, inicial,
}: { dojoId: number; inicial?: { nota: number; descricao: string } }) {
  const [nota, setNota] = useState(inicial?.nota ?? 5);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    const res = await salvarAvaliacaoAction(new FormData(e.currentTarget));
    setEnviando(false);
    if (res.ok) toast.success("Avaliação salva!");
    else toast.error(res.erro ?? "Erro ao salvar");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="dojoId" value={dojoId} />
      <div>
        <Label htmlFor="nota">Nota</Label>
        <select id="nota" name="nota" value={nota} onChange={(e) => setNota(Number(e.target.value))}
                className="w-full border rounded h-9 px-2">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="descricao">Comentário</Label>
        <Textarea id="descricao" name="descricao" defaultValue={inicial?.descricao} />
      </div>
      <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Salvar avaliação"}</Button>
    </form>
  );
}
