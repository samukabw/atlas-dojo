"use client";

import { useEffect, useState, useCallback } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Navigation, Share2, Phone, Globe, Clock } from "lucide-react";
import { salvarAvaliacaoPlaceAction, excluirAvaliacaoAction } from "@/features/avaliacoes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SeloNota, BotaoFavorito } from "@/components/dojo";
import { toast } from "sonner";

type Info = {
  nome: string;
  endereco: string | null;
  lat: number;
  lng: number;
  ratingGoogle: number | null;
  totalGoogle: number | null;
  fotos: string[];
  horarios: string[] | null;
  telefone: string | null;
  site: string | null;
};

type Item = {
  id: number;
  nota: number;
  descricao: string | null;
  usuarioId: number;
  autorNome: string;
};

type Reviews = { media: number; total: number; itens: Item[]; usuarioId: number | null };

function NotaBadge({ nota }: { nota: number }) {
  return (
    <span className="tnum inline-flex items-center rounded bg-accent px-2 py-0.5 text-sm font-bold text-primary">
      {nota}
      <span className="ml-0.5 text-[0.65em] font-semibold text-muted-foreground">/5</span>
    </span>
  );
}

const acaoCls =
  "inline-flex items-center gap-2 rounded-md border border-foreground/15 px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted";

