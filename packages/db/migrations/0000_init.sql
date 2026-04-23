CREATE TYPE "public"."tx_event_kind" AS ENUM('detected', 'validated', 'rejected_malformed', 'rejected_below_minimum', 'forward_submitted', 'forward_confirmed', 'forward_failed', 'moved_to_review');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('detected', 'validated', 'forwarding', 'forwarded', 'confirmed', 'kept_malformed', 'below_minimum', 'failed_retry', 'operator_review');--> statement-breakpoint
CREATE TABLE "detector_cursor" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"consensus_timestamp" text DEFAULT '0.0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_tx" (
	"id" serial PRIMARY KEY NOT NULL,
	"consensus_timestamp" text NOT NULL,
	"transaction_id" text NOT NULL,
	"payer_account_id" text,
	"amount_tinybars" bigint NOT NULL,
	"memo_raw" text,
	"memo_parsed" text,
	"status" "tx_status" DEFAULT 'detected' NOT NULL,
	"destination_hollow_before" boolean,
	"fee_tinybars" bigint,
	"user_amount_tinybars" bigint,
	"forward_transaction_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats_cache" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"total_inbound" integer DEFAULT 0 NOT NULL,
	"total_volume_tinybars" bigint DEFAULT 0 NOT NULL,
	"total_fees_tinybars" bigint DEFAULT 0 NOT NULL,
	"total_forwarded" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"total_malformed" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer,
	"success_rate" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tx_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"inbound_tx_id" integer NOT NULL,
	"kind" "tx_event_kind" NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tx_event" ADD CONSTRAINT "tx_event_inbound_tx_id_inbound_tx_id_fk" FOREIGN KEY ("inbound_tx_id") REFERENCES "public"."inbound_tx"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inbound_tx_consensus_ts_unq" ON "inbound_tx" USING btree ("consensus_timestamp");--> statement-breakpoint
CREATE INDEX "inbound_tx_status_created_idx" ON "inbound_tx" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "inbound_tx_forward_tx_idx" ON "inbound_tx" USING btree ("forward_transaction_id");--> statement-breakpoint
CREATE INDEX "tx_event_inbound_idx" ON "tx_event" USING btree ("inbound_tx_id","created_at");