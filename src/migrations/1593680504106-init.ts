import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1593680504106 implements MigrationInterface {
	name = 'init1593680504106';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerDevice" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_brand" text, "phone_os" text, "os_version" text, "deviceid" text NOT NULL, "fcm_token" text, "otp" text NOT NULL, "token" text, "otp_type" text, "otp_status" boolean NOT NULL DEFAULT false, "total_attempt" bigint DEFAULT 0, "otp_created_at" TIMESTAMP NOT NULL, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "customer_id" integer, CONSTRAINT "PK_61ac3e732cc266d5ca6124b8d4a" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_b9f54e792a20e771908b92dd74" ON "public"."CustomerDevice" ("idx") `,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."Customer" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" text NOT NULL, "middle_name" text, "last_name" text NOT NULL, "password" text, "is_password_set" boolean NOT NULL DEFAULT false, "email" text NOT NULL, "gender" text, "mobile_number" text NOT NULL, "date_of_birth" date, "id_type" text NOT NULL, "id_no" text NOT NULL, "id_expiry_date" date NOT NULL, "city_state" text NOT NULL, "district" text NOT NULL, "created_on" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean DEFAULT true, "is_mpin_set" boolean DEFAULT false, "is_security_set" boolean NOT NULL DEFAULT false, "mobile_number_ext" text, "is_panno_verified" boolean DEFAULT false, "panno" text, "customer_code" text, "profile_picture" text, "credit_limit" double precision DEFAULT 0, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_eb5b0d178461eab6fd7bafecd47" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."ActivityLogCustomer" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "activity_type" text, "status" boolean, "login_type" text, "ip_address" text, "device_id" text, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "userIdId" integer, CONSTRAINT "PK_7cb45a8ee1debe5b7f31d45c254" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."Answers" ("id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" bigint NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_c8ec983f047bfbd29b16949defc" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_20dde3705b7a45b0f36a3b6114" ON "public"."Answers" ("idx") `,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerCard" ("id" SERIAL NOT NULL, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "is_obsolete" boolean NOT NULL DEFAULT false, "customer_idx" uuid NOT NULL, "membership_type" character varying(16) NOT NULL, "membership_number" text NOT NULL, "valid_till" date NOT NULL, "reward_point" integer NOT NULL, CONSTRAINT "PK_976d4e0f7b4471490be6a376733" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_18eab3e60966c54ba42a9e59ef" ON "public"."CustomerCard" ("membership_number", "idx", "customer_idx") `,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerTemp" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "mobile_number_ext" text NOT NULL, "is_panno_verified" boolean, "panno" text, "customer_id" bigint, "customer_code" text NOT NULL, "credit_limit" double precision DEFAULT 0, "first_name" text, "middle_name" text, "last_name" text, "email" text, "gender" text, "mobile_number" text, "date_of_birth" date, "id_type" text, "id_no" text, "id_expiry_date" date, "city_state" text, "district" text, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "status" text NOT NULL, "created_by" uuid, "operation" text NOT NULL, "rejection_reason" text, "profile_picture" text, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_a88994f768db62b60e153725643" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."EMandate" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "customer_idx" uuid, "full_name" text NOT NULL, "branch_idx" uuid NOT NULL, "account_number" text NOT NULL, "account_type" text NOT NULL, "status" text NOT NULL DEFAULT 'PENDING', "is_verified" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_d40698962f9b33e9afc58b4dd86" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_41119b10ae884275b110be0334" ON "public"."EMandate" ("account_number", "customer_idx", "idx") `,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."EMandateTemp" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "full_name" character varying(100) NOT NULL, "branch_idx" uuid NOT NULL, "account_type" character varying NOT NULL, "account_number" character varying(50) NOT NULL, "is_verified" boolean NOT NULL, "customer_temp_id" integer NOT NULL, "status" text NOT NULL, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_1a941235ff51ea9fe7fc5332544" UNIQUE ("idx"), CONSTRAINT "PK_709cc4bd44afbe1e6d037e77a91" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_1a941235ff51ea9fe7fc533254" ON "public"."EMandateTemp" ("idx") `,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."operationlogs" ("id" SERIAL NOT NULL, "customer_idx" uuid NOT NULL, "token" uuid NOT NULL DEFAULT uuid_generate_v4(), "operation_type" text NOT NULL, "status" text NOT NULL, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), CONSTRAINT "PK_82457ed60a899a19d471f45e9e3" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_91cf16710b46007b27b24a592b" ON "public"."operationlogs" ("idx") `,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."operationrules" ("id" SERIAL NOT NULL, "operation_type" text NOT NULL, "period" text NOT NULL, "period_unit" text NOT NULL, "attempts" integer NOT NULL, CONSTRAINT "PK_cb58767c3159b2ea1cf5bc5b943" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerProtocol" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "login_attempt_interval" integer NOT NULL, "login_interval_unit" text NOT NULL, "login_max_retry" integer NOT NULL, "mpin_attempt_interval" integer, "mpin_interval_unit" text, "mpin_max_retry" integer, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_13a8649688524b3bd5d43f019e4" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "public"."SecurityQuestion" ("id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "questions" text NOT NULL, "created_by" text DEFAULT 'Superadmin', "is_active" boolean NOT NULL DEFAULT true, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_6851fbcbb7b5635f5b9627f7062" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_e5260b33c9a16fbfbbe4b1d876" ON "public"."SecurityQuestion" ("idx") `,
		);
		await queryRunner.query(
			`ALTER TABLE "public"."CustomerDevice" ADD CONSTRAINT "FK_792106daa486dbf4862f81eecf1" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "public"."ActivityLogCustomer" ADD CONSTRAINT "FK_7a2f362548e0b10b102fccee814" FOREIGN KEY ("userIdId") REFERENCES "public"."Customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);

		await queryRunner.query(
			`INSERT INTO public."CustomerProtocol" (idx, login_attempt_interval, login_interval_unit, login_max_retry, mpin_attempt_interval, mpin_interval_unit, mpin_max_retry, created_on, is_active, id, is_obsolete, modified_on) VALUES ('1d102c8e-da7d-4181-a469-4ed7dc79d479', 1, 'd', 3, 1, 'd', 3, '2020-07-03 08:30:59.283479', true, 1, false, '2020-07-03 08:30:59.283479');`,
		);

		await queryRunner.query(
			`INSERT INTO public."SecurityQuestion"(questions) values('What is your favorite Animal name?'),('What is your favorite color?'),('What is your first motorbike brand?'),('Where is your birth place?'),('What is your favorite movie?');`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "public"."ActivityLogCustomer" DROP CONSTRAINT "FK_7a2f362548e0b10b102fccee814"`,
		);
		await queryRunner.query(
			`ALTER TABLE "public"."CustomerDevice" DROP CONSTRAINT "FK_792106daa486dbf4862f81eecf1"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_e5260b33c9a16fbfbbe4b1d876"`,
		);
		await queryRunner.query(`DROP TABLE "public"."SecurityQuestion"`);
		await queryRunner.query(`DROP TABLE "public"."CustomerProtocol"`);
		await queryRunner.query(`DROP TABLE "public"."operationrules"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_91cf16710b46007b27b24a592b"`,
		);
		await queryRunner.query(`DROP TABLE "public"."operationlogs"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_1a941235ff51ea9fe7fc533254"`,
		);
		await queryRunner.query(`DROP TABLE "public"."EMandateTemp"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_41119b10ae884275b110be0334"`,
		);
		await queryRunner.query(`DROP TABLE "public"."EMandate"`);
		await queryRunner.query(`DROP TABLE "public"."CustomerTemp"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_18eab3e60966c54ba42a9e59ef"`,
		);
		await queryRunner.query(`DROP TABLE "public"."CustomerCard"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_20dde3705b7a45b0f36a3b6114"`,
		);
		await queryRunner.query(`DROP TABLE "public"."Answers"`);
		await queryRunner.query(`DROP TABLE "public"."ActivityLogCustomer"`);
		await queryRunner.query(`DROP TABLE "public"."Customer"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_b9f54e792a20e771908b92dd74"`,
		);
		await queryRunner.query(`DROP TABLE "public"."CustomerDevice"`);
	}
}
