import { notFound } from "next/navigation";
import { obterDojo } from "@/db/queries/dojos";
import { listarAvaliacoes } from "@/db/queries/avaliacoes";
import { auth } from "@/lib/auth";
import { ReviewForm } from "./review-form";
import { excluirAvaliacaoAction } from "@/features/avaliacoes";
import { Button } from "@/components/ui/button";

export default async function DojoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dojoId = Number(id);
  const dojo = await obterDojo(dojoId);
  if (!dojo) notFound();

  const avaliacoes = await listarAvaliacoes(dojoId);
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  const minha = avaliacoes.find((a) => a.usuarioId === usuarioId);

  async function excluir(formData: FormData) {
    "use server";
    await excluirAvaliacaoAction(formData);
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{dojo.nome}</h1>
        <p className="text-muted-foreground">
          {dojo.rua}{dojo.numero ? `, ${dojo.numero}` : ""} - {dojo.bairro}, {dojo.cidade}
        </p>
        <p aria-label="nota média">
          ⭐ {dojo.notaMedia.toFixed(1)} ({dojo.totalAvaliacoes} avaliações)
        </p>
        {dojo.descricao && <p className="mt-2">{dojo.descricao}</p>}
        {dojo.contatos.length > 0 && (
          <ul className="mt-2 text-sm">
            {dojo.contatos.map((c, i) => (
              <li key={i}>{c.telefone} {c.email}</li>
            ))}
          </ul>
        )}
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Sua avaliação</h2>
        {usuarioId ? (
          <ReviewForm dojoId={dojoId} inicial={minha ? { nota: minha.nota, descricao: minha.descricao ?? "" } : undefined} />
        ) : (
          <p><a className="underline" href="/login">Entre</a> para avaliar.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Avaliações</h2>
        {avaliacoes.length === 0 && <p>Seja o primeiro a avaliar.</p>}
        {avaliacoes.map((a) => (
          <article key={a.id} className="border rounded p-3">
            <p className="font-medium">{a.autorNome} - ⭐ {a.nota}</p>
            {a.descricao && <p className="text-sm mt-1">{a.descricao}</p>}
            {a.usuarioId === usuarioId && (
              <form action={excluir} className="mt-2">
                <input type="hidden" name="avaliacaoId" value={a.id} />
                <input type="hidden" name="dojoId" value={dojoId} />
                <Button type="submit" variant="ghost" size="sm">Excluir</Button>
              </form>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
