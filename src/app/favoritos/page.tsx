import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listarFavoritos } from "@/db/queries/favoritos";
import { Kamon } from "@/components/layout";

export default async function FavoritosPage() {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) redirect("/login");

  const favoritos = await listarFavoritos(usuarioId);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="registro-label border-b border-foreground/15 pb-2">Meus favoritos</h1>

      {favoritos.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">
          Você ainda não favoritou nenhum dojô. Explore o{" "}
          <Link className="font-semibold text-primary underline" href="/mapa">
            mapa
          </Link>{" "}
          e toque em “Favoritar”.
        </p>
      ) : (
        <div>
          {favoritos.map((f) => {
            const conteudo = (
              <>
                <Kamon className="mt-0.5 shrink-0 text-primary" size={22} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{f.nome}</p>
                  {f.endereco && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{f.endereco}</p>
                  )}
                </div>
                <span className="tnum shrink-0 text-sm text-muted-foreground">
                  {f.totalAvaliacoes > 0 ? `${f.notaMedia.toFixed(1)} · ${f.totalAvaliacoes}` : "sem nota"}
                </span>
              </>
            );
            return f.placeId ? (
              <Link
                key={f.dojoId}
                href={`/dojos/place/${f.placeId}`}
                className="flex items-center gap-3 border-b border-foreground/15 py-4 transition-colors hover:bg-accent/40"
              >
                {conteudo}
              </Link>
            ) : (
              <div key={f.dojoId} className="flex items-center gap-3 border-b border-foreground/15 py-4">
                {conteudo}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
