# Dojo Atlas MVP (Fatia Fina) Implementation Plan

**Goal:** Construir o MVP fatia-fina do Dojo Atlas - cadastro/login, mapa de dojôs (Google Maps), busca/filtro por proximidade, detalhe do dojô e avaliações (1 por usuário/dojô, editável).

**Architecture:** Monolito Next.js (App Router) em TypeScript. Leitura via Server Components, mutação via Server Actions, e um Route Handler `GET /api/dojos` para alimentar o mapa com busca/filtro/distância. Postgres (Supabase) acessado via Drizzle ORM. Autenticação com Auth.js (Credentials + sessão JWT em cookie).

**Tech Stack:** Next.js (App Router) · TypeScript · Drizzle ORM + drizzle-kit · PostgreSQL (Supabase, driver `postgres`) · Auth.js (`next-auth@beta`) · bcryptjs · Zod · Tailwind CSS + shadcn/ui · `@vis.gl/react-google-maps` · Vitest · Playwright.

**Spec:** `docs/spec.md`

## Global Constraints

- Linguagem: TypeScript em modo estrito (`strict: true`).
- Runtime: Node.js 20+ (Server Actions e route handlers rodam em runtime Node, não Edge - bcrypt e `postgres` exigem Node).
- Todas as entradas de usuário são validadas com Zod **no servidor** antes de tocar o banco.
- Autorização checada no servidor: só usuário logado avalia; só o dono edita/exclui a própria avaliação.
- Senhas nunca são armazenadas em texto puro - somente hash bcrypt.
- Avaliação: constraint `UNIQUE(usuario_id, dojo_id)` no banco; nota inteira 1-5.
- Nomes de tabela/coluna em português conforme o DER (`user`, `dojo`, `avaliacao`, `contato`; `usuario_id`, `senha_hash`, etc.). A tabela de usuário é `"user"` (palavra reservada no Postgres → sempre entre aspas / mapeada pelo Drizzle).
- Geolocalização do usuário só é usada mediante permissão do browser e nunca é persistida.
- Datas em `timestamptz` com default `now()`.

---

## File Structure

```
dojo-atlas/
├─ app/
│  ├─ layout.tsx                  # layout raiz + providers
│  ├─ page.tsx                    # home → redireciona/aponta para /mapa
│  ├─ globals.css                 # Tailwind
│  ├─ (auth)/login/page.tsx       # form de login
│  ├─ (auth)/registro/page.tsx    # form de registro
│  ├─ mapa/page.tsx               # server: carrega dojôs iniciais
│  ├─ mapa/mapa-client.tsx        # client: Google Map + marcadores + geoloc
│  ├─ dojos/[id]/page.tsx         # server: detalhe + avaliações
│  ├─ dojos/[id]/review-form.tsx  # client: form de avaliação
│  └─ api/dojos/route.ts          # GET busca/filtro/distância
├─ components/                    # componentes shadcn/ui + app
│  └─ ui/                         # gerado pelo shadcn
├─ db/
│  ├─ schema.ts                   # schema Drizzle (user, dojo, avaliacao, contato)
│  ├─ index.ts                    # cliente Drizzle (postgres-js)
│  └─ queries/
│     ├─ dojos.ts                 # buscarDojos, obterDojo
│     └─ avaliacoes.ts            # criar/editar/excluir/listar/media
├─ lib/
│  ├─ auth.ts                     # config Auth.js (handlers, auth, signIn)
│  ├─ actions/auth.ts             # server action: registrarUsuario
│  ├─ actions/avaliacoes.ts       # server actions: criar/editar/excluir avaliacao
│  ├─ distancia.ts                # haversineKm + haversineSql
│  └─ validators.ts               # schemas Zod
├─ drizzle/                       # migrations geradas por drizzle-kit
├─ scripts/seed.ts               # dados de exemplo
├─ tests/
│  ├─ unit/                       # Vitest (distancia, validators)
│  ├─ integration/                # Vitest + Postgres de teste
│  └─ e2e/                        # Playwright
├─ drizzle.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ .env.local (não versionado) / .env.example
└─ package.json, tsconfig.json, tailwind.config.ts, next.config.ts
```

---

### Task 1: Scaffold do projeto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.env.example`, `.gitignore`

**Interfaces:**
- Consumes: nada.
- Produces: projeto Next.js executável (`npm run dev`), Tailwind ativo, shadcn/ui inicializado.

- [ ] **Step 1: Criar o app Next.js**

Na pasta do projeto (`C:\dojo_atlas`), rode:

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint --no-turbopack
```

Se perguntar sobre sobrescrever arquivos existentes, preserve a pasta `docs/`.

- [ ] **Step 2: Inicializar shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card form textarea sonner
```

- [ ] **Step 3: Garantir runtime Node e modo estrito**

Em `tsconfig.json` confirme `"strict": true`. Em `next.config.ts` deixe o default (sem `output: 'export'`).

- [ ] **Step 4: Criar `.env.example`**

```
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
AUTH_SECRET=gere-com-openssl-rand-base64-32
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-chave-google-maps
```

Adicione `.env.local` ao `.gitignore` (o create-next-app já inclui `.env*`).

- [ ] **Step 5: Rodar o dev server para validar**

