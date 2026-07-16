ALTER TABLE "habits" ADD COLUMN "pomodoro_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "pomodoro_unit_length" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "pomodoro_short_break_length" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "pomodoro_units_before_long_break" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "pomodoro_long_break_length" integer;