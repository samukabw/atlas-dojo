# Requisitos - Dojo Atlas

Requisitos extraídos do documento do projeto. As colunas de papel indicam quem pode executar cada ação; a coluna **Status** reflete o estado atual da implementação.

**Legenda de status:** ✅ Implementado · 🟡 Parcial · ⬜ Pendente

## Requisitos Funcionais

| ID | Requisito | Comum | Sensei | Admin | Status |
|----|-----------|:---:|:---:|:---:|:---:|
| RF01 | Cadastro de usuários comuns e senseis. | ✓ | ✓ | ✓ | ✅ |
| RF02 | Autenticação: login, logout e recuperação de senha. | ✓ | ✓ | ✓ | 🟡 (login/logout ok; recuperação de senha pendente) |
| RF03 | Visualizar e editar as informações pessoais (perfil). | ✓ | ✓ | ✓ | ⬜ |
| RF04 | Exibir mapa interativo com os dojôs. | ✓ | ✓ | ✓ | ✅ (via Google Places, modelo híbrido) |
| RF05 | Encontrar dojôs próximos usando a localização do usuário. | ✓ | ✓ | ✓ | ✅ ("Perto de mim") |
| RF06 | Pesquisar dojôs por nome, bairro ou cidade. | ✓ | ✓ | ✓ | ✅ (busca por texto via Places) |
| RF07 | Filtrar dojôs por estilo, distância, horário e avaliação. | ✓ | ✓ | ✓ | 🟡 (busca por texto/proximidade; filtros por estilo/horário/avaliação pendentes) |
| RF08 | Apresentar detalhes do dojô: endereço, contatos, horários, fotos e avaliação média. | ✓ | ✓ | ✓ | ✅ (endereço, contatos, fotos, horários e média, via Google Places) |
| RF09 | Adicionar e remover dojôs dos favoritos. | ✓ | ✓ | ✓ | ✅ |
| RF10 | Avaliar um dojô atribuindo nota e comentário. | ✓ | ✓ | ✓ | ✅ |
| RF11 | Editar ou remover a própria avaliação. | ✓ | ✓ | ✓ | ✅ |
| RF12 | Exibir todas as avaliações e a nota média de cada dojô. | ✓ | ✓ | ✓ | ✅ |
| RF13 | Sensei responder avaliações dos dojôs aos quais está vinculado. | - | ✓ | ✓ | ⬜ |
| RF14 | Sensei atualizar horários, contatos, descrição e fotos dos seus dojôs. | - | ✓ | ✓ | 🟡 (sensei já reivindica/cadastra dojô; editar informações ainda pendente) |
| RF15 | Sensei solicitar associação (vínculo) a um ou mais dojôs. | - | ✓ | ✓ | ✅ (reivindicar dojô do mapa ou cadastrar dojô novo; vínculo automático) |
| RF16 | Abrir uma rota para o dojô em um serviço de mapas. | ✓ | ✓ | ✓ | ✅ (botão "Como chegar") |

> **Nota:** o perfil `admin` existe no modelo (`user.perfil`), mas ainda não há telas administrativas específicas; por padrão, o admin herda as permissões das demais ações.

## Requisitos Não Funcionais

| ID | Categoria | Requisito Não Funcional (O sistema deve...) | Status |
|----|-----------|----------------------------------------------|:---:|
| RNF01 | Usabilidade | Funcionar corretamente em smartphones, tablets e computadores (interface responsiva). | ✅ |
| RNF02 | Segurança | Armazenar senhas de forma criptografada (hash) e respeitar os perfis de usuário no acesso às funcionalidades. | ✅ |
| RNF03 | Segurança | Prover permissões distintas para usuários comuns, senseis e administradores. | 🟡 (enum de perfil e checagens no servidor; telas por perfil parciais) |
| RNF04 | Privacidade | Utilizar a localização do usuário apenas mediante autorização e conforme a funcionalidade de proximidade. | ✅ |
| RNF05 | Desempenho | Carregar o mapa e as avaliações de forma rápida e otimizada. | ✅ |
| RNF06 | Disponibilidade | Manter as informações dos dojôs disponíveis para consulta sempre que o sistema estiver online. | 🟡 (depende da infraestrutura de deploy) |
| RNF07 | Acessibilidade | Seguir boas práticas de acessibilidade (contraste, navegação por teclado e elementos semânticos). | ✅ |
| RNF08 | Compatibilidade | Ser compatível com os principais navegadores modernos. | ✅ |
| RNF09 | Escalabilidade | Permitir a expansão para outras cidades e novos dojôs sem alterações significativas. | ✅ (PostgreSQL/Supabase; descoberta via Places) |
| RNF10 | Integridade | Garantir uma única avaliação por usuário por dojô, podendo editá-la depois. | ✅ (`UNIQUE(usuario_id, dojo_id)`) |
| RNF11 | Precisão geográfica | Manter coordenadas geográficas válidas para exibição no mapa e cálculo de distância. | ✅ |

## Observações de modelagem

- O **RBAC (RNF03)** apoia-se no campo `user.perfil` (`comum` / `sensei` / `admin`) e na validação de autorização feita no servidor (server actions e route handlers).
- A **integridade das avaliações (RNF10)** é garantida no banco pela restrição `UNIQUE(usuario_id, dojo_id)` da tabela `avaliacao`.
- A **descoberta de dojôs (RF04-RF06)** usa a **Google Places API**; as avaliações e favoritos da comunidade (RF09-RF12) são gravados no banco próprio, ligados ao `place_id` do lugar.
- **Lado do sensei (RF15):** o sensei reivindica um dojô do mapa ou **cadastra um dojô novo** (fora do Google - praia, praça, quintal, espaço compartilhado), com vínculo `dojo_sensei` (N:N) e aprovação automática. Dojôs manuais aparecem no mapa e têm página de detalhe própria.
- Itens do **roadmap**: RF03 (perfil), RF07 (filtros por modalidade/distância), RF13 (sensei responder avaliações), RF14 (editar informações do dojô), recuperação de senha (parte do RF02) e painel de admin para moderar reivindicações.
