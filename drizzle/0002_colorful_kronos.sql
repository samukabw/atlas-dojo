CREATE TABLE "favorito" (
	"favorito_id" bigserial PRIMARY KEY NOT NULL,
	"usuario_id" bigint NOT NULL,
	"dojo_id" bigint NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_usuario_id_user_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_dojo_id_dojo_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("dojo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorito_usuario_dojo_unq" ON "favorito" USING btree ("usuario_id","dojo_id");