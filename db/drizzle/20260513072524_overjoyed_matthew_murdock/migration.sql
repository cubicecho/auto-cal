CREATE TABLE "todo_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"activity_type_id" uuid NOT NULL,
	"default_priority" integer DEFAULT 0 NOT NULL,
	"default_estimated_length" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_activity_type_id_activity_types_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
-- Lists are now required for todos. Drop existing todos rather than fabricating
-- lists for them; users will recreate via the new TodoList-aware flow.
DELETE FROM "todos";--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_activity_type_id_activity_types_id_fkey";--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "list_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "due_at" timestamp;--> statement-breakpoint
ALTER TABLE "todos" DROP COLUMN "activity_type_id";--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_list_id_todo_lists_id_fkey" FOREIGN KEY ("list_id") REFERENCES "todo_lists"("id") ON DELETE RESTRICT;
