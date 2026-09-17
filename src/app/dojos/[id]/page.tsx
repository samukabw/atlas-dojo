import { notFound } from "next/navigation";
import { obterDojo } from "@/db/queries/dojos";
import { listarAvaliacoes } from "@/db/queries/avaliacoes";
import { ehFavoritoPorDojo } from "@/db/queries/favoritos";
import { ehResponsavelPorDojo } from "@/db/queries/sensei";
import { auth } from "@/lib/auth";
import { ReviewForm } from "./review-form";
import { excluirAvaliacaoAction } from "@/features/avaliacoes";
import { SeloNota, BotaoFavoritoDojo, RespostaSensei } from "@/components/dojo";

export default async function DojoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dojoId = Number(id);
  if (!Number.isFinite(dojoId)) notFound();

  const dojo = await obterDojo(dojoId);
  if (!dojo) notFound();

  const avaliacoes = await listarAvaliacoes(dojoId);
  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  const usuarioId = u?.id;
  const logado = usuarioId != null;
  const minha = avaliacoes.find((a) => a.usuarioId === usuarioId);

  const jaFavoritou = logado ? await ehFavoritoPorDojo(usuarioId!, dojoId) : false;
  const sensei = u?.perfil === "sensei" || u?.perfil === "admin";
  const podeResponder = Boolean(logado && sensei) && (await ehResponsavelPorDojo(usuarioId!, dojoId));

  const endereco =
    dojo.endereco ??
    [
      dojo.rua ? `${dojo.rua}${dojo.numero ? `, ${dojo.numero}` : ""}` : null,
      dojo.bairro,
      dojo.cidade,
    ]
      .filter(Boolean)
      .join(", ");

  async function excluir(formData: FormData) {
    "use server";
    await excluirAvaliacaoAction(formData);
  }

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

      <section className="mt-4 rounded border border-foreground/15 bg-card p-5 sm:p-6">
        <p className="tnum registro-label">Registro nº {String(dojo.id).padStart(6, "0")}</p>
        <div className="mt-3 flex items-start gap-4">
          <SeloNota nota={dojo.notaMedia} total={dojo.totalAvaliacoes} size={82} />
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
              {dojo.nome}
            </h1>
            {endereco && <p className="mt-1.5 text-sm text-muted-foreground">{endereco}</p>}
            <p className="tnum mt-3 text-sm">
              <span className="font-bold">{dojo.notaMedia.toFixed(1)}</span>
              <span className="text-muted-foreground"> · comunidade ({dojo.totalAvaliacoes})</span>
            </p>
            {dojo.descricao && <p className="mt-2 text-sm">{dojo.descricao}</p>}
            {dojo.contatos.length > 0 && (
              <ul className="mt-2 text-sm text-muted-foreground">
                {dojo.contatos.map((c, i) => (
                  <li key={i}>
                    {[c.telefone, c.email].filter(Boolean).join(" · ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {logado && (
          <div className="mt-4">
            <BotaoFavoritoDojo dojoId={dojoId} inicial={jaFavoritou} />
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="registro-label mb-3 border-b border-foreground/15 pb-2">Sua avaliação</h2>
        {logado ? (
          <ReviewForm
            dojoId={dojoId}
            inicial={minha ? { nota: minha.nota, descricao: minha.descricao ?? "" } : undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            <a className="font-semibold text-primary underline" href="/login">
              Entre
            </a>{" "}
            para carimbar sua avaliação.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="registro-label mb-1 border-b border-foreground/15 pb-2">
          Avaliações da comunidade
        </h2>
        {avaliacoes.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            Ainda sem avaliações - seja o primeiro a carimbar.
          </p>
        )}
        <div>
          {avaliacoes.map((a) => (
            <article key={a.id} className="flex gap-3 border-b border-foreground/15 py-4">
              <span className="tnum inline-flex h-fit items-center rounded bg-accent px-2 py-0.5 text-sm font-bold text-primary">
                {a.nota}
                <span className="ml-0.5 text-[0.65em] font-semibold text-muted-foreground">/5</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.autorNome}</p>
                {a.descricao && <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>}
                {a.usuarioId === usuarioId && (
                  <form action={excluir} className="mt-2">
                    <input type="hidden" name="avaliacaoId" value={a.id} />
                    <input type="hidden" name="dojoId" value={dojoId} />
                    <button
                      type="submit"
                      className="text-xs font-semibold text-muted-foreground underline transition-colors hover:text-primary"
                    >
                      Excluir minha avaliação
                    </button>
                  </form>
                )}
                <RespostaSensei
                  avaliacaoId={a.id}
                  respostaTexto={a.respostaTexto}
                  respostaAutor={a.respostaAutor}
                  podeResponder={podeResponder}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
