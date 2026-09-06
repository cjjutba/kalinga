CREATE TYPE "public"."reminder_channel" AS ENUM('copied', 'email');--> statement-breakpoint
ALTER TABLE "reminder" ADD COLUMN "sent_via" "reminder_channel";