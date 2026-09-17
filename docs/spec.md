# Dojo Atlas - Design do MVP (Fatia Fina)

**Data:** 2026-09-15
**Status:** Aprovado (design) - pendente revisão da spec antes do plano de implementação

## 1. Visão geral

Dojo Atlas é uma aplicação web para encontrar dojôs (escolas de artes marciais)
em um mapa interativo, ver seus detalhes e avaliá-los. Este documento descreve o
MVP de **fatia fina**: o menor conjunto de funcionalidades que entrega valor
real ponta a ponta.

### Escopo da fatia fina (RFs incluídos)

| RF | Descrição | Incluído |
|----|-----------|----------|
| RF01 | Cadastro de usuário (comum/sensei) | ✅ |
| RF02 | Autenticação (login/logout) | ✅ |
| RF04 | Visualizar mapa de dojôs | ✅ |
| RF05 | Encontrar dojôs próximos (geolocalização) | ✅ |
| RF06 | Busca por nome, bairro ou cidade | ✅ |
| RF07 | Filtrar dojôs (distância, avaliação) | ✅ parcial (sem "estilo") |
| RF08 | Visualizar detalhes do dojô | ✅ |
| RF10 | Avaliar dojôs (nota + comentário) | ✅ |
| RF11 | Editar/excluir avaliação | ✅ |
| RF12 | Visualizar avaliações + nota média | ✅ |

### Fora do escopo (fases seguintes)

- RF03 (edição de perfil), RF09 (favoritos), RF13 (respostas de sensei),
  RF14 (gerenciar dojô), RF15 (vínculo sensei-dojô), RF16 (traçar rota externa).
- Recuperação de senha (parte do RF02) - fica para a próxima fase.
- Filtro por "estilo" (parte do RF07) - não há campo no DER; adiar.
- Telas de administração e de gestão por sensei.

O enum de `perfil` (comum/sensei/admin) já existe no modelo, mas sem telas
específicas por perfil nesta fatia.

## 2. Stack técnica

| Camada | Escolha |
|--------|---------|
| Framework | Next.js (App Router) + TypeScript |
| Hospedagem | Vercel |
| Banco de dados | PostgreSQL gerenciado no Supabase |
| ORM | Drizzle ORM + drizzle-kit (migrations) |
| Autenticação | Auth.js (NextAuth) - provider Credentials (e-mail/senha) |
| Hash de senha | bcrypt (ou argon2) |
| Mapa | Google Maps via `@vis.gl/react-google-maps` + Places (autocomplete) |
| UI | Tailwind CSS + shadcn/ui |
| Validação | Zod |
| Testes | Vitest (unit/integração) + Playwright (E2E) |

### Decisão de arquitetura (leitura/mutação no App Router)

- **Leitura:** Server Components (lista e detalhe de dojô renderizados no servidor).
- **Mutação:** Server Actions (registro de usuário, criar/editar/excluir avaliação).
- **Mapa dinâmico:** Route Handler `GET /api/dojos` consumido pelo mapa client-side,
  aceitando parâmetros de busca/filtro/ordenação e coordenadas do usuário.

## 3. Modelo de dados

Baseado no DER, restrito às tabelas da fatia fina.

### user
- `id` (bigint/serial, PK)
- `nome` (varchar)
- `email` (varchar, **único**)
- `senha_hash` (varchar)
- `perfil` (enum: `comum` | `sensei` | `admin`, default `comum`)
- `criado_em` (timestamptz, default now)

### dojo
- `id` (bigint/serial, PK)
- `nome` (varchar)
- `descricao` (text)
- `cep` (varchar)
- `cidade` (varchar)
- `bairro` (varchar)
- `rua` (varchar)
- `numero` (varchar)
- `latitude` (decimal)
- `longitude` (decimal)
- `criado_em` (timestamptz, default now)

### avaliacao
- `id` (bigint/serial, PK)
- `usuario_id` (FK → user.id)
- `dojo_id` (FK → dojo.id)
- `nota` (int, 1-5)
- `descricao` (text)
- `criado_em` (timestamptz, default now)
- `atualizado_em` (timestamptz)
- **UNIQUE(usuario_id, dojo_id)** - garante 1 avaliação por usuário/dojô (RNF10)

### contato
- `id` (bigint/serial, PK)
- `dojo_id` (FK → dojo.id)
- `telefone` (varchar)
- `email` (varchar)

### Tabelas adiadas
`favorito`, `resposta` - voltam em fases seguintes. `auth_token` do DER é
substituída pela sessão gerenciada pelo Auth.js.

## 4. Fluxos principais

### Autenticação (RF01, RF02)
1. **Registro:** formulário → Server Action valida com Zod → gera `senha_hash`
   → insere `user` (perfil `comum` por padrão; escolha comum/sensei no cadastro).
2. **Login/Logout:** Auth.js Credentials; sessão por cookie HTTP-only seguro.
3. Rotas de mutação de avaliação exigem sessão válida.

