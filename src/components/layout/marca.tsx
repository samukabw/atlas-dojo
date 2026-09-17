import Link from "next/link";

/** Brasão circular (kamon) do registro: selo com losango de tatame ao centro. */
export function Kamon({ className = "", size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="18.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="14.6" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
      <path d="M20 7.6 L32.4 20 L20 32.4 L7.6 20 Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="2.4" fill="currentColor" />
    </svg>
  );
}

/** Marca completa: brasão + título do registro em caixa-alta espaçada. */
export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Kamon className="text-primary" size={30} />
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-extrabold uppercase tracking-[0.2em]">
          Dojo Atlas
        </span>
        <span className="mt-0.5 text-[0.58rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Registro de dojôs
        </span>
      </span>
    </Link>
  );
}