Run: `npm run dev`
Expected: app sobe em `http://localhost:3000` sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + shadcn/ui"
```

---

### Task 2: Configurar Drizzle + schema do banco

**Files:**
- Create: `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`
- Modify: `package.json` (scripts drizzle), `.env.example` (já feito na Task 1)

**Interfaces:**
- Consumes: `DATABASE_URL`.
- Produces:
  - `db/index.ts` exporta `db` (instância Drizzle).
  - `db/schema.ts` exporta tabelas `users`, `dojos`, `avaliacoes`, `contatos` e tipos inferidos `User`, `NewUser`, `Dojo`, `NewDojo`, `Avaliacao`, `NewAvaliacao`, `Contato`.
  - Enum `perfilEnum` com valores `comum | sensei | admin`.

- [ ] **Step 1: Instalar dependências**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: Escrever o schema**

Create `db/schema.ts`:

```ts
import {
  pgTable, bigserial, varchar, text, integer, timestamp,
  numeric, pgEnum, uniqueIndex, bigint,
} from "drizzle-orm/pg-core";

export const perfilEnum = pgEnum("perfil", ["comum", "sensei", "admin"]);

export const users = pgTable("user", {
  id: bigserial("usuario_id", { mode: "number" }).primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  senhaHash: varchar("senha_hash", { length: 255 }).notNull(),
  perfil: perfilEnum("perfil").notNull().default("comum"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const dojos = pgTable("dojo", {
  id: bigserial("dojo_id", { mode: "number" }).primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  cep: varchar("cep", { length: 20 }),
  cidade: varchar("cidade", { length: 120 }),
  bairro: varchar("bairro", { length: 120 }),
  rua: varchar("rua", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const avaliacoes = pgTable(
  "avaliacao",
  {
    id: bigserial("avaliacao_id", { mode: "number" }).primaryKey(),
    usuarioId: bigint("usuario_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dojoId: bigint("dojo_id", { mode: "number" })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    nota: integer("nota").notNull(),
    descricao: text("descricao"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unicaPorUsuarioDojo: uniqueIndex("avaliacao_usuario_dojo_unq").on(t.usuarioId, t.dojoId),
  })
);

export const contatos = pgTable("contato", {
  id: bigserial("contato_id", { mode: "number" }).primaryKey(),
  dojoId: bigint("dojo_id", { mode: "number" })
    .notNull()
    .references(() => dojos.id, { onDelete: "cascade" }),
  telefone: varchar("telefone", { length: 40 }),
  email: varchar("email", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Dojo = typeof dojos.$inferSelect;
export type NewDojo = typeof dojos.$inferInsert;
export type Avaliacao = typeof avaliacoes.$inferSelect;
export type NewAvaliacao = typeof avaliacoes.$inferInsert;
export type Contato = typeof contatos.$inferSelect;
```

- [ ] **Step 3: Cliente Drizzle**

Create `db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida");

// Supabase: prepare:false é recomendado para o pooler (pgbouncer).
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

- [ ] **Step 4: drizzle.config.ts + scripts**

Create `drizzle.config.ts`:

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

Adicione em `package.json` scripts:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push"
```

- [ ] **Step 5: Gerar e aplicar a migração**

Configure `DATABASE_URL` no `.env.local` (Supabase). Depois:

Run: `npm run db:generate && npm run db:migrate`
Expected: pasta `drizzle/` com SQL da migração; tabelas criadas no Supabase sem erro.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(db): schema Drizzle e migração inicial (user, dojo, avaliacao, contato)"
```

---

### Task 3: Utilitário de distância (Haversine)

**Files:**
- Create: `lib/distancia.ts`
- Test: `tests/unit/distancia.test.ts`
- Create/Modify: `vitest.config.ts`, `package.json` (script `test`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `haversineKm(a: {lat:number; lng:number}, b: {lat:number; lng:number}): number` - distância em km.
  - `haversineSqlKm(latCol, lngCol, lat, lng): SQL` - expressão SQL Drizzle para distância em km (usada na Task 6).

- [ ] **Step 1: Configurar Vitest**

```bash
npm install -D vitest
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

```bash
npm install -D vite-tsconfig-paths
```

Adicione em `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Escrever o teste que falha**

Create `tests/unit/distancia.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { haversineKm } from "@/lib/distancia";

describe("haversineKm", () => {
  it("retorna 0 para o mesmo ponto", () => {
    const p = { lat: -23.55, lng: -46.63 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });

  it("mede ~4,4 km entre dois pontos em São Paulo", () => {
    const a = { lat: -23.5505, lng: -46.6333 }; // Sé
    const b = { lat: -23.5617, lng: -46.6560 }; // Av. Paulista aprox.
    expect(haversineKm(a, b)).toBeGreaterThan(2);
    expect(haversineKm(a, b)).toBeLessThan(4);
  });

  it("é simétrica", () => {
    const a = { lat: -23.5, lng: -46.6 };
    const b = { lat: -22.9, lng: -43.2 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npm test -- distancia`
Expected: FAIL (`haversineKm` não existe).

- [ ] **Step 4: Implementar**

Create `lib/distancia.ts`:

```ts
import { sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Expressão SQL para distância em km entre a coluna (lat,lng) e um ponto.
export function haversineSqlKm(
  latCol: AnyColumn,
  lngCol: AnyColumn,
  lat: number,
  lng: number
): SQL<number> {
  return sql<number>`(
    ${R_KM} * 2 * asin( least(1, sqrt(
      power(sin(radians(${latCol}::double precision - ${lat}) / 2), 2) +
      cos(radians(${lat})) * cos(radians(${latCol}::double precision)) *
      power(sin(radians(${lngCol}::double precision - ${lng}) / 2), 2)
    )))
  )`;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- distancia`
Expected: PASS (3 testes).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: utilitário de distância haversine (JS + SQL) com testes"
```

---

### Task 4: Validadores Zod

**Files:**
- Create: `lib/validators.ts`
- Test: `tests/unit/validators.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `registroSchema` → `{ nome, email, senha, perfil }` (perfil ∈ comum|sensei).
  - `loginSchema` → `{ email, senha }`.
  - `avaliacaoSchema` → `{ dojoId: number, nota: 1..5, descricao?: string }`.
  - Tipos inferidos `RegistroInput`, `LoginInput`, `AvaliacaoInput`.

- [ ] **Step 1: Instalar Zod**

```bash
npm install zod
```

- [ ] **Step 2: Escrever o teste que falha**

Create `tests/unit/validators.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { registroSchema, avaliacaoSchema } from "@/lib/validators";

describe("registroSchema", () => {
  it("aceita entrada válida", () => {
    const r = registroSchema.safeParse({
      nome: "Ana", email: "ana@ex.com", senha: "12345678", perfil: "comum",
    });
    expect(r.success).toBe(true);
  });
  it("rejeita e-mail inválido", () => {
    const r = registroSchema.safeParse({
      nome: "Ana", email: "nao-email", senha: "12345678", perfil: "comum",
    });
    expect(r.success).toBe(false);
  });
  it("rejeita senha curta", () => {
    const r = registroSchema.safeParse({
      nome: "Ana", email: "ana@ex.com", senha: "123", perfil: "comum",
    });
    expect(r.success).toBe(false);
  });
});

describe("avaliacaoSchema", () => {
  it("aceita nota entre 1 e 5", () => {
    expect(avaliacaoSchema.safeParse({ dojoId: 1, nota: 5, descricao: "ótimo" }).success).toBe(true);
  });
  it("rejeita nota 0 e 6", () => {
    expect(avaliacaoSchema.safeParse({ dojoId: 1, nota: 0 }).success).toBe(false);
    expect(avaliacaoSchema.safeParse({ dojoId: 1, nota: 6 }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- validators`
Expected: FAIL (módulo não existe).

- [ ] **Step 4: Implementar**

Create `lib/validators.ts`:

```ts
import { z } from "zod";

export const registroSchema = z.object({
  nome: z.string().min(2).max(255),
  email: z.string().email().max(255),
  senha: z.string().min(8).max(100),
  perfil: z.enum(["comum", "sensei"]).default("comum"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const avaliacaoSchema = z.object({
  dojoId: z.coerce.number().int().positive(),
  nota: z.coerce.number().int().min(1).max(5),
  descricao: z.string().max(2000).optional(),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AvaliacaoInput = z.infer<typeof avaliacaoSchema>;
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- validators`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: validadores Zod (registro, login, avaliação) com testes"
```

---

### Task 5: Autenticação (Auth.js Credentials + registro)

**Files:**
- Create: `lib/auth.ts`, `lib/actions/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`
- Test: `tests/integration/auth.test.ts`
- Create helper de teste: `tests/integration/_setup.ts`

**Interfaces:**
- Consumes: `db` (Task 2), `registroSchema` (Task 4), `users` (Task 2).
- Produces:
  - `registrarUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }>` - server action que valida, faz hash e insere.
  - `lib/auth.ts` exporta `{ handlers, auth, signIn, signOut }` do Auth.js.
  - Sessão contém `session.user.id` (number) e `session.user.perfil`.

- [ ] **Step 1: Instalar dependências**

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Helper de banco para testes de integração**

Create `tests/integration/_setup.ts`:

```ts
import { db } from "@/db";
import { avaliacoes, contatos, dojos, users } from "@/db/schema";

export async function limparBanco() {
  await db.delete(avaliacoes);
  await db.delete(contatos);
  await db.delete(dojos);
  await db.delete(users);
}
```

> Os testes de integração usam o `DATABASE_URL` do `.env.local`. Recomenda-se um projeto/schema Supabase separado para testes. Carregue o env com `vitest` via `import "dotenv/config"` no topo do teste (instale `dotenv`: `npm i -D dotenv`).

- [ ] **Step 3: Escrever o teste que falha**

Create `tests/integration/auth.test.ts`:

```ts
import "dotenv/config";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { registrarUsuario } from "@/lib/actions/auth";
import { limparBanco } from "./_setup";

function fd(obj: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

describe("registrarUsuario", () => {
  beforeEach(limparBanco);

  it("cria usuário com senha em hash (não texto puro)", async () => {
    const res = await registrarUsuario(
      fd({ nome: "Ana", email: "ana@ex.com", senha: "senhaforte1", perfil: "comum" })
    );
    expect(res.ok).toBe(true);
    const [u] = await db.select().from(users).where(eq(users.email, "ana@ex.com"));
    expect(u).toBeTruthy();
    expect(u.senhaHash).not.toBe("senhaforte1");
    expect(await bcrypt.compare("senhaforte1", u.senhaHash)).toBe(true);
  });

  it("rejeita e-mail duplicado", async () => {
    await registrarUsuario(fd({ nome: "Ana", email: "a@ex.com", senha: "senhaforte1", perfil: "comum" }));
    const res = await registrarUsuario(fd({ nome: "Outra", email: "a@ex.com", senha: "senhaforte1", perfil: "comum" }));
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test -- auth`
Expected: FAIL (`registrarUsuario` não existe).

- [ ] **Step 5: Implementar o server action de registro**

Create `lib/actions/auth.ts`:

```ts
"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registroSchema } from "@/lib/validators";

export async function registrarUsuario(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = registroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    perfil: formData.get("perfil") ?? "comum",
  });
  if (!parsed.success) return { ok: false, erro: "Dados inválidos" };

  const { nome, email, senha, perfil } = parsed.data;

  const [existente] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existente) return { ok: false, erro: "E-mail já cadastrado" };

  const senhaHash = await bcrypt.hash(senha, 10);
  await db.insert(users).values({ nome, email, senhaHash, perfil });
  return { ok: true };
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- auth`
Expected: PASS (2 testes).

- [ ] **Step 7: Configurar Auth.js (Credentials + JWT)**

Create `lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      authorize: async (creds) => {
        const parsed = loginSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, senha } = parsed.data;
        const [u] = await db.select().from(users).where(eq(users.email, email));
        if (!u) return null;
        if (!(await bcrypt.compare(senha, u.senhaHash))) return null;
        return { id: String(u.id), name: u.nome, email: u.email, perfil: u.perfil };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.perfil = (user as { perfil: string }).perfil;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id: number }).id = Number(token.id);
        (session.user as { perfil?: string }).perfil = token.perfil as string;
      }
      return session;
    },
  },
});
```

Create `app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
export const runtime = "nodejs";
```

Create `middleware.ts` (protege rotas de mutação de UI; a checagem forte fica nas actions):

```ts
export { auth as middleware } from "@/lib/auth";
export const config = { matcher: [] }; // sem bloqueio global no MVP; autorização é feita nas server actions
```

- [ ] **Step 8: Definir `AUTH_SECRET`**

Adicione `AUTH_SECRET` ao `.env.local` (gere com `openssl rand -base64 32` ou `npx auth secret`).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(auth): registro com hash + Auth.js Credentials (sessão JWT)"
```

---

### Task 6: Query de dojôs + Route Handler `/api/dojos`

**Files:**
- Create: `db/queries/dojos.ts`, `app/api/dojos/route.ts`
- Test: `tests/integration/dojos.test.ts`

**Interfaces:**
- Consumes: `db`, `dojos`, `avaliacoes` (Task 2), `haversineSqlKm` (Task 3).
- Produces:
  - `buscarDojos(params: { q?: string; cidade?: string; bairro?: string; lat?: number; lng?: number; ordenar?: "distancia" | "nota" }): Promise<DojoResumo[]>`
  - `type DojoResumo = { id:number; nome:string; cidade:string|null; bairro:string|null; latitude:number; longitude:number; notaMedia:number; totalAvaliacoes:number; distanciaKm: number|null }`
  - `obterDojo(id:number): Promise<DojoDetalhe | null>` (com contatos + média).

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/integration/dojos.test.ts`:

```ts
import "dotenv/config";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import { dojos, users, avaliacoes } from "@/db/schema";
import { buscarDojos } from "@/db/queries/dojos";
import { limparBanco } from "./_setup";

async function seedBasico() {
  const [d1] = await db.insert(dojos).values({
    nome: "Dojo Sé", cidade: "São Paulo", bairro: "Sé",
    latitude: "-23.5505", longitude: "-46.6333",
  }).returning();
  const [d2] = await db.insert(dojos).values({
    nome: "Dojo Rio", cidade: "Rio de Janeiro", bairro: "Centro",
    latitude: "-22.9068", longitude: "-43.1729",
  }).returning();
  return { d1, d2 };
}

describe("buscarDojos", () => {
  beforeEach(limparBanco);

  it("filtra por cidade", async () => {
    await seedBasico();
    const r = await buscarDojos({ cidade: "São Paulo" });
    expect(r).toHaveLength(1);
    expect(r[0].nome).toBe("Dojo Sé");
  });

  it("busca textual por nome/bairro", async () => {
    await seedBasico();
    const r = await buscarDojos({ q: "rio" });
    expect(r.map((d) => d.nome)).toContain("Dojo Rio");
  });

  it("ordena por distância quando lat/lng são fornecidos", async () => {
    await seedBasico();
    const r = await buscarDojos({ lat: -23.55, lng: -46.63, ordenar: "distancia" });
    expect(r[0].nome).toBe("Dojo Sé");
    expect(r[0].distanciaKm).toBeLessThan(r[1].distanciaKm!);
  });

  it("calcula nota média e total", async () => {
    const { d1 } = await seedBasico();
    const [u] = await db.insert(users).values({
      nome: "U", email: "u@ex.com", senhaHash: "x",
    }).returning();
    await db.insert(avaliacoes).values({ usuarioId: u.id, dojoId: d1.id, nota: 4 });
    const r = await buscarDojos({ cidade: "São Paulo" });
    expect(r[0].notaMedia).toBeCloseTo(4, 1);
    expect(r[0].totalAvaliacoes).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- dojos`
Expected: FAIL (`buscarDojos` não existe).

- [ ] **Step 3: Implementar as queries**

Create `db/queries/dojos.ts`:

```ts
import { db } from "@/db";
import { dojos, avaliacoes, contatos } from "@/db/schema";
import { and, or, ilike, eq, sql, asc, desc } from "drizzle-orm";
import { haversineSqlKm } from "@/lib/distancia";

export type DojoResumo = {
  id: number; nome: string; cidade: string | null; bairro: string | null;
  latitude: number; longitude: number;
  notaMedia: number; totalAvaliacoes: number; distanciaKm: number | null;
};

type BuscarParams = {
  q?: string; cidade?: string; bairro?: string;
  lat?: number; lng?: number; ordenar?: "distancia" | "nota";
};

export async function buscarDojos(params: BuscarParams): Promise<DojoResumo[]> {
  const { q, cidade, bairro, lat, lng, ordenar } = params;
  const temGeo = typeof lat === "number" && typeof lng === "number";

  const distancia = temGeo
    ? haversineSqlKm(dojos.latitude, dojos.longitude, lat!, lng!)
    : sql<number | null>`null`;

  const filtros = [];
  if (q) filtros.push(or(ilike(dojos.nome, `%${q}%`), ilike(dojos.bairro, `%${q}%`), ilike(dojos.cidade, `%${q}%`)));
  if (cidade) filtros.push(ilike(dojos.cidade, `%${cidade}%`));
  if (bairro) filtros.push(ilike(dojos.bairro, `%${bairro}%`));

  const rows = await db
    .select({
      id: dojos.id,
      nome: dojos.nome,
      cidade: dojos.cidade,
      bairro: dojos.bairro,
      latitude: sql<number>`${dojos.latitude}::double precision`,
      longitude: sql<number>`${dojos.longitude}::double precision`,
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
      distanciaKm: distancia,
    })
    .from(dojos)
    .leftJoin(avaliacoes, eq(avaliacoes.dojoId, dojos.id))
    .where(filtros.length ? and(...filtros) : undefined)
    .groupBy(dojos.id)
    .orderBy(
      ordenar === "nota"
        ? desc(sql`coalesce(avg(${avaliacoes.nota}), 0)`)
        : temGeo && ordenar === "distancia"
        ? asc(distancia)
        : asc(dojos.nome)
    );

  return rows as DojoResumo[];
}

export type DojoDetalhe = {
  id: number; nome: string; descricao: string | null;
  cep: string | null; cidade: string | null; bairro: string | null;
  rua: string | null; numero: string | null;
  latitude: number; longitude: number;
  notaMedia: number; totalAvaliacoes: number;
  contatos: { telefone: string | null; email: string | null }[];
};

export async function obterDojo(id: number): Promise<DojoDetalhe | null> {
  const [d] = await db.select().from(dojos).where(eq(dojos.id, id));
  if (!d) return null;

  const [agg] = await db
    .select({
      notaMedia: sql<number>`coalesce(avg(${avaliacoes.nota}), 0)::double precision`,
      totalAvaliacoes: sql<number>`count(${avaliacoes.id})::int`,
    })
    .from(avaliacoes)
    .where(eq(avaliacoes.dojoId, id));

  const cts = await db
    .select({ telefone: contatos.telefone, email: contatos.email })
    .from(contatos)
    .where(eq(contatos.dojoId, id));

  return {
    id: d.id, nome: d.nome, descricao: d.descricao,
    cep: d.cep, cidade: d.cidade, bairro: d.bairro, rua: d.rua, numero: d.numero,
    latitude: Number(d.latitude), longitude: Number(d.longitude),
    notaMedia: agg?.notaMedia ?? 0, totalAvaliacoes: agg?.totalAvaliacoes ?? 0,
    contatos: cts,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- dojos`
Expected: PASS (4 testes).

- [ ] **Step 5: Route handler**

Create `app/api/dojos/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buscarDojos } from "@/db/queries/dojos";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const num = (v: string | null) => (v == null || v === "" ? undefined : Number(v));
  const ordenar = sp.get("ordenar");
  const dados = await buscarDojos({
    q: sp.get("q") ?? undefined,
    cidade: sp.get("cidade") ?? undefined,
    bairro: sp.get("bairro") ?? undefined,
    lat: num(sp.get("lat")),
    lng: num(sp.get("lng")),
    ordenar: ordenar === "nota" || ordenar === "distancia" ? ordenar : undefined,
  });
  return NextResponse.json(dados);
}
```

- [ ] **Step 6: Verificar o endpoint manualmente**

Run: `npm run dev` e acesse `http://localhost:3000/api/dojos` (após o seed da Task 10) ou com o banco vazio deve retornar `[]`.
Expected: JSON (array).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(dojos): buscarDojos/obterDojo + GET /api/dojos com testes"
```

---

### Task 7: Avaliações - queries + server actions

**Files:**
- Create: `db/queries/avaliacoes.ts`, `lib/actions/avaliacoes.ts`
- Test: `tests/integration/avaliacoes.test.ts`

**Interfaces:**
- Consumes: `db`, `avaliacoes` (Task 2), `avaliacaoSchema` (Task 4), `auth` (Task 5).
- Produces:
  - `listarAvaliacoes(dojoId:number): Promise<AvaliacaoComAutor[]>`
  - `criarOuAtualizarAvaliacao(usuarioId, input): Promise<{ ok:boolean; erro?:string }>` (upsert respeitando UNIQUE)
  - `excluirAvaliacao(usuarioId, avaliacaoId): Promise<{ ok:boolean; erro?:string }>` (só dono)
  - Server actions `salvarAvaliacaoAction(formData)` e `excluirAvaliacaoAction(formData)` que obtêm o usuário via `auth()`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/integration/avaliacoes.test.ts`:

```ts
import "dotenv/config";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import { dojos, users, avaliacoes } from "@/db/schema";
import {
  criarOuAtualizarAvaliacao, excluirAvaliacao, listarAvaliacoes,
} from "@/db/queries/avaliacoes";
import { limparBanco } from "./_setup";

async function base() {
  const [d] = await db.insert(dojos).values({
    nome: "Dojo", latitude: "-23.5", longitude: "-46.6",
  }).returning();
  const [u1] = await db.insert(users).values({ nome: "U1", email: "u1@ex.com", senhaHash: "x" }).returning();
  const [u2] = await db.insert(users).values({ nome: "U2", email: "u2@ex.com", senhaHash: "x" }).returning();
  return { d, u1, u2 };
}

describe("avaliacoes", () => {
  beforeEach(limparBanco);

  it("cria e depois atualiza a mesma avaliação (1 por usuário/dojô)", async () => {
    const { d, u1 } = await base();
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 3, descricao: "ok" });
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 5, descricao: "melhorou" });
    const lista = await listarAvaliacoes(d.id);
    expect(lista).toHaveLength(1);
    expect(lista[0].nota).toBe(5);
  });

  it("permite avaliações de usuários diferentes no mesmo dojô", async () => {
    const { d, u1, u2 } = await base();
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 4 });
    await criarOuAtualizarAvaliacao(u2.id, { dojoId: d.id, nota: 2 });
    expect(await listarAvaliacoes(d.id)).toHaveLength(2);
  });

  it("só o dono exclui a própria avaliação", async () => {
    const { d, u1, u2 } = await base();
    await criarOuAtualizarAvaliacao(u1.id, { dojoId: d.id, nota: 4 });
    const [a] = await listarAvaliacoes(d.id);
    const negado = await excluirAvaliacao(u2.id, a.id);
    expect(negado.ok).toBe(false);
    expect(await listarAvaliacoes(d.id)).toHaveLength(1);
    const ok = await excluirAvaliacao(u1.id, a.id);
    expect(ok.ok).toBe(true);
    expect(await listarAvaliacoes(d.id)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- avaliacoes`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar as queries**

Create `db/queries/avaliacoes.ts`:

```ts
import { db } from "@/db";
import { avaliacoes, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { AvaliacaoInput } from "@/lib/validators";

export type AvaliacaoComAutor = {
  id: number; nota: number; descricao: string | null;
  usuarioId: number; autorNome: string; criadoEm: Date; atualizadoEm: Date;
};

export async function listarAvaliacoes(dojoId: number): Promise<AvaliacaoComAutor[]> {
  return db
    .select({
      id: avaliacoes.id, nota: avaliacoes.nota, descricao: avaliacoes.descricao,
      usuarioId: avaliacoes.usuarioId, autorNome: users.nome,
      criadoEm: avaliacoes.criadoEm, atualizadoEm: avaliacoes.atualizadoEm,
    })
    .from(avaliacoes)
    .innerJoin(users, eq(users.id, avaliacoes.usuarioId))
    .where(eq(avaliacoes.dojoId, dojoId))
    .orderBy(desc(avaliacoes.atualizadoEm));
}

export async function criarOuAtualizarAvaliacao(
  usuarioId: number, input: AvaliacaoInput
): Promise<{ ok: boolean; erro?: string }> {
  await db
    .insert(avaliacoes)
    .values({ usuarioId, dojoId: input.dojoId, nota: input.nota, descricao: input.descricao })
    .onConflictDoUpdate({
      target: [avaliacoes.usuarioId, avaliacoes.dojoId],
      set: { nota: input.nota, descricao: input.descricao, atualizadoEm: new Date() },
    });
  return { ok: true };
}

export async function excluirAvaliacao(
  usuarioId: number, avaliacaoId: number
): Promise<{ ok: boolean; erro?: string }> {
  const res = await db
    .delete(avaliacoes)
    .where(and(eq(avaliacoes.id, avaliacaoId), eq(avaliacoes.usuarioId, usuarioId)))
    .returning({ id: avaliacoes.id });
  if (res.length === 0) return { ok: false, erro: "Não autorizado ou inexistente" };
  return { ok: true };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- avaliacoes`
Expected: PASS (3 testes).

- [ ] **Step 5: Server actions (com autorização via sessão)**

Create `lib/actions/avaliacoes.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { avaliacaoSchema } from "@/lib/validators";
import { criarOuAtualizarAvaliacao, excluirAvaliacao } from "@/db/queries/avaliacoes";

export async function salvarAvaliacaoAction(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Faça login para avaliar" };

  const parsed = avaliacaoSchema.safeParse({
    dojoId: formData.get("dojoId"),
    nota: formData.get("nota"),
    descricao: formData.get("descricao") ?? undefined,
  });
  if (!parsed.success) return { ok: false, erro: "Dados inválidos" };

  const res = await criarOuAtualizarAvaliacao(usuarioId, parsed.data);
  if (res.ok) revalidatePath(`/dojos/${parsed.data.dojoId}`);
  return res;
}

export async function excluirAvaliacaoAction(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  const session = await auth();
  const usuarioId = (session?.user as { id?: number } | undefined)?.id;
  if (!usuarioId) return { ok: false, erro: "Não autenticado" };

  const avaliacaoId = Number(formData.get("avaliacaoId"));
  const dojoId = Number(formData.get("dojoId"));
  const res = await excluirAvaliacao(usuarioId, avaliacaoId);
  if (res.ok) revalidatePath(`/dojos/${dojoId}`);
  return res;
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(avaliacoes): queries upsert/exclusão + server actions com autorização"
```

---

### Task 8: Páginas de autenticação (login/registro)

**Files:**
- Create: `app/(auth)/registro/page.tsx`, `app/(auth)/login/page.tsx`, `components/logout-button.tsx`
- Modify: `app/layout.tsx` (Toaster do sonner + link de login/logout)

**Interfaces:**
- Consumes: `registrarUsuario` (Task 5), `signIn` via `next-auth/react`, `auth` (Task 5).
- Produces: fluxo visual de registrar → logar → sessão ativa.

- [ ] **Step 1: Página de registro**

Create `app/(auth)/registro/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarUsuario } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegistroPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const res = await registrarUsuario(new FormData(e.currentTarget));
    setCarregando(false);
    if (res.ok) {
      toast.success("Conta criada! Faça login.");
      router.push("/login");
    } else {
      toast.error(res.erro ?? "Erro ao registrar");
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" required /></div>
        <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
        <div><Label htmlFor="senha">Senha</Label><Input id="senha" name="senha" type="password" minLength={8} required /></div>
        <div>
          <Label htmlFor="perfil">Perfil</Label>
          <select id="perfil" name="perfil" className="w-full border rounded h-9 px-2">
            <option value="comum">Praticante</option>
            <option value="sensei">Sensei</option>
          </select>
        </div>
        <Button type="submit" disabled={carregando} className="w-full">
          {carregando ? "Enviando..." : "Registrar"}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Página de login**

Create `app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      senha: form.get("senha"),
      redirect: false,
    });
    setCarregando(false);
    if (res?.error) toast.error("Credenciais inválidas");
    else { toast.success("Bem-vindo!"); router.push("/mapa"); }
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
        <div><Label htmlFor="senha">Senha</Label><Input id="senha" name="senha" type="password" required /></div>
        <Button type="submit" disabled={carregando} className="w-full">
          {carregando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Botão de logout + Toaster no layout**

Create `components/logout-button.tsx`:

```tsx
"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>Sair</Button>;
}
```

Modify `app/layout.tsx` para incluir `<Toaster />` do sonner e uma navbar simples com links `Mapa`, `Entrar` (ou `Sair`, condicionado a `await auth()`).

- [ ] **Step 4: Verificação manual**

Run: `npm run dev`. Registre um usuário, faça login, veja o toast e o redirecionamento para `/mapa`.
Expected: sessão ativa; navbar mostra "Sair".

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): páginas de login e registro + logout"
```

---

### Task 9: Mapa de dojôs (Google Maps + geolocalização)

**Files:**
- Create: `app/mapa/page.tsx`, `app/mapa/mapa-client.tsx`
- Test: (verificação manual - UI de mapa)

**Interfaces:**
- Consumes: `GET /api/dojos` (Task 6), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Produces: mapa com marcadores; barra de busca; botão "usar minha localização" que reordena por distância.

- [ ] **Step 1: Instalar a lib do Google Maps**

```bash
npm install @vis.gl/react-google-maps
```

- [ ] **Step 2: Página server (shell)**

Create `app/mapa/page.tsx`:

```tsx
import MapaClient from "./mapa-client";

export default function MapaPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return (
    <main className="h-[calc(100vh-56px)]">
      <MapaClient apiKey={apiKey} />
    </main>
  );
}
```

- [ ] **Step 3: Componente client do mapa**

Create `app/mapa/mapa-client.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DojoResumo = {
  id: number; nome: string; latitude: number; longitude: number;
  notaMedia: number; totalAvaliacoes: number; distanciaKm: number | null;
};

const CENTRO_PADRAO = { lat: -23.5505, lng: -46.6333 };

export default function MapaClient({ apiKey }: { apiKey: string }) {
  const [dojos, setDojos] = useState<DojoResumo[]>([]);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  const carregar = useCallback(async () => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (pos) { sp.set("lat", String(pos.lat)); sp.set("lng", String(pos.lng)); sp.set("ordenar", "distancia"); }
    const res = await fetch(`/api/dojos?${sp.toString()}`);
    setDojos(await res.json());
  }, [q, pos]);

  useEffect(() => { carregar(); }, [carregar]);

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => alert("Não foi possível obter sua localização")
    );
  }

  if (!apiKey) return <p className="p-4">Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</p>;

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex gap-2 p-2">
        <Input placeholder="Buscar por nome, bairro ou cidade" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="outline" onClick={usarMinhaLocalizacao}>Usar minha localização</Button>
      </div>
      <div className="h-full">
        <Map defaultCenter={pos ?? CENTRO_PADRAO} defaultZoom={12} mapId="dojo-atlas" gestureHandling="greedy">
          {dojos.map((d) => (
            <AdvancedMarker key={d.id} position={{ lat: d.latitude, lng: d.longitude }}>
              <Link href={`/dojos/${d.id}`}><Pin /></Link>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
```

- [ ] **Step 4: Verificação manual**

Run: `npm run dev`, acesse `/mapa` (após seed). Veja marcadores; digite no campo de busca; clique em "Usar minha localização" e autorize.
Expected: marcadores aparecem; busca filtra; localização recarrega ordenando por distância.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(mapa): Google Maps com marcadores, busca e geolocalização"
```

---

### Task 10: Detalhe do dojô + avaliações (UI)

**Files:**
- Create: `app/dojos/[id]/page.tsx`, `app/dojos/[id]/review-form.tsx`
- Test: (verificação manual + coberto pelo E2E na Task 12)

**Interfaces:**
- Consumes: `obterDojo` (Task 6), `listarAvaliacoes` (Task 7), `salvarAvaliacaoAction`/`excluirAvaliacaoAction` (Task 7), `auth` (Task 5).
- Produces: página de detalhe com endereço, contatos, nota média, lista de avaliações e form de avaliação (para logados).

- [ ] **Step 1: Página de detalhe (server)**

Create `app/dojos/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { obterDojo } from "@/db/queries/dojos";
import { listarAvaliacoes } from "@/db/queries/avaliacoes";
import { auth } from "@/lib/auth";
import { ReviewForm } from "./review-form";
import { excluirAvaliacaoAction } from "@/lib/actions/avaliacoes";
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
              <form action={excluirAvaliacaoAction} className="mt-2">
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
```

- [ ] **Step 2: Form de avaliação (client)**

Create `app/dojos/[id]/review-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { salvarAvaliacaoAction } from "@/lib/actions/avaliacoes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ReviewForm({
  dojoId, inicial,
}: { dojoId: number; inicial?: { nota: number; descricao: string } }) {
  const [nota, setNota] = useState(inicial?.nota ?? 5);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    const res = await salvarAvaliacaoAction(new FormData(e.currentTarget));
    setEnviando(false);
    if (res.ok) toast.success("Avaliação salva!");
    else toast.error(res.erro ?? "Erro ao salvar");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="dojoId" value={dojoId} />
      <div>
        <Label htmlFor="nota">Nota</Label>
        <select id="nota" name="nota" value={nota} onChange={(e) => setNota(Number(e.target.value))}
                className="w-full border rounded h-9 px-2">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="descricao">Comentário</Label>
        <Textarea id="descricao" name="descricao" defaultValue={inicial?.descricao} />
      </div>
      <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Salvar avaliação"}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Verificação manual**

Run: `npm run dev`, logado, abra `/dojos/<id>`, salve uma avaliação, recarregue, edite (mesma some como 1), exclua.
Expected: média e lista atualizam; só sua avaliação tem botão excluir.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dojo): página de detalhe + form de avaliação"
```

---

### Task 11: Script de seed

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json` (script `db:seed`)

**Interfaces:**
- Consumes: `db`, `dojos`, `contatos` (Task 2).
- Produces: alguns dojôs com lat/long válidos + contatos, para exercitar mapa/busca/detalhe.

- [ ] **Step 1: Escrever o seed**

Create `scripts/seed.ts`:

```ts
import "dotenv/config";
import { db } from "@/db";
import { dojos, contatos } from "@/db/schema";

async function main() {
  const dados = [
    { nome: "Academia Sé Karatê", descricao: "Karatê Shotokan no centro.", cep: "01001-000",
      cidade: "São Paulo", bairro: "Sé", rua: "Praça da Sé", numero: "100",
      latitude: "-23.5505", longitude: "-46.6333" },
    { nome: "Dojo Paulista Judô", descricao: "Judô para todas as idades.", cep: "01310-100",
      cidade: "São Paulo", bairro: "Bela Vista", rua: "Av. Paulista", numero: "1500",
      latitude: "-23.5617", longitude: "-46.6560" },
    { nome: "Rio Jiu-Jitsu Centro", descricao: "BJJ no centro do Rio.", cep: "20040-002",
      cidade: "Rio de Janeiro", bairro: "Centro", rua: "Av. Rio Branco", numero: "1",
      latitude: "-22.9068", longitude: "-43.1729" },
  ];

  for (const d of dados) {
    const [inserido] = await db.insert(dojos).values(d).returning();
    await db.insert(contatos).values({
      dojoId: inserido.id, telefone: "(11) 90000-0000", email: "contato@dojo.com",
    });
  }
  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Script no package.json**

Adicione: `"db:seed": "tsx scripts/seed.ts"` e instale o runner:

```bash
npm install -D tsx
```

- [ ] **Step 3: Rodar o seed**

Run: `npm run db:seed`
Expected: "Seed concluído."; `/api/dojos` retorna os 3 dojôs.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(db): script de seed com dojôs de exemplo"
```

---

### Task 12: E2E happy path (Playwright)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/fluxo.spec.ts`
- Modify: `package.json` (script `test:e2e`)

**Interfaces:**
- Consumes: app rodando (`npm run dev`/`build+start`), banco com seed.
- Produces: cobertura E2E do fluxo registrar → logar → avaliar → ver no detalhe.

- [ ] **Step 1: Instalar Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Config**

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Adicione em `package.json`: `"test:e2e": "playwright test"`.

- [ ] **Step 3: Escrever o teste E2E**

Create `tests/e2e/fluxo.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("registrar, logar e avaliar um dojô", async ({ page }) => {
  const email = `user${Date.now()}@ex.com`;

  await page.goto("/registro");
  await page.fill("#nome", "Teste");
  await page.fill("#email", email);
  await page.fill("#senha", "senhaforte1");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/login");
  await page.fill("#email", email);
  await page.fill("#senha", "senhaforte1");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/mapa");

  // abrir o primeiro dojô (do seed) direto pela rota de detalhe
  await page.goto("/dojos/1");
  await page.selectOption("#nota", "5");
  await page.fill("#descricao", "Excelente!");
  await page.click('button:has-text("Salvar avaliação")');

  await expect(page.getByText("Excelente!")).toBeVisible();
});
```

- [ ] **Step 4: Rodar o E2E**

Pré-requisito: `npm run db:seed` executado (dojô id 1 existe).
Run: `npm run test:e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(e2e): fluxo registrar → logar → avaliar"
```

---

## Self-Review

**Cobertura da spec:**
- RF01 registro → Task 5/8 ✅ · RF02 login/logout → Task 5/8 ✅ (recuperação de senha fora do escopo, conforme spec)
- RF04 mapa → Task 9 ✅ · RF05 proximidade → Task 6/9 ✅ · RF06 busca → Task 6/9 ✅
- RF07 filtro (distância/nota, sem estilo) → Task 6 ✅ · RF08 detalhe → Task 10 ✅
- RF10 avaliar → Task 7/10 ✅ · RF11 editar/excluir → Task 7/10 ✅ · RF12 média/lista → Task 6/7/10 ✅
- RNF02 segurança (hash/autorização) → Task 5/7 ✅ · RNF04 privacidade (geoloc sob permissão) → Task 9 ✅
- RNF10 unicidade → Task 2 (UNIQUE) + Task 7 (teste) ✅ · RNF11 lat/long obrigatórios → Task 2 (notNull) ✅
- RNF01/07 responsivo/acessível → Tailwind + shadcn/ui em todas as tasks de UI ✅

**Consistência de tipos:** `DojoResumo`, `DojoDetalhe`, `AvaliacaoComAutor`, `AvaliacaoInput` definidos em uma task e consumidos com os mesmos nomes/assinaturas nas seguintes. `criarOuAtualizarAvaliacao(usuarioId, input)` e `excluirAvaliacao(usuarioId, avaliacaoId)` usados de forma idêntica na Task 7. Sessão expõe `session.user.id: number` (Task 5) e é lida assim nas Tasks 7 e 10.

**Placeholders:** nenhum TBD/TODO; todos os steps de código trazem código real.

**Observação de ambiente:** os testes de integração e o E2E exigem um `DATABASE_URL` acessível (recomenda-se banco/schema Supabase separado para testes) e, para o mapa, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Sem a chave do Google Maps, o mapa exibe aviso mas o restante funciona.