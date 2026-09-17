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
  // Ligação com o Google Places (nulo para dojôs cadastrados manualmente/seed).
  placeId: varchar("place_id", { length: 255 }).unique(),
  endereco: text("endereco"),
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

export const favoritos = pgTable(
  "favorito",
  {
    id: bigserial("favorito_id", { mode: "number" }).primaryKey(),
    usuarioId: bigint("usuario_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dojoId: bigint("dojo_id", { mode: "number" })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unicoPorUsuarioDojo: uniqueIndex("favorito_usuario_dojo_unq").on(t.usuarioId, t.dojoId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Dojo = typeof dojos.$inferSelect;
export type NewDojo = typeof dojos.$inferInsert;
export type Avaliacao = typeof avaliacoes.$inferSelect;
export type NewAvaliacao = typeof avaliacoes.$inferInsert;
export const dojoSenseis = pgTable(
  "dojo_sensei",
  {
    id: bigserial("dojo_sensei_id", { mode: "number" }).primaryKey(),
    dojoId: bigint("dojo_id", { mode: "number" })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    usuarioId: bigint("usuario_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unicoPorDojoSensei: uniqueIndex("dojo_sensei_unq").on(t.dojoId, t.usuarioId),
  })
);

export type Contato = typeof contatos.$inferSelect;
export type Favorito = typeof favoritos.$inferSelect;
export type DojoSensei = typeof dojoSenseis.$inferSelect;
