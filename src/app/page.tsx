import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Kamon } from "@/components/layout";

const entradas = [
  {
    titulo: "Descoberta ao vivo",
    texto: "Dojôs reais do mapa, perto de você, agora - não uma lista desatualizada.",
  },
  {
    titulo: "Nota da comunidade",
    texto: "A avaliação de quem treina, carimbada ao lado da nota do Google.",
  },
  {
    titulo: "Carimbe a sua",
    texto: "Avalie um dojô e deixe seu registro para os próximos praticantes.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Kamon className="text-primary" size={64} />
        <p className="registro-label mt-6">Registro de dojôs · Brasil</p>
        <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
          Todo dojô, registrado num só mapa.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Encontre dojôs de artes marciais perto de você e confie na nota de quem já treinou.
        </p>
        <div className="mt-9 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button size="lg" nativeButton={false} render={<Link href="/mapa">Abrir o mapa</Link>} />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/registro">Criar conta</Link>}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        <div className="border-t border-foreground/15">
          {entradas.map((e) => (
            <div
              key={e.titulo}
              className="flex items-start gap-4 border-b border-foreground/15 py-5"
            >
              <Kamon className="mt-0.5 shrink-0 text-primary" size={22} />
              <div>
                <h3 className="text-base font-bold">{e.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{e.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
