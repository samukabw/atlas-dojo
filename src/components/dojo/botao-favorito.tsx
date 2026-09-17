"use client";

import { useEffect, useState } from "react";
import { alternarFavoritoAction, alternarFavoritoDojoAction } from "@/features/favoritos";
import { toast } from "sonner";

export function CoracaoIcon({ preenchido }: { preenchido: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={preenchido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c2 0 3.2 1.2 3.9 2.3l.1.2.1-.2c.7-1.1 1.9-2.3 3.9-2.3 3 0 4.5 3 3 6C19 15.65 12 20 12 20z" />
    </svg>
  );
}

export function BotaoFavorito({
  placeId,
  nome,
  lat,
  lng,
  endereco,
}: {
  placeId: string;
  nome: string;
  lat: number;
  lng: number;
  endereco: string | null;
}) {
  const [favorito, setFavorito] = useState(false);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch(`/api/favoritos?placeId=${encodeURIComponent(placeId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!ativo) return;
        setLogado(Boolean(j.logado));
        setFavorito(Boolean(j.favorito));
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [placeId]);

  async function alternar() {
    if (logado === false) {
      toast.error("Entre para favoritar este dojô");
      return;
    }
    setCarregando(true);
    const novo = !favorito;
    const fd = new FormData();
    fd.set("placeId", placeId);
    fd.set("favoritar", novo ? "1" : "0");
    if (novo) {
      fd.set("nome", nome);
      fd.set("latitude", String(lat));
      fd.set("longitude", String(lng));
      if (endereco) fd.set("endereco", endereco);
    }
    const res = await alternarFavoritoAction(fd);
    setCarregando(false);
    if (res.ok) {
      setFavorito(res.favorito ?? novo);
      toast.success(novo ? "Adicionado aos favoritos" : "Removido dos favoritos");
    } else {
      toast.error(res.erro ?? "Erro ao favoritar");
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={carregando}
      aria-pressed={favorito}
      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
        favorito
          ? "border-primary/30 bg-accent text-primary"
          : "border-foreground/15 text-foreground hover:bg-muted"
      }`}
    >
      <CoracaoIcon preenchido={favorito} />
      {favorito ? "Favoritado" : "Favoritar"}
    </button>
  );
}

/** Favoritar um dojô do banco (manual), com estado inicial vindo do servidor. */
export function BotaoFavoritoDojo({ dojoId, inicial }: { dojoId: number; inicial: boolean }) {
  const [favorito, setFavorito] = useState(inicial);
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    setCarregando(true);
    const novo = !favorito;
    const fd = new FormData();
    fd.set("dojoId", String(dojoId));
    fd.set("favoritar", novo ? "1" : "0");
    const res = await alternarFavoritoDojoAction(fd);
    setCarregando(false);
    if (res.ok) {
      setFavorito(res.favorito ?? novo);
      toast.success(novo ? "Adicionado aos favoritos" : "Removido dos favoritos");
    } else {
      toast.error(res.erro ?? "Erro ao favoritar");
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={carregando}
      aria-pressed={favorito}
      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
        favorito
          ? "border-primary/30 bg-accent text-primary"
          : "border-foreground/15 text-foreground hover:bg-muted"
      }`}
    >
      <CoracaoIcon preenchido={favorito} />
      {favorito ? "Favoritado" : "Favoritar"}
    </button>
  );
}
