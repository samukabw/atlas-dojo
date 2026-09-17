CREATE TABLE "dojo_sensei" (
	"dojo_sensei_id" bigserial PRIMARY KEY NOT NULL,
	"dojo_id" bigint NOT NULL,
	"usuario_id" bigint NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dojo_sensei" ADD CONSTRAINT "dojo_sensei_dojo_id_dojo_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("dojo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dojo_sensei" ADD CONSTRAINT "dojo_sensei_usuario_id_user_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dojo_sensei_unq" ON "dojo_sensei" USING btree ("dojo_id","usuario_id");