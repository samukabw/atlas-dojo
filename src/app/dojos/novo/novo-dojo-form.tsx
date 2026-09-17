"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { cadastrarDojoAction } from "@/features/sensei";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CENTRO_PADRAO = { lat: -23.5505, lng: -46.6333 };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

type LatLng = { lat: number; lng: number };

// Reposiciona e aproxima o mapa quando o centro muda (localização/endereço).
function Recentraliza({ centro }: { centro: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && centro) {
      map.panTo(centro);
      map.setZoom(16);
    }
  }, [map, centro]);
  return null;
}

function Form() {
  const router = useRouter();
  const placesLib = useMapsLibrary("places");

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");

  const [pos, setPos] = useState<LatLng | null>(null);
  const [centro, setCentro] = useState<LatLng | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [localizando, setLocalizando] = useState(false);

  // Ao abrir: centraliza na localização do usuário e já marca o ponto.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCentro(c);
        setPos(c);
      },
      () => {
        /* sem permissão: usa o padrão e o sensei marca manualmente */
      }
    );
  }, []);

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      toast.error("Geolocalização indisponível neste navegador");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCentro(c);
        setPos(c);
      },
      () => toast.error("Não foi possível obter sua localização")
    );
  }

  const localizarEndereco = useCallback(async () => {
    if (!placesLib) return;
    const query = [endereco, bairro, cidade].filter(Boolean).join(", ").trim();
    if (!query) {
      toast.error("Preencha o endereço ou a cidade para localizar no mapa");
      return;
    }
    setLocalizando(true);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: query,
        fields: ["location"],
        maxResultCount: 1,
        language: "pt-BR",
        region: "br",
      });
      const loc = places?.[0]?.location;
      if (loc) {
        const c = { lat: loc.lat(), lng: loc.lng() };
        setCentro(c);
        setPos(c);
        toast.success("Mapa centralizado - arraste o pino para o ponto exato");
      } else {
        toast.error("Endereço não encontrado - marque o ponto direto no mapa");
      }
    } catch {
      toast.error("Não foi possível localizar - marque o ponto no mapa");
    } finally {
      setLocalizando(false);
    }
  }, [placesLib, endereco, bairro, cidade]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pos) {
      toast.error("Marque no mapa o ponto onde acontecem as aulas");
      return;
    }
    setEnviando(true);
    const fd = new FormData();
    fd.set("nome", nome);
    fd.set("endereco", endereco);
    fd.set("cidade", cidade);
    fd.set("bairro", bairro);
    fd.set("latitude", String(pos.lat));
    fd.set("longitude", String(pos.lng));
    const res = await cadastrarDojoAction(fd);
    setEnviando(false);
    if (res.ok && res.dojoId) {
      toast.success("Dojô cadastrado!");
      router.push(`/dojos/${res.dojoId}`);
    } else {
      toast.error(res.erro ?? "Erro ao cadastrar");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="registro-label border-b border-foreground/15 pb-2">Cadastrar dojô</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Para espaços que não estão no Google - praia, praça, quintal ou local compartilhado. Marque
        no mapa o ponto exato onde acontecem as aulas.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="nome">Nome do dojô / turma</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex.: Karatê na Praia - Turma do Sensei Pedro"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endereco">Endereço / referência</Label>
          <Input
            id="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Ex.: Praia de Boa Viagem, próximo ao posto 6"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>
              Ponto no mapa{" "}
              {pos && (
                <span className="tnum text-xs text-muted-foreground">
                  ({pos.lat.toFixed(5)}, {pos.lng.toFixed(5)})
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={localizarEndereco}
                disabled={localizando}
              >
                {localizando ? "Localizando…" : "Localizar endereço"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={usarMinhaLocalizacao}>
                Usar minha localização
              </Button>
            </div>
          </div>
          <div className="h-72 overflow-hidden rounded border border-foreground/15">
            <Map
              defaultCenter={centro ?? CENTRO_PADRAO}
              defaultZoom={centro ? 16 : 12}
              mapId={MAP_ID}
              gestureHandling="greedy"
              clickableIcons={false}
              onClick={(e) => {
                const ll = e.detail.latLng;
                if (ll) setPos({ lat: ll.lat, lng: ll.lng });
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <Recentraliza centro={centro} />
              {pos && (
                <AdvancedMarker
                  position={pos}
                  draggable
                  onDragEnd={(e) => {
                    if (e.latLng) setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  }}
                >
                  <span className="block h-4 w-4 rounded-full border-2 border-background bg-primary shadow-md" />
                </AdvancedMarker>
              )}
            </Map>
          </div>
          <p className="text-xs text-muted-foreground">
            Toque no mapa ou arraste o pino para marcar o ponto exato.
          </p>
        </div>

        <Button type="submit" disabled={enviando}>
          {enviando ? "Cadastrando…" : "Cadastrar dojô"}
        </Button>
      </form>
    </main>
  );
}

export default function NovoDojoForm({ apiKey }: { apiKey: string }) {
  if (!apiKey) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-8">
        <p className="text-sm text-muted-foreground">Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</p>
      </main>
    );
  }
  return (
    <APIProvider apiKey={apiKey} language="pt-BR" region="BR">
      <Form />
    </APIProvider>
  );
}
