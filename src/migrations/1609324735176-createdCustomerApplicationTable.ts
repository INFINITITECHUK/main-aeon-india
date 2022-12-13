import { MigrationInterface, QueryRunner } from 'typeorm';

export class createdCustomerApplicationTable1609324735176
	implements MigrationInterface {
	name = 'createdCustomerApplicationTable1609324735176';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerApplication" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "customer_idx" uuid NOT NULL, "application_number" text, "application_id" text, "customer_number" text, "sanctioned_amount" text,"interest_rate" text, "installment_amount" text, "customer_name" text, CONSTRAINT "UQ_11eaeaabd63695b11278c8326eb" UNIQUE ("idx"), CONSTRAINT "PK_593651eff09a9db545268d02705" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_11eaeaabd63695b11278c8326e" ON "public"."CustomerApplication" ("idx") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
