import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNewFields1994115359814 implements MigrationInterface {
	name = 'addNewFields1994115359814';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`alter table "TransactionFiles"
			drop "transaction_id", 
			drop "product_type_id", 
			add column product_code text,
			add column customer_idx text;`);

		await queryRunner.query(`alter table "CustomerProfile"
			drop customer_id,
			add "customer_id" text`);

		await queryRunner.query(
			`alter table "CustomerProfile" add income_proof_updated boolean default 'false' not null`,
		);

		await queryRunner.query(
			`alter table "Customer" add otp_locked_status boolean default 'false' not null`,
		);

		await queryRunner.query(
			`alter table "CustomerProtocol" add otp_expires_in_minutes integer default 5 not null, add otp_lock_period_in_hours integer default 2 not null`,
		);

		await queryRunner.query(
			`alter table "Customer" add is_mpin_reset boolean default 'false' not null`,
		);

		await queryRunner.query(
			`alter table "Customer" add is_initial_terms_agreed boolean default 'false' not null`,
		);

		//added before deployment
		await queryRunner.query(
			`ALTER TABLE public."Customer"
				add column IF NOT EXISTS notification_time timestamp without time zone,
				add column IF NOT EXISTS is_notification_sent boolean,
				add column IF NOT EXISTS loyalty_customer_number character varying(255) COLLATE pg_catalog."default";`,
		);

		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS  loyalty_customer_number character varying(18) COLLATE pg_catalog."default",
				add column IF NOT EXISTS  reference_mobile_number character varying(14) COLLATE pg_catalog."default",
				add column IF NOT EXISTS  bank_branch_identifier_code character varying(255) COLLATE pg_catalog."default";`,
		);

		await queryRunner.query(
			`ALTER TABLE "TransactionDetail" 
			ALTER total_payable SET DEFAULT 0;`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionDetail" 
			ALTER interest_amount SET DEFAULT 0;`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionDetail" 
			ALTER refund_charge SET DEFAULT 0`,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionDetail" 
				ALTER amount SET DEFAULT 0; `,
		);
		await queryRunner.query(
			`ALTER TABLE "TransactionDetail" 
			ALTER outstanding_balance SET DEFAULT 0;`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerPointsHistory"
			ALTER reward_point SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerPointsHistory"
			ALTER points_elapsed SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerPointsHistory"
			ALTER point_redemption SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerPointsHistory"
			ALTER point_redeemed SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerPointsHistory"
			ALTER point_available_redemption SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerCard"
			ALTER reward_point SET DEFAULT 0; `,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerCard"
			ALTER total_points SET DEFAULT '0'; `,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerCard"
			ALTER points_elapsed SET DEFAULT '0'; `,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerCard"
			ALTER point_redemption SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerCard"
			ALTER point_redeemed SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerCard"
			ALTER point_available_redemption SET DEFAULT '0'; `,
		);
		await queryRunner.query(
			`ALTER TABLE "EMandate"
			ALTER emandate_failure_data SET DEFAULT '{}'; `,
		);
		await queryRunner.query(
			`ALTER TABLE "EMandate"
			ALTER pennydrop_failure_data SET DEFAULT '{}'; `,
		);
		await queryRunner.query(
			`ALTER TABLE "Customer"
			ALTER mobile_number_ext SET DEFAULT '91';`,
		);
		await queryRunner.query(
			`ALTER TABLE "Customer"
			ALTER is_notification_sent SET DEFAULT false;`,
		);
		await queryRunner.query(
			`ALTER TABLE "CustomerProfile"
			ALTER monthly_income SET DEFAULT '0';`,
		);
		await queryRunner.query(
			`ALTER TABLE "Counter"
			add column IF NOT EXISTS customer_onboarding_hour_24_format text default '24' not null,
			add column IF NOT EXISTS customer_onboarding_minute text default '0' not null`,
		);

		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS total_income text,
				add column IF NOT EXISTS reference_address_type text,
				add column IF NOT EXISTS reference2_address_type text`,
		);

		await queryRunner.query(
			`CREATE TABLE "public"."CustomerMembershipLogs" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  "customer" integer,membership_number text not null,membership_status text not null,update_type text not null,is_notified boolean default 'false', CONSTRAINT "PK_1406acc806cda6058ca65d3a000" PRIMARY KEY ("id"))`,
		);

		await queryRunner.query(
			`ALTER TABLE "public"."CustomerMembershipLogs" ADD CONSTRAINT "FK_636fdf18c8fdf6b346afa0e296f" FOREIGN KEY ("customer") REFERENCES "public"."Customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS resident_status text,
				add column IF NOT EXISTS reference_resident_status text,
				add column IF NOT EXISTS reference2_resident_status text`,
		);

		await queryRunner.query(
			`ALTER TABLE public."Customer"
				add column IF NOT EXISTS otp_created_time timestamp without time zone`,
		);

		await queryRunner.query(
			`ALTER TABLE public."CustomerCard"
				add column IF NOT EXISTS is_membership_changed boolean default 'false' not null`,
		);

		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS city_code text default ''`,
		);
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS office_residence_status text default ''`,
		);
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS years_in_business text default ''`,
		);
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS work_experience text default ''`,
		);
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS reference_city_code text default ''`,
		);
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS reference2_city_code text default ''`,
		);
		await queryRunner.query(
			`ALTER TABLE public."Customer"
				add column IF NOT EXISTS rl_lan_no text`,
		);

		await queryRunner.query(
			`ALTER TABLE "Customer" 
				ALTER middle_name SET DEFAULT '',
				ALTER city_state SET DEFAULT '',
				ALTER district SET DEFAULT '',
				ALTER mobile_number_ext SET DEFAULT '91',
				ALTER profile_picture SET DEFAULT '',
				ALTER application_number SET DEFAULT '',
				ALTER receipt_no SET DEFAULT '',
				ALTER transaction_value_date SET DEFAULT '',
				ALTER rl_lan_no SET DEFAULT '';`,
		);
		
		await queryRunner.query(
			`CREATE TABLE public."ThirdPartyDefaults"
			(
				id SERIAL NOT NULL,
				is_obsolete boolean NOT NULL DEFAULT false,
				modified_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
				idx uuid NOT NULL DEFAULT uuid_generate_v4(),
				is_active boolean NOT NULL DEFAULT true,
				created_on timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
				questions text COLLATE pg_catalog."default" NOT NULL,
				product_processor text COLLATE pg_catalog."default" NOT NULL,
				operation_type text COLLATE pg_catalog."default" NOT NULL,
				principal_recovery_flag text COLLATE pg_catalog."default" NOT NULL,
				principal_recovery_amount_type text COLLATE pg_catalog."default" NOT NULL,
				sub_payment_mode text COLLATE pg_catalog."default" NOT NULL,
				CONSTRAINT "PK_5fabdc18fbea6d4541bdd26a959" PRIMARY KEY (id)
			)
			`,
		);
		await queryRunner.query(
			`INSERT INTO public."ThirdPartyDefaults"
			(id, is_obsolete, modified_on, idx, is_active, created_on, questions, product_processor, operation_type, principal_recovery_flag, principal_recovery_amount_type, sub_payment_mode)
			VALUES(2, false, '2021-01-07 11:15:06.653', '89ab09e5-1b0f-4397-b394-31c618f0c4f9'::uuid, true, '2021-01-07 11:15:06.653', 'what', 'EXTERNAL', 'CI', '1', 'D', 'NEFT');
			`,
		);
		
		await queryRunner.query(
			`
			ALTER TABLE "CustomerProfile" 
				ALTER marital_status SET DEFAULT '',
				ALTER constitution_code SET DEFAULT '',
				ALTER nationality SET DEFAULT '',
				ALTER country_of_issue SET DEFAULT '',
				ALTER address_type SET DEFAULT '',
				ALTER address1 SET DEFAULT '',
				ALTER pin_code SET DEFAULT '',
				ALTER state SET DEFAULT '',
				ALTER resident_status SET DEFAULT '',
				ALTER land_mark SET DEFAULT '',
				ALTER years_at_current_state SET DEFAULT '',
				ALTER months_at_current_state SET DEFAULT '',
				ALTER phone1 SET DEFAULT '',
				ALTER occupation_type SET DEFAULT '',
				ALTER employer_code SET DEFAULT '',
				ALTER nature_of_business SET DEFAULT '',
				ALTER industry SET DEFAULT '',
				ALTER registration_number SET DEFAULT '',
				ALTER organization_name SET DEFAULT '',
				ALTER nature_of_profession SET DEFAULT '',
				ALTER net_income SET DEFAULT '',
				ALTER interest_charge_method SET DEFAULT '',
				ALTER reference_name SET DEFAULT '',
				ALTER reference_relationship SET DEFAULT '',
				ALTER reference_phone_number SET DEFAULT '',
				ALTER reference_email SET DEFAULT '',
				ALTER ifsc SET DEFAULT '',
				ALTER bank_name_id SET DEFAULT '',
				ALTER salutation SET DEFAULT '',
				ALTER customer_type SET DEFAULT '',
				ALTER marital_status_code SET DEFAULT '',
				ALTER inst_description SET DEFAULT '',
				ALTER profession SET DEFAULT '',
				ALTER constitution_description SET DEFAULT '',
				ALTER phone_number SET DEFAULT '',
				ALTER preferred_language SET DEFAULT '',
				ALTER customer_category SET DEFAULT '',
				ALTER customer_segment SET DEFAULT '',
				ALTER address_proof SET DEFAULT '',
				ALTER permanent_address SET DEFAULT '',
				ALTER permanent_pincode SET DEFAULT '',
				ALTER permanent_state SET DEFAULT '',
				ALTER permanent_address_proof SET DEFAULT '',
				ALTER bank_name SET DEFAULT '',
				ALTER loan_details SET DEFAULT '',
				ALTER preferred_branch SET DEFAULT '',
				ALTER office_address SET DEFAULT '',
				ALTER office_landmark SET DEFAULT '',
				ALTER office_pincode SET DEFAULT '',
				ALTER office_state SET DEFAULT '',
				ALTER income_proof SET DEFAULT '',
				ALTER reference_address SET DEFAULT '',
				ALTER reference_landmark SET DEFAULT '',
				ALTER reference_landmark SET DEFAULT '',
				ALTER reference_pincode SET DEFAULT '',
				ALTER reference_state SET DEFAULT '',
				ALTER reference2_name SET DEFAULT '',
				ALTER reference2_address SET DEFAULT '',
				ALTER reference2_landmark SET DEFAULT '',
				ALTER reference2_pincode SET DEFAULT '',
				ALTER reference2_state SET DEFAULT '',
				ALTER reference2_relationship SET DEFAULT '',
				ALTER permanent_landmark SET DEFAULT '',
				ALTER permanent_residence_status SET DEFAULT '',
				ALTER country_code SET DEFAULT '',
				ALTER mobile_number_ext SET DEFAULT '91',
				ALTER isd_code SET DEFAULT '',
				ALTER phone_number_type SET DEFAULT '',
				ALTER primary_telephone SET DEFAULT '',
				ALTER std_code SET DEFAULT '',
				ALTER accomodation_type SET DEFAULT '',
				ALTER address_line1 SET DEFAULT '',
				ALTER address_line2 SET DEFAULT '',
				ALTER address_line3 SET DEFAULT '',
				ALTER address_line4 SET DEFAULT '',
				ALTER area SET DEFAULT '',
				ALTER city SET DEFAULT '',
				ALTER country SET DEFAULT '',
				ALTER district SET DEFAULT '',
				ALTER full_address SET DEFAULT '',
				ALTER landmark SET DEFAULT '',
				ALTER region SET DEFAULT '',
				ALTER residence_type SET DEFAULT '',
				ALTER taluka SET DEFAULT '',
				ALTER village SET DEFAULT '',
				ALTER zip_code SET DEFAULT '',
				ALTER full_name SET DEFAULT '',
				ALTER employer_name SET DEFAULT '',
				ALTER reference_mobile_number SET DEFAULT '',
				ALTER bank_branch_identifier_code SET DEFAULT '',
				ALTER reference_address_type SET DEFAULT '',
				ALTER reference2_address_type SET DEFAULT '',
				ALTER reference_resident_status SET DEFAULT '',
				ALTER reference2_resident_status SET DEFAULT '',
				ALTER city_code SET DEFAULT '',
				ALTER office_residence_status SET DEFAULT '';
			`,
		);

		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS reference_address_type_code text,
				add column IF NOT EXISTS reference_resident_status_code text,
				add column IF NOT EXISTS state_code text;
			`,
		);
		await queryRunner.query(
			`ALTER TABLE public."CustomerProfile"
				add column IF NOT EXISTS reference2_address_type_code text default '',
				add column IF NOT EXISTS reference2_resident_status_code text default '';
				add column IF NOT EXISTS industry_code text default '';
			`,
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
