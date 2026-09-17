CREATE TABLE "resposta" (
	"resposta_id" bigserial PRIMARY KEY NOT NULL,
	"avaliacao_id" bigint NOT NULL,
	"usuario_id" bigint NOT NULL,
	"texto" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resposta_avaliacao_id_unique" UNIQUE("avaliacao_id")
);
--> statement-breakpoint
ALTER TABLE "resposta" ADD CONSTRAINT "resposta_avaliacao_id_avaliacao_avaliacao_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "public"."avaliacao"("avaliacao_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resposta" ADD CONSTRAINT "resposta_usuario_id_user_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("usuario_id") ON DELETE cascade ON UPDATE no action;