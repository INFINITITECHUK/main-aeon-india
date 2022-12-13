import { MigrationInterface, QueryRunner } from 'typeorm';

export class addedNewCustomerProfileTable1605076290346
	implements MigrationInterface {
	name = 'addedNewCustomerProfileTable1605076290346';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerProfile" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "customer_info_file_number" character varying(18), "marital_status" character varying(255), "constitution_code" character varying(8), "nationality" character varying(255), "identification_type" character varying(255), "identification_number" character varying(15), "country_of_issue" character varying(255), "address_type" character varying(255), "address1" character varying(255), "pin_code" character varying(8), "state" character varying(30), "resident_status" character varying(255), "land_mark" character varying(100), "years_at_current_state" character varying(255), "months_at_current_state" character varying(255), "phone1" character varying(255), "occupation_type" character varying(255), "employer_code" character varying(255), "nature_of_business" character varying(255), "industry" character varying(255), "registration_number" character varying(255), "organization_name" character varying(255), "nature_of_profession" character varying(255), "net_income" character varying(43), "interest_charge_method" character varying(255), "reference_name" character varying(255), "reference_relationship" character varying(255), "reference_phone_number" character varying(14), "reference_email" character varying(255), "ifsc" character varying(50), "bank_name_id" character varying(50), "customer" integer, CONSTRAINT "REL_636fdf18c8fdf6b346afa0e297" UNIQUE ("customer"), CONSTRAINT "PK_1406acc806cda6058ca75d3a000" PRIMARY KEY ("id"))`,
		);

		await queryRunner.query(
			`ALTER TABLE "public"."CustomerProfile" ADD CONSTRAINT "FK_636fdf18c8fdf6b346afa0e297f" FOREIGN KEY ("customer") REFERENCES "public"."Customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
