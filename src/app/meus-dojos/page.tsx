import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listarDojosDoSensei } from "@/db/queries/sensei";
import { Kamon } from "@/components/layout";

export default async function MeusDojosPage() {
  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  if (!u?.id) redirect("/login");

  const ehSensei = u.perfil === "sensei" || u.perfil === "admin";
  const dojos = ehSensei ? await listarDojosDoSensei(u.id) : [];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="flex items-center justify-between border-b border-foreground/15 pb-2">
        <h1 className="registro-label">Meus dojôs</h1>
        {ehSensei && (
          <Link href="/dojos/novo" className="text-sm font-semibold text-primary underline">
            + Cadastrar dojô
          </Link>
        )}
      </div>

      {!ehSensei ? (
        <p className="py-8 text-sm text-muted-foreground">
          Esta área é para senseis. Altere seu perfil para sensei no cadastro para gerenciar dojôs.
        </p>
      ) : dojos.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">
          Você ainda não é responsável por nenhum dojô. Abra um dojô no{" "}
          <Link className="font-semibold text-primary underline" href="/mapa">
            mapa
          </Link>{" "}
          e toque em “Sou responsável por este dojô”.
        </p>
      ) : (
        <div>
          {dojos.map((d) => {
            const href = d.placeId ? `/dojos/place/${d.placeId}` : `/dojos/${d.dojoId}`;
            return (
              <Link
                key={d.dojoId}
                href={href}
                className="flex items-center gap-3 border-b border-foreground/15 py-4 transition-colors hover:bg-accent/40"
              >
                <Kamon className="mt-0.5 shrink-0 text-primary" size={22} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{d.nome}</p>
                  {(d.endereco || d.cidade) && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {d.endereco ?? d.cidade}
                    </p>
                  )}
                </div>
                <span className="tnum shrink-0 text-sm text-muted-foreground">
                  {d.totalAvaliacoes > 0 ? `${d.notaMedia.toFixed(1)} · ${d.totalAvaliacoes}` : "sem nota"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