function Detalhe({ placeId }: { placeId: string }) {
  const placesLib = useMapsLibrary("places");
  const [info, setInfo] = useState<Info | null>(null);
  const [reviews, setReviews] = useState<Reviews | null>(null);
  const [nota, setNota] = useState(5);
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    let ativo = true;
    (async () => {
      try {
        const place = new placesLib.Place({ id: placeId });
        await place.fetchFields({
          fields: [
            "displayName",
            "formattedAddress",
            "location",
            "rating",
            "userRatingCount",
            "photos",
            "regularOpeningHours",
            "nationalPhoneNumber",
            "websiteURI",
          ],
        });
        if (!ativo) return;
        const fotos =
          place.photos?.slice(0, 8).map((p) => p.getURI({ maxWidth: 640, maxHeight: 480 })) ?? [];
        setInfo({
          nome: place.displayName ?? "Dojô",
          endereco: place.formattedAddress ?? null,
          lat: place.location?.lat() ?? 0,
          lng: place.location?.lng() ?? 0,
          ratingGoogle: place.rating ?? null,
          totalGoogle: place.userRatingCount ?? null,
          fotos,
          horarios: place.regularOpeningHours?.weekdayDescriptions ?? null,
          telefone: place.nationalPhoneNumber ?? null,
          site: place.websiteURI ?? null,
        });
      } catch {
        if (ativo)
          setInfo({
            nome: "Dojô", endereco: null, lat: 0, lng: 0, ratingGoogle: null,
            totalGoogle: null, fotos: [], horarios: null, telefone: null, site: null,
          });
      }
    })();
    return () => {
      ativo = false;
    };
  }, [placesLib, placeId]);

  const carregarReviews = useCallback(async () => {
    const res = await fetch(`/api/avaliacoes?placeId=${encodeURIComponent(placeId)}`);
    setReviews(await res.json());
  }, [placeId]);

  useEffect(() => {
    carregarReviews();
  }, [carregarReviews]);

  useEffect(() => {
    if (!reviews?.usuarioId) return;
    const minha = reviews.itens.find((i) => i.usuarioId === reviews.usuarioId);
    if (minha) {
      setNota(minha.nota);
      setDescricao(minha.descricao ?? "");
    }
  }, [reviews]);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!info) return;
    setEnviando(true);
    const fd = new FormData();
    fd.set("placeId", placeId);
    fd.set("nome", info.nome);
    fd.set("latitude", String(info.lat));
    fd.set("longitude", String(info.lng));
    if (info.endereco) fd.set("endereco", info.endereco);
    fd.set("nota", String(nota));
    fd.set("descricao", descricao);
    const res = await salvarAvaliacaoPlaceAction(fd);
    setEnviando(false);
    if (res.ok) {
      toast.success("Avaliação carimbada!");
      carregarReviews();
    } else {
      toast.error(res.erro ?? "Erro ao salvar");
    }
  }

  async function excluir(id: number) {
    const fd = new FormData();
    fd.set("avaliacaoId", String(id));
    const res = await excluirAvaliacaoAction(fd);
    if (res.ok) {
      toast.success("Avaliação removida");
      carregarReviews();
    } else {
      toast.error(res.erro ?? "Erro ao remover");
    }
  }

  async function compartilhar() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: info?.nome ?? "Dojô", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      /* usuário cancelou o compartilhamento */
    }
  }

  const logado = reviews?.usuarioId != null;
  const usuarioId = reviews?.usuarioId ?? null;
  const comoChegar = info
    ? `https://www.google.com/maps/dir/?api=1&destination=${info.lat},${info.lng}&destination_place_id=${encodeURIComponent(placeId)}`
    : "#";

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <a
        href="/mapa"
        className="registro-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar ao mapa
      </a>

      {/* Cabeçalho certificado */}
      <section className="mt-4 rounded border border-foreground/15 bg-card p-5 sm:p-6">
        <p className="tnum registro-label">Registro nº {placeId.slice(0, 12).toUpperCase()}</p>
        <div className="mt-3 flex items-start gap-4">
          <SeloNota nota={reviews?.media ?? 0} total={reviews?.total ?? 0} size={82} />
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
              {info?.nome ?? "Carregando..."}
            </h1>
            {info?.endereco && <p className="mt-1.5 text-sm text-muted-foreground">{info.endereco}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="tnum">
                <span className="font-bold">{reviews ? reviews.media.toFixed(1) : "-"}</span>
                <span className="text-muted-foreground"> · comunidade ({reviews?.total ?? 0})</span>
              </span>
              {info?.ratingGoogle != null && (
                <span className="tnum text-muted-foreground">
                  {info.ratingGoogle.toFixed(1)} · Google ({info.totalGoogle ?? 0})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        {info && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={comoChegar} target="_blank" rel="noopener noreferrer" className={acaoCls}>
              <Navigation size={15} /> Como chegar
            </a>
            <button type="button" onClick={compartilhar} className={acaoCls}>
              <Share2 size={15} /> Compartilhar
            </button>
            {info.telefone && (
              <a href={`tel:${info.telefone.replace(/\s/g, "")}`} className={acaoCls}>
                <Phone size={15} /> {info.telefone}
              </a>
            )}
            {info.site && (
              <a href={info.site} target="_blank" rel="noopener noreferrer" className={acaoCls}>
                <Globe size={15} /> Site
              </a>
            )}
            <BotaoFavorito
              placeId={placeId}
              nome={info.nome}
              lat={info.lat}
              lng={info.lng}
              endereco={info.endereco}
            />
          </div>
        )}
      </section>

      {/* Fotos */}
      {info && info.fotos.length > 0 && (
        <section className="mt-6">
          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
            {info.fotos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Foto ${i + 1} de ${info.nome}`}
                loading="lazy"
                className="h-40 w-56 shrink-0 rounded border border-foreground/15 object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {/* Horários */}
      {info?.horarios && info.horarios.length > 0 && (
        <section className="mt-6">
          <details className="rounded border border-foreground/15 bg-card">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-semibold">
              <Clock size={16} className="text-primary" /> Horários de funcionamento
            </summary>
            <ul className="border-t border-foreground/15 px-4 py-3 text-sm text-muted-foreground">
              {info.horarios.map((h, i) => (
                <li key={i} className="py-0.5">{h}</li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* Sua avaliação */}
      <section className="mt-8">
        <h2 className="registro-label mb-3 border-b border-foreground/15 pb-2">Sua avaliação</h2>
        {logado ? (
          <form onSubmit={salvar} className="space-y-3">
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
            <Button type="submit" disabled={enviando || !info}>
              {enviando ? "Carimbando..." : "Carimbar avaliação"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            <a className="font-semibold text-primary underline" href="/login">
              Entre
            </a>{" "}
            para carimbar sua avaliação neste dojô.
          </p>
        )}
      </section>

      {/* Avaliações da comunidade */}
      <section className="mt-8">
        <h2 className="registro-label mb-1 border-b border-foreground/15 pb-2">
          Avaliações da comunidade
        </h2>
        {reviews && reviews.itens.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            Ainda sem avaliações - seja o primeiro a carimbar.
          </p>
        )}
        <div>
          {reviews?.itens.map((a) => (
            <article key={a.id} className="flex gap-3 border-b border-foreground/15 py-4">
              <NotaBadge nota={a.nota} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.autorNome}</p>
                {a.descricao && <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>}
                {a.usuarioId === usuarioId && (
                  <button
                    type="button"
                    onClick={() => excluir(a.id)}
                    className="mt-2 text-xs font-semibold text-muted-foreground underline transition-colors hover:text-primary"
                  >
                    Excluir minha avaliação
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function PlaceDetalhe({ placeId, apiKey }: { placeId: string; apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center text-muted-foreground">
        Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }
  return (
    <APIProvider apiKey={apiKey} language="pt-BR" region="BR">
      <Detalhe placeId={placeId} />
    </APIProvider>
  );
}
