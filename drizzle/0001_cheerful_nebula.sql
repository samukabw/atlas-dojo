ALTER TABLE "dojo" ADD COLUMN "place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "dojo" ADD COLUMN "endereco" text;--> statement-breakpoint
ALTER TABLE "dojo" ADD CONSTRAINT "dojo_place_id_unique" UNIQUE("place_id");