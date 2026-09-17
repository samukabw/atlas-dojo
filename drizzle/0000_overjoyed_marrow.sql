CREATE TYPE "public"."perfil" AS ENUM('comum', 'sensei', 'admin');--> statement-breakpoint
CREATE TABLE "avaliacao" (
	"avaliacao_id" bigserial PRIMARY KEY NOT NULL,
	"usuario_id" bigint NOT NULL,
	"dojo_id" bigint NOT NULL,
	"nota" integer NOT NULL,
	"descricao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contato" (
	"contato_id" bigserial PRIMARY KEY NOT NULL,
	"dojo_id" bigint NOT NULL,
	"telefone" varchar(40),
	"email" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "dojo" (
	"dojo_id" bigserial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"cep" varchar(20),
	"cidade" varchar(120),
	"bairro" varchar(120),
	"rua" varchar(255),
	"numero" varchar(20),
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"usuario_id" bigserial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"perfil" "perfil" DEFAULT 'comum' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_usuario_id_user_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_dojo_id_dojo_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("dojo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contato" ADD CONSTRAINT "contato_dojo_id_dojo_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("dojo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "avaliacao_usuario_dojo_unq" ON "avaliacao" USING btree ("usuario_id","dojo_id");