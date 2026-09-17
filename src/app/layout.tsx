import type { Metadata } from "next";
import { Libre_Franklin, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Marca, LogoutButton } from "@/components/layout";

const franklin = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dojo Atlas - Registro de dojôs",
  description: "Encontre dojôs de artes marciais perto de você e veja as avaliações da comunidade.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const perfil = (session?.user as { perfil?: string } | undefined)?.perfil;
  const ehSensei = perfil === "sensei" || perfil === "admin";

  return (
    <html
      lang="pt-BR"
      className={`${franklin.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-foreground/15 bg-background/85 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Marca />
            <div className="flex items-center gap-1">
              <Button variant="ghost" nativeButton={false} render={<Link href="/mapa">Mapa</Link>} />
              {session?.user ? (
                <>
                  {ehSensei && (
                    <Button
                      variant="ghost"
                      nativeButton={false}
                      render={<Link href="/meus-dojos">Meus dojôs</Link>}
                    />
                  )}
                  <Button
                    variant="ghost"
                    nativeButton={false}
                    render={<Link href="/favoritos">Favoritos</Link>}
                  />
                  <LogoutButton />
                </>
              ) : (
                <Button nativeButton={false} render={<Link href="/login">Entrar</Link>} />
              )}
            </div>
          </nav>
        </header>
        <div className="flex flex-1 flex-col min-h-0">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
