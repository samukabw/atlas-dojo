"use client";

import { useEffect, useState, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SeloNota } from "@/components/dojo";

type Lugar = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  endereco: string | null;
  ratingGoogle: number | null;
};

type DojoManual = {
  dojoId: number;
  nome: string;
  endereco: string | null;
  latitude: number;
  longitude: number;
  notaMedia: number;
  totalAvaliacoes: number;
};

const CENTRO_PADRAO = { lat: -23.5505, lng: -46.6333 };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
const BUSCA_PADRAO = "academia de artes marciais dojô";

function IconeFechar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Fechar"
      className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function Recentraliza({ centro }: { centro: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map) map.panTo(centro);
  }, [map, centro]);
  return null;
}

function MapaInterno() {
  const placesLib = useMapsLibrary("places");
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [manuais, setManuais] = useState<DojoManual[]>([]);
  const [q, setQ] = useState("");
  const [centro, setCentro] = useState(CENTRO_PADRAO);
  const [selecionado, setSelecionado] = useState<Lugar | null>(null);
  const [selManual, setSelManual] = useState<DojoManual | null>(null);
  const [resumo, setResumo] = useState<{ media: number; total: number } | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregarManuais = useCallback(async (center: { lat: number; lng: number }) => {
    try {
      const r = await fetch(`/api/dojos/manuais?lat=${center.lat}&lng=${center.lng}`);
      if (r.ok) setManuais(await r.json());
    } catch {
      /* silencioso */
    }
  }, []);

  const buscar = useCallback(
    async (texto: string, center: { lat: number; lng: number }) => {
      if (!placesLib) return;
      setCarregando(true);
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: texto.trim() || BUSCA_PADRAO,
          fields: ["id", "displayName", "location", "formattedAddress", "rating"],
          locationBias: { center, radius: 15000 },
          maxResultCount: 20,
          language: "pt-BR",
          region: "br",
        });
        const mapeados: Lugar[] = (places ?? [])
          .map((p) => ({
            id: p.id,
            nome: p.displayName ?? "Dojô",
            lat: p.location?.lat() ?? 0,
            lng: p.location?.lng() ?? 0,
            endereco: p.formattedAddress ?? null,
            ratingGoogle: p.rating ?? null,
          }))
          .filter((l) => l.lat !== 0 && l.lng !== 0);
        setLugares(mapeados);
      } catch {
        setLugares([]);
      } finally {
        setCarregando(false);
      }
      carregarManuais(center);
    },
    [placesLib, carregarManuais]
  );

  useEffect(() => {
    if (!placesLib) return;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCentro(c);
          buscar("", c);
        },
        () => buscar("", CENTRO_PADRAO)
      );
    } else {
      buscar("", CENTRO_PADRAO);
    }
  }, [placesLib, buscar]);

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCentro(c);
        buscar(q, c);
      },
      () => alert("Não foi possível obter sua localização")
    );
  }

  const selecionar = useCallback(async (l: Lugar) => {
    setSelManual(null);
    setSelecionado(l);
    setResumo(null);
    try {
      const r = await fetch(`/api/avaliacoes?placeId=${encodeURIComponent(l.id)}`);
      if (r.ok) {
        const j = await r.json();
        setResumo({ media: j.media ?? 0, total: j.total ?? 0 });
      }
    } catch {
      /* silencioso */
    }
  }, []);

  function selecionarManual(m: DojoManual) {
    setSelecionado(null);
    setSelManual(m);
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(q, centro);
        }}
        className="flex flex-wrap items-center gap-2 border-b border-foreground/15 bg-background/60 px-4 py-3 sm:px-6"
      >
        <Input
          className="h-10 min-w-0 flex-1"
          placeholder="Buscar dojô por cidade, bairro ou modalidade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" disabled={carregando}>
          {carregando ? "Buscando…" : "Buscar"}
        </Button>
        <Button type="button" variant="outline" onClick={usarMinhaLocalizacao}>
          Perto de mim
        </Button>
      </form>

      <div className="relative flex-1">
        <Map
          defaultCenter={centro}
          defaultZoom={13}
          mapId={MAP_ID}
          gestureHandling="greedy"
          clickableIcons={false}
          style={{ width: "100%", height: "calc(100dvh - 130px)" }}
        >
          <Recentraliza centro={centro} />

          {lugares.map((l) => {
            const ativo = selecionado?.id === l.id;
            return (
              <AdvancedMarker
                key={l.id}
                position={{ lat: l.lat, lng: l.lng }}
                onClick={() => selecionar(l)}
                zIndex={ativo ? 10 : 1}
              >
                <span
                  className="block rounded-full border-2 border-background bg-primary shadow-md"
                  style={{
                    width: ativo ? 22 : 15,
                    height: ativo ? 22 : 15,
                    boxShadow: "0 1px 4px oklch(0.22 0.012 265 / 0.4)",
                  }}
                  aria-label={l.nome}
                />
              </AdvancedMarker>
            );
          })}

          {manuais.map((m) => {
            const ativo = selManual?.dojoId === m.dojoId;
            return (
              <AdvancedMarker
                key={`m-${m.dojoId}`}
                position={{ lat: m.latitude, lng: m.longitude }}
                onClick={() => selecionarManual(m)}
                zIndex={ativo ? 10 : 2}
              >
                <span
                  className="block rounded-full border-2 border-primary bg-background shadow-md"
                  style={{
                    width: ativo ? 22 : 15,
                    height: ativo ? 22 : 15,
                    boxShadow: "0 1px 4px oklch(0.22 0.012 265 / 0.4)",
                  }}
                  aria-label={m.nome}
                />
              </AdvancedMarker>
            );
          })}
        </Map>

        {selecionado && (
          <div className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-4 sm:w-[22rem]">
            <div className="relative rounded border border-foreground/15 bg-card p-4 shadow-xl">
              <IconeFechar onClick={() => setSelecionado(null)} />
              <div className="flex items-start gap-3 pr-6">
                <SeloNota nota={resumo?.media ?? 0} total={resumo?.total ?? 0} size={66} />
                <div className="min-w-0">
                  <h2 className="text-balance font-bold leading-tight">{selecionado.nome}</h2>
                  {selecionado.endereco && (
                    <p className="mt-1 text-xs text-muted-foreground">{selecionado.endereco}</p>
                  )}
                  {selecionado.ratingGoogle != null && (
                    <p className="tnum mt-1 text-xs text-muted-foreground">
                      Google {selecionado.ratingGoogle.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                nativeButton={false}
                render={<Link href={`/dojos/place/${selecionado.id}`}>Ver detalhes e avaliar</Link>}
              />
            </div>
          </div>
        )}

        {selManual && (
          <div className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-4 sm:w-[22rem]">
            <div className="relative rounded border border-foreground/15 bg-card p-4 shadow-xl">
              <IconeFechar onClick={() => setSelManual(null)} />
              <p className="registro-label mb-2">Dojô da comunidade</p>
              <div className="flex items-start gap-3 pr-6">
                <SeloNota nota={selManual.notaMedia} total={selManual.totalAvaliacoes} size={66} />
                <div className="min-w-0">
                  <h2 className="text-balance font-bold leading-tight">{selManual.nome}</h2>
                  {selManual.endereco && (
                    <p className="mt-1 text-xs text-muted-foreground">{selManual.endereco}</p>
                  )}
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                nativeButton={false}
                render={<Link href={`/dojos/${selManual.dojoId}`}>Ver detalhes e avaliar</Link>}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function MapaClient({ apiKey }: { apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center text-muted-foreground">
        Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }
  return (
    <APIProvider apiKey={apiKey} language="pt-BR" region="BR">
      <MapaInterno />
    </APIProvider>
  );
}
