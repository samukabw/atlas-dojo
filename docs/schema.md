# Modelo de Banco de Dados - Dojo Atlas

Modelo relacional do projeto, baseado no diagrama ER e no schema implementado em [`src/db/schema.ts`](../src/db/schema.ts) (Drizzle ORM sobre PostgreSQL/Supabase). As chaves primárias usam `bigserial` (inteiro autoincremental).

## Tabelas

### `user`
Usuários da plataforma (praticantes, senseis e administradores).

| Campo | Tipo | Observação |
|-------|------|------------|
| usuario_id | bigserial | PK |
| nome | varchar(255) | |
| email | varchar(255) | UK (único) |
| senha_hash | varchar(255) | hash bcrypt (RNF02) |
| perfil | enum | `comum` \| `sensei` \| `admin` (default `comum`) |
| criado_em | timestamptz | default `now()` |

### `dojo`
Dojôs (academias de artes marciais). Podem ser cadastrados manualmente ou criados a partir de um lugar real do Google Places.

| Campo | Tipo | Observação |
|-------|------|------------|
| dojo_id | bigserial | PK |
| nome | varchar(255) | |
| descricao | text | |
| cep | varchar(20) | |
| cidade | varchar(120) | |
| bairro | varchar(120) | |
| rua | varchar(255) | |
| numero | varchar(20) | |
| latitude | numeric(10,7) | NOT NULL (RNF11) |
| longitude | numeric(10,7) | NOT NULL (RNF11) |
| place_id | varchar(255) | UK (único) - liga ao Google Places; nulo para cadastro manual |
| endereco | text | endereço formatado retornado pelo Places |
| criado_em | timestamptz | default `now()` |

### `avaliacao`
Avaliações da comunidade para um dojô (nota + comentário).

| Campo | Tipo | Observação |
|-------|------|------------|
| avaliacao_id | bigserial | PK |
| usuario_id | bigint | FK → user (ON DELETE CASCADE) |
| dojo_id | bigint | FK → dojo (ON DELETE CASCADE) |
| nota | int | 1 a 5 |
| descricao | text | comentário |
| criado_em | timestamptz | default `now()` |
| atualizado_em | timestamptz | default `now()` |

> **Restrição:** `UNIQUE(usuario_id, dojo_id)` - uma avaliação por usuário por dojô, editável (RNF10).

### `contato`
Contatos (telefone/e-mail) de um dojô.

| Campo | Tipo | Observação |
|-------|------|------------|
| contato_id | bigserial | PK |
| dojo_id | bigint | FK → dojo (ON DELETE CASCADE) |
| telefone | varchar(40) | |
| email | varchar(255) | |

### `favorito`
Dojôs marcados como favoritos por um usuário.

| Campo | Tipo | Observação |
|-------|------|------------|
| favorito_id | bigserial | PK |
| usuario_id | bigint | FK → user (ON DELETE CASCADE) |
| dojo_id | bigint | FK → dojo (ON DELETE CASCADE) |
| criado_em | timestamptz | default `now()` |

> **Restrição:** `UNIQUE(usuario_id, dojo_id)` - um dojô não se repete na lista de favoritos do usuário.

## Relacionamentos principais

- **user → avaliacao** (`escreve`): um usuário escreve várias avaliações. (1:N)
- **dojo → avaliacao** (`recebe`): um dojô recebe várias avaliações. (1:N)
- **user ↔ dojo** via `avaliacao`: relação N:N restringida a **um par único** por `UNIQUE(usuario_id, dojo_id)`.
- **user ↔ dojo** via `favorito`: relação N:N - um usuário favorita vários dojôs e um dojô é favoritado por vários usuários (`favorita`).
- **dojo → contato** (`tem`): um dojô possui vários contatos. (1:N)
- **dojo.place_id → Google Places** (`liga`): vínculo externo que conecta o registro local ao lugar real descoberto no mapa.

## Observações de modelagem

- **Autenticação:** feita com **Auth.js (NextAuth v5)** usando sessão **JWT em cookie**. A tabela `auth_token` prevista no DER original foi substituída por esse mecanismo - não há tabela de sessão no banco.
- **Modelo híbrido (descoberta + comunidade):** os dojôs exibidos no mapa vêm em tempo real da **Google Places API**; quando um usuário avalia ou favorita um lugar, cria-se (ou reutiliza-se) um registro em `dojo` identificado pelo **`place_id`**, ao qual `avaliacao` e `favorito` se vinculam.
- **Segurança (RNF02):** senhas são armazenadas apenas como hash bcrypt; a autorização é validada no servidor (server actions e route handlers).
- **Integridade das avaliações (RNF10):** garantida por `UNIQUE(usuario_id, dojo_id)`.
- **Precisão geográfica (RNF11):** `latitude`/`longitude` são `numeric` e obrigatórias.
- **Previsto no DER, ainda não implementado:** a tabela `resposta` (sensei responde avaliação) e o vínculo formal **sensei ↔ dojô** - itens do roadmap.
