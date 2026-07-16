ALTER TABLE "users" ADD COLUMN "ical_secret" uuid NOT NULL DEFAULT gen_random_uuid();
