export { auth as middleware } from "@/lib/auth";
export const config = { matcher: [] }; // sem bloqueio global no MVP; autorização é feita nas server actions
