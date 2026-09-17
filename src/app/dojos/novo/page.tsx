import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import NovoDojoForm from "./novo-dojo-form";

export default async function NovoDojoPage() {
  const session = await auth();
  const u = session?.user as { id?: number; perfil?: string } | undefined;
  if (!u?.id) redirect("/login");

  const ehSensei = u.perfil === "sensei" || u.perfil === "admin";
  if (!ehSensei) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-8">
        <p className="text-sm text-muted-foreground">Esta área é para senseis.</p>
      </main>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return <NovoDojoForm apiKey={apiKey} />;
}
