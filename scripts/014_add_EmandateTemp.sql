CREATE TABLE "EMandateTemp" ("id" serial NOT NULL PRIMARY KEY, "idx" uuid NOT NULL UNIQUE, "created_on" timestamp with time zone NOT NULL, "modified_on" timestamp with time zone NOT NULL, "is_obsolete" boolean NOT NULL, "full_name" varchar(100) NOT NULL, "branch_idx" uuid NOT NULL, "account_number" varchar(50) NOT NULL UNIQUE, "account_type" varchar(50) NOT NULL, "extra_details" jsonb[] NOT NULL, "is_verified" boolean NOT NULL, "customer_temp_id" integer NOT NULL);
ALTER TABLE "EMandateTemp" ADD CONSTRAINT "EMandateTemp_customer_temp_id_bba29dc0_fk_CustomerTemp_id" FOREIGN KEY ("customer_temp_id") REFERENCES "CustomerTemp" ("id") DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX "EMandateTemp_account_number_3bcc704a_like" ON "EMandateTemp" ("account_number" varchar_pattern_ops);
CREATE INDEX "EMandateTemp_customer_temp_id_bba29dc0" ON "EMandateTemp" ("customer_temp_id");

ALTER TABLE "EMandateTemp" ALTER COLUMN idx SET default uuid_generate_v1();
ALTER TABLE "EMandateTemp" ALTER COLUMN created_on SET default CURRENT_TIMESTAMP;
ALTER TABLE "EMandateTemp" ALTER COLUMN modified_on SET default CURRENT_TIMESTAMP;
ALTER TABLE "EMandateTemp" ALTER COLUMN is_obsolete SET default false;
