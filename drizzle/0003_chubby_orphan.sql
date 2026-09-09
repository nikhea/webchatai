CREATE TABLE "artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"tool_call_id" text NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"content" text NOT NULL,
	"language" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_tool_call_id_unique" UNIQUE("tool_call_id")
);
--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifact_thread_idx" ON "artifact" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "artifact_user_idx" ON "artifact" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artifact_tool_call_idx" ON "artifact" USING btree ("tool_call_id");