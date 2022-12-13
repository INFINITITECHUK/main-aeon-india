import { MigrationInterface, QueryRunner } from 'typeorm';

export class addedInCustomerProfile1607959353358 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "public"."CustomerProfile" 
            add "duration_at_current_city" text,
            add "employer_name" text,
            add "month_duration_at_current_city" text,
            add "address_proof" text,
            add "permanent_address" text,
            add "permanent_landmark" text,
            add "permanent_pincode" text,
            add "permanent_state" text,
            add "permanent_duration_at_current_address" text,
            add "permanent_address_proof" text,
            add "permanent_residence_status" text,
            add "bank_name" text,
            add "loan_details" text,
            add "preferred_branch" text,
            add "monthly_income" text,
            add "years_in_job" text,
            add "months_in_job" text,
            add "office_address" text,
            add "office_landmark" text,
            add "office_pincode" text,
            add "office_state" text,
            add "income_proof" text,
            add "reference_address" text,
            add "reference_landmark" text,
            add "reference_pincode" text,
            add "reference_state" text,
            add "reference2_name" text,
            add "reference2_mobile_number" text,
            add "reference2_address" text,
            add "reference2_landmark" text,
            add "reference2_pincode" text,
            add "reference2_state" text,
            add "reference2_relationship" text,
            add "has_terms_aggreed" boolean default 'false' not null
            `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
