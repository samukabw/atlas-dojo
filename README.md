# 🥋 Dojo Atlas

**O registro dos dojôs do Brasil num só mapa.** Encontre dojôs de artes marciais perto de você, descubra lugares reais direto do mapa e confie na nota de quem já treinou.

O Dojo Atlas é um aplicativo web que combina a **descoberta de lugares reais** (via Google Places) com uma **camada de avaliações da própria comunidade de praticantes** - algo que nem o Google Maps sozinho nem um cadastro manual entregam.

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack e arquitetura](#stack-e-arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Rodando localmente](#rodando-localmente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes](#testes)
- [Deploy na Vercel](#deploy-na-vercel)
- [Roadmap](#roadmap)

---

## Sobre o projeto

A proposta é resolver uma pergunta simples de um praticante: **"onde eu treino artes marciais perto de mim?"** - e responder com informação confiável.

O diferencial é o modelo **híbrido**:

1. O mapa descobre **dojôs reais** ao vivo através da **Google Places API** (como o Google Maps faz).
2. Cada avaliação que um usuário deixa é gravada **no banco do próprio Dojo Atlas**, ligada ao `place_id` do lugar no Google.
3. A tela de detalhe mostra a **nota do Google** lado a lado com a **nota da comunidade** de praticantes.

O produto atende dois públicos: **praticantes** (descobrem, comparam e avaliam) e **senseis/donos de dojô** (representam seus dojôs - recursos de gestão em evolução).

> A identidade visual segue o mundo **"Registro / Menjô"**: papel osso, tinta preto-ferro e um único vermelhão de selo (_hanko_), tratando cada dojô como uma entrada carimbada num registro oficial.

---

## Funcionalidades

- 🔐 **Cadastro e login** de usuários (praticante ou sensei), com senha criptografada (bcrypt) e sessão por cookie.
- 🗺️ **Mapa interativo** com dojôs reais do Google Places.
- 📍 **"Perto de mim"** - descoberta por geolocalização (com permissão do navegador).
- 🔎 **Busca por texto** - cidade, bairro ou modalidade (ex.: _"dojôs em Olinda"_, _"jiu-jitsu"_).
- 🏯 **Detalhe do dojô** - fotos, horários, telefone/site, endereço, nota do Google e da comunidade, botão "Como chegar" e compartilhar.
- ⭐ **Avaliações da comunidade** - nota (1-5) + comentário, **uma por usuário por lugar**, editável.
- ✏️ **Editar / excluir** a própria avaliação (somente o dono).
- 📊 **Nota média** da comunidade calculada por lugar.
- 💗 **Favoritos** - salvar dojôs e ver a lista em "Meus favoritos".
- 🥷 **Lado do sensei** - reivindicar um dojô do mapa ou **cadastrar um dojô novo** (praia, praça, quintal, espaço compartilhado) marcando o ponto no mapa; ver os seus em "Meus dojôs".

---

## Stack e arquitetura

Monólito **Next.js (App Router)** em TypeScript: um único app cuida da interface e do backend.

- **Leitura** → Server Components e Route Handlers
- **Mutação** → Server Actions (`"use server"`)
- **Descoberta de lugares** → Google Places no cliente
- **APIs internas** → `/api/dojos`, `/api/avaliacoes`, `/api/auth/[...nextauth]`

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) · React 19 · TypeScript (strict) |
| **UI / estilo** | Tailwind CSS v4 · shadcn/ui (sobre Base UI) · lucide-react · sonner · fonte Libre Franklin |
| **Autenticação** | Auth.js (NextAuth v5) - Credentials + sessão JWT · bcryptjs |
| **Banco de dados** | PostgreSQL (Supabase) · Drizzle ORM · driver `postgres` · migrações com drizzle-kit |
| **Mapa / dados** | Google Maps JavaScript API + Places API (New) via `@vis.gl/react-google-maps` |
| **Validação** | Zod |
| **Testes** | Vitest (unitários + integração) |
| **Hospedagem (alvo)** | Vercel |

---

## Modelo de dados

Definido em [`src/db/schema.ts`](src/db/schema.ts) e versionado com migrações Drizzle em [`drizzle/`](drizzle/).

| Tabela | Descrição |
|---|---|
| **`user`** | `id`, `nome`, `email` (único), `senha_hash`, `perfil` (`comum` / `sensei` / `admin`), `criado_em` |
| **`dojo`** | dados do lugar, `latitude`/`longitude`, **`place_id`** (único - liga ao Google Places) e `endereco` |
| **`avaliacao`** | `nota` (1-5), `descricao`, FKs para `user` e `dojo`, **UNIQUE(usuario_id, dojo_id)** - 1 avaliação por usuário/lugar |
| **`contato`** | `telefone`, `email`, FK para `dojo` |
| **`favorito`** | FKs para `user` e `dojo`, **UNIQUE(usuario_id, dojo_id)** - dojôs favoritados |
| **`dojo_sensei`** | FKs para `dojo` e `user`, **UNIQUE(dojo_id, usuario_id)** - vínculo N:N sensei ↔ dojô |

> Detalhes completos em [`docs/schema.md`](docs/schema.md) e requisitos em [`docs/requisitos.md`](docs/requisitos.md).

---

## Estrutura de pastas

Organização **feature-based** com prefixo `src/` e barrels (`index.ts`) por pasta:

```
dojo_atlas/
├─ src/
│  ├─ app/                           # rotas (App Router) por domínio
│  │  ├─ (auth)/login, (auth)/registro
│  │  ├─ mapa/                       # mapa (Google Places + dojôs manuais)
│  │  ├─ dojos/place/[placeId]/      # detalhe de um lugar do Google + avaliações
│  │  ├─ dojos/[id]/                 # detalhe de um dojô do banco (manual)
│  │  ├─ dojos/novo/                 # sensei cadastra um dojô novo
│  │  ├─ favoritos/                  # "Meus favoritos"
│  │  ├─ meus-dojos/                 # dojôs pelos quais o sensei é responsável
│  │  └─ api/{dojos,dojos/manuais,avaliacoes,favoritos,sensei,auth}
│  ├─ components/                    # UI (client), agrupada por feature
│  │  ├─ ui/                         # primitivos shadcn/ui
│  │  ├─ layout/                     # marca (kamon) + logout
│  │  └─ dojo/                       # selo de nota, favoritar, reivindicar
│  ├─ features/                      # lógica de negócio (server actions)
│  │  ├─ auth/ · avaliacoes/ · favoritos/ · sensei/   (actions.ts + index.ts)
│  ├─ db/                            # Drizzle: schema.ts, index.ts, queries/
│  └─ lib/                           # auth.ts, validators.ts, distancia.ts, utils.ts
├─ drizzle/                          # migrações geradas
├─ scripts/seed.ts                   # dados de exemplo
├─ tests/                            # Vitest (unit + integração)
└─ docs/                             # schema.md, requisitos.md, spec e plano
```

O alias `@/*` aponta para `src/*` (ex.: `@/features/auth`, `@/components/dojo`).

---

## Pré-requisitos

- **Node.js 20+**
- Conta no **Supabase** (banco PostgreSQL)
- **Chave de API do Google Maps** com **Maps JavaScript API** e **Places API (New)** ativadas, **faturamento habilitado** e um **Map ID**

---

## Configuração do ambiente

Crie um arquivo **`.env.local`** na raiz (ele é ignorado pelo git):

```env
# Supabase - Connection string do Postgres
DATABASE_URL="postgresql://postgres.<ref>:<senha>@<host>.pooler.supabase.com:6543/postgres"

# Auth.js - segredo de assinatura da sessão (gere com: npx auth secret)
AUTH_SECRET="<gerado>"

# Google Maps + Places (New)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<sua-chave>"
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID="<seu-map-id>"
```

> **Dica de segurança:** como a chave do Google vai para o navegador, restrinja-a por **HTTP referrers** (ex.: `http://localhost:3000/*` e o domínio de produção) no Google Cloud Console.

---

## Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Aplicar as migrações no banco (Supabase)
npm run db:migrate

# 3. (Opcional) Popular com dados de exemplo
npm run db:seed

# 4. Subir o servidor de desenvolvimento
npm run dev
```

Abra **http://localhost:3000**.

> ⚠️ Variáveis `NEXT_PUBLIC_*` são carregadas na **inicialização** do servidor. Se você editar o `.env.local`, **reinicie** o `npm run dev`.

---

## Scripts disponíveis

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes (Vitest, uma execução) |
| `npm run test:watch` | Testes em modo watch |
| `npm run db:generate` | Gera SQL de migração a partir do schema |
| `npm run db:migrate` | Aplica as migrações no banco |
| `npm run db:push` | Sincroniza o schema direto no banco (dev) |
| `npm run db:seed` | Popula dojôs de exemplo |

---

## Testes

O projeto usa **Vitest**:

- **Unitários** - cálculo de distância (Haversine) e validadores Zod.
- **Integração** - consultas Drizzle e regras de negócio (unicidade de avaliação, exclusão só pelo dono, cálculo de média) executadas contra um PostgreSQL real.

```bash
npm test
```

> ⚠️ Os testes de **integração limpam as tabelas** do banco configurado em `DATABASE_URL`. Use um projeto/banco Supabase **separado para testes**, ou rode `npm run db:seed` novamente depois. Nunca aponte os testes para um banco de produção.

---

## Deploy na Vercel

1. Suba o projeto para um repositório no **GitHub**.
2. Em [vercel.com](https://vercel.com), **importe** o repositório (o framework Next.js é detectado automaticamente).
3. Configure as **variáveis de ambiente** (as mesmas do `.env.local`): `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
4. Adicione o domínio `*.vercel.app` (e seu domínio próprio) à **restrição de referrers** da chave do Google.
5. Faça o deploy. As migrações (`npm run db:migrate`) devem ser aplicadas contra o banco de produção uma vez.

---

## Roadmap

Funcionalidades previstas e ainda não implementadas nesta fase:

- 💬 Respostas do sensei às avaliações
- 🛠️ Sensei editar informações do dojô (horários, contatos, descrição, fotos)
- 🛡️ Painel de admin para moderar reivindicações de dojô
- 🔎 Filtros por modalidade e distância
- 👤 Edição de perfil e recuperação de senha
- 📱 PWA (instalável no celular) e deploy
- ✅ Testes end-to-end (Playwright)

---

<p align="center">Feito com 🥋 - Dojo Atlas</p>
