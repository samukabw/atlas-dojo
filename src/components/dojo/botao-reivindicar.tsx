"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { reivindicarDojoAction } from "@/features/sensei";
import { toast } from "sonner";

export function BotaoReivindicar({
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
  const [sensei, setSensei] = useState(false);
  const [responsavel, setResponsavel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch(`/api/sensei/responsavel?placeId=${encodeURIComponent(placeId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!ativo) return;
        setSensei(Boolean(j.sensei));
        setResponsavel(Boolean(j.responsavel));
        setPronto(true);
      })
      .catch(() => setPronto(true));
    return () => {
      ativo = false;
    };
  }, [placeId]);

  async function reivindicar() {
    setCarregando(true);
    const fd = new FormData();
    fd.set("placeId", placeId);
    fd.set("nome", nome);
    fd.set("latitude", String(lat));
    fd.set("longitude", String(lng));
    if (endereco) fd.set("endereco", endereco);
    const res = await reivindicarDojoAction(fd);
    setCarregando(false);
    if (res.ok) {
      setResponsavel(true);
      toast.success("Você agora é responsável por este dojô!");
    } else {
      toast.error(res.erro ?? "Não foi possível reivindicar");
    }
  }

  // Só senseis veem esta ação.
  if (!pronto || !sensei) return null;

  if (responsavel) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-accent px-3 py-2 text-sm font-semibold text-primary">
        <BadgeCheck size={15} /> Você é responsável
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={reivindicar}
      disabled={carregando}
      className="inline-flex items-center gap-2 rounded-md border border-foreground/15 px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
    >
      <ShieldCheck size={15} /> {carregando ? "Vinculando..." : "Sou responsável por este dojô"}
    </button>
  );
}