### Mapa e proximidade (RF04, RF05)
1. Página do mapa renderiza um Google Map client-side.
2. Busca dojôs via `GET /api/dojos`; cada dojô vira um marcador.
3. Com permissão de geolocalização do browser (RNF04), envia `lat`/`lng`;
   o servidor calcula distância (Haversine em SQL) e pode ordenar por proximidade.

### Busca e filtro (RF06, RF07)
- `GET /api/dojos?q=&cidade=&bairro=&ordenar=distancia|nota&lat=&lng=`.
- Busca textual por nome/bairro/cidade; ordenação por distância ou nota média.

### Detalhe do dojô (RF08, RF12)
- `/dojos/[id]` (Server Component): endereço completo, contatos, nota média,
  contagem e lista de avaliações.

### Avaliações (RF10, RF11, RF12)
- Usuário logado cria avaliação (nota 1-5 + comentário) via Server Action.
- Pode editar/excluir **apenas a própria** avaliação (checagem no servidor).
- UNIQUE no banco impede duplicidade mesmo em condição de corrida.
- Nota média calculada por agregação SQL.

## 5. Cálculo de distância

Fórmula de Haversine executada em SQL no Postgres (sem PostGIS no MVP).
Dojôs precisam de `latitude`/`longitude` válidas (RNF11). Distância usada para
ordenar resultados de "dojôs próximos" e exibir a distância no card/lista.

## 6. Erros, validação e segurança

- **Validação:** Zod em todas as entradas (registro, login, avaliação).
- **Autorização (RNF02/RNF03):** só usuário logado avalia; só o dono edita/exclui
  sua avaliação; checagens feitas no servidor, não só na UI.
- **Senhas (RNF02):** armazenadas apenas como hash (bcrypt/argon2).
- **Privacidade (RNF04):** localização usada apenas mediante permissão do browser,
  somente para a função de proximidade; não é persistida.
- **Erros:** respostas de erro claras nas Server Actions/route handlers; estados
  de erro tratados na UI (formulários com feedback, mapa com fallback).

## 7. Requisitos não funcionais atendidos

- **RNF01 Responsividade / RNF07 Acessibilidade:** Tailwind + shadcn/ui
  (componentes acessíveis, navegação por teclado, contraste), layout responsivo.
- **RNF02 Segurança / RNF03 Permissões:** hash de senha, sessão via Auth.js,
  autorização no servidor por perfil/propriedade.
- **RNF04 Privacidade:** geolocalização sob permissão, não persistida.
- **RNF05 Desempenho:** leitura via Server Components, índices em colunas de
  busca/FK, payload do mapa enxuto.
- **RNF08 Compatibilidade:** navegadores modernos (Next.js + browsers evergreen).
- **RNF09 Escalabilidade:** Postgres/Supabase, dados por cidade, sem acoplamento
  a uma cidade específica.
- **RNF10 Integridade das avaliações:** UNIQUE(usuario_id, dojo_id).
- **RNF11 Precisão geográfica:** lat/long obrigatórios e validados nos dojôs.

## 8. Estrutura de pastas (proposta)

```
dojo-atlas/
├─ app/
│  ├─ (auth)/login, (auth)/registro
│  ├─ mapa/                # página do mapa (client component do Google Maps)
│  ├─ dojos/[id]/          # detalhe (Server Component) + avaliações
│  ├─ api/dojos/route.ts   # busca/filtro/distância para o mapa
│  └─ layout.tsx, page.tsx
├─ components/             # UI (shadcn/ui + componentes do app)
├─ db/
│  ├─ schema.ts            # schema Drizzle
│  ├─ index.ts             # cliente Drizzle
│  └─ queries/             # queries (dojôs, avaliações)
├─ lib/
│  ├─ auth.ts              # config Auth.js
│  ├─ distancia.ts         # Haversine / helpers
│  └─ validators.ts        # schemas Zod
├─ drizzle/                # migrations geradas
├─ tests/                  # Vitest + Playwright
└─ ...config (tailwind, drizzle.config, etc.)
```

## 9. Estratégia de testes

- **Unit (Vitest):** cálculo de distância, validadores Zod, regras de permissão.
- **Integração:** queries Drizzle contra Postgres de teste - unicidade de
  avaliação, cálculo de média, busca/ordenação.
- **E2E (Playwright):** fluxo registrar → logar → avaliar → ver no detalhe;
  carregar mapa e listar dojôs.

## 10. Dados de exemplo (seed)

Script de seed com alguns dojôs reais/fictícios (com lat/long válidos) e
usuários de teste, para exercitar mapa, busca e avaliações desde o início.

## 11. Pré-requisitos externos (o usuário providencia)

- Projeto no **Supabase** + connection string do Postgres.
- **Chave de API do Google Maps** (Maps JavaScript API + Places API) com
  faturamento habilitado.
- Conta na **Vercel** para deploy.
