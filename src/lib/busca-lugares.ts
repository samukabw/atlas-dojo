// Cada busca do Places retorna no máximo 20 lugares, sem paginação no SDK JS.
// Com a busca em branco, um termo só deixaria de fora a maioria dos dojôs da região.
export const TERMOS_PADRAO = [
  "academia de artes marciais dojô",
  "dojô",
  "karatê",
  "judô",
  "jiu-jitsu",
  "aikido",
  "kendo",
  "taekwondo",
  "muay thai",
  "kung fu",
];

export function termosDeBusca(texto: string): string[] {
  const t = texto.trim();
  return t ? [t] : TERMOS_PADRAO;
}

export function unirPorId<T extends { id: string }>(listas: T[][]): T[] {
  const porId = new Map<string, T>();
  for (const lista of listas) {
    for (const item of lista) {
      if (!porId.has(item.id)) porId.set(item.id, item);
    }
  }
  return [...porId.values()];
}
