-- Drop rows with null activity_type_id before adding NOT NULL constraint.
-- habits cascade-deletes habit_completions; time_blocks and todos have no children.
DELETE FROM "time_blocks" WHERE "activity_type_id" IS NULL;--> statement-breakpoint
DELETE FROM "todos" WHERE "activity_type_id" IS NULL;--> statement-breakpoint
DELETE FROM "habits" WHERE "activity_type_id" IS NULL;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "activity_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "activity_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "time_blocks" ALTER COLUMN "activity_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_activity_type_id_activity_types_id_fkey", ADD CONSTRAINT "todos_activity_type_id_activity_types_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_activity_type_id_activity_types_id_fkey", ADD CONSTRAINT "habits_activity_type_id_activity_types_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_blocks" DROP CONSTRAINT "time_blocks_activity_type_id_activity_types_id_fkey", ADD CONSTRAINT "time_blocks_activity_type_id_activity_types_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT;