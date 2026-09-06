CREATE TABLE "shared_chat" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"thread_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"organization_id" text,
	"title" text,
	"snapshot" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "shared_chat_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "shared_chat" ADD CONSTRAINT "shared_chat_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_chat" ADD CONSTRAINT "shared_chat_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shared_chat_token_idx" ON "shared_chat" USING btree ("token");--> statement-breakpoint
CREATE INDEX "shared_chat_thread_idx" ON "shared_chat" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "shared_chat_owner_idx" ON "shared_chat" USING btree ("owner_id");