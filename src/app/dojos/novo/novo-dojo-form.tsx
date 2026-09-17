"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { cadastrarDojoAction } from "@/features/sensei";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CENTRO = { lat: -23.5505, lng: -46.6333 };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

function Form() {
  const router = useRouter();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pos) {
      toast.error("Toque no mapa para marcar a localização do dojô");
      return;
    }
    setEnviando(true);
    const fd = new FormData(e.currentTarget);
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
        Para dojôs que ainda não aparecem no Google. Preencha os dados e toque no mapa para marcar
        onde ele fica.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="nome">Nome do dojô</Label>
          <Input id="nome" name="nome" required placeholder="Ex.: Academia Central de Karatê" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" name="endereco" placeholder="Rua, número, complemento" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" name="cidade" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" name="bairro" />
          </div>
        </div>

        <div className="space-y-1">
          <Label>
            Localização{" "}
            {pos && (
              <span className="tnum text-xs text-muted-foreground">
                ({pos.lat.toFixed(5)}, {pos.lng.toFixed(5)})
              </span>
            )}
          </Label>
          <div className="h-72 overflow-hidden rounded border border-foreground/15">
            <Map
              defaultCenter={CENTRO}
              defaultZoom={12}
              mapId={MAP_ID}
              gestureHandling="greedy"
              clickableIcons={false}
              onClick={(e) => {
                const ll = e.detail.latLng;
                if (ll) setPos({ lat: ll.lat, lng: ll.lng });
              }}
              style={{ width: "100%", height: "100%" }}
            >
              {pos && (
                <AdvancedMarker position={pos}>
                  <span className="block h-4 w-4 rounded-full border-2 border-background bg-primary shadow-md" />
                </AdvancedMarker>
              )}
            </Map>
          </div>
          <p className="text-xs text-muted-foreground">Toque no mapa para posicionar o pino.</p>
        </div>

        <Button type="submit" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar dojô"}
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
