/**
 * Selo de nota da comunidade - a avaliação renderizada como carimbo circular.
 * Esmaecido quando ainda não há avaliações (estado vazio como convite, não erro).
 */
export function SeloNota({
  nota,
  total,
  size = 84,
}: {
  nota: number;
  total: number;
  size?: number;
}) {
  const temNota = total > 0;
  return (
    <div
      className="relative grid shrink-0 place-items-center text-primary"
      style={{ width: size, height: size, transform: "rotate(-6deg)" }}
      role="img"
      aria-label={
        temNota
          ? `Nota da comunidade ${nota.toFixed(1)} de 5, ${total} avaliações`
          : "Ainda sem avaliações da comunidade"
      }
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity={temNota ? 1 : 0.4}
        />
        <circle
          cx="50"
          cy="50"
          r="40.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity={temNota ? 0.55 : 0.25}
        />
      </svg>
      <div
        className="relative flex flex-col items-center leading-none"
        style={{ opacity: temNota ? 1 : 0.55 }}
      >
        <span className="tnum text-2xl font-extrabold">{temNota ? nota.toFixed(1) : "-"}</span>
        <span className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.18em]">
          comunidade
        </span>
      </div>
    </div>
  );
}
