"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { responderAvaliacaoAction, excluirRespostaAction } from "@/features/avaliacoes";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RespostaSensei({
  avaliacaoId,
  respostaTexto,
  respostaAutor,
  podeResponder,
  onChanged,
}: {
  avaliacaoId: number;
  respostaTexto: string | null;
  respostaAutor: string | null;
  podeResponder: boolean;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(respostaTexto ?? "");
  const [enviando, setEnviando] = useState(false);

  function atualizou() {
    onChanged?.();
    router.refresh();
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    const fd = new FormData();
    fd.set("avaliacaoId", String(avaliacaoId));
    fd.set("texto", texto);
    const res = await responderAvaliacaoAction(fd);
    setEnviando(false);
    if (res.ok) {
      toast.success("Resposta publicada");
      setEditando(false);
      atualizou();
    } else {
      toast.error(res.erro ?? "Erro ao responder");
    }
  }

  async function excluir() {
    const fd = new FormData();
    fd.set("avaliacaoId", String(avaliacaoId));
    const res = await excluirRespostaAction(fd);
    if (res.ok) {
      toast.success("Resposta removida");
      setTexto("");
      atualizou();
    } else {
      toast.error(res.erro ?? "Erro ao remover");
    }
  }

  // Resposta já existente (e não está editando).
  if (respostaTexto && !editando) {
    return (
      <div className="mt-2 rounded bg-accent/50 p-2.5">
        <p className="registro-label mb-0.5">
          Resposta do dojô{respostaAutor ? ` · ${respostaAutor}` : ""}
        </p>
        <p className="text-sm">{respostaTexto}</p>
        {podeResponder && (
          <div className="mt-1.5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setTexto(respostaTexto);
                setEditando(true);
              }}
              className="text-xs font-semibold text-muted-foreground underline transition-colors hover:text-primary"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={excluir}
              className="text-xs font-semibold text-muted-foreground underline transition-colors hover:text-primary"
            >
              Excluir
            </button>
          </div>
        )}
      </div>
    );
  }

  // Formulário para o sensei responsável (novo ou edição).
  if (podeResponder) {
    return (
      <form onSubmit={salvar} className="mt-2 space-y-2">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Responder como responsável do dojô…"
          rows={2}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={enviando}>
            {enviando ? "Enviando…" : "Responder"}
          </Button>
          {editando && (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    );
  }

  return null;
}
