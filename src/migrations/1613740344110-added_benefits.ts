import { MigrationInterface, QueryRunner } from 'typeorm';

export class addedBenefits1613740344110 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."Benefits" ("idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"membership" text not null,"benefits" text array default array[]::text[], CONSTRAINT "UQ_11eaeaabd63695b11278c8325eb" UNIQUE ("idx"), CONSTRAINT "PK_593651eff09a9db545268d02706" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_11eaeaabd63695b11278c8325e" ON "public"."Benefits" ("idx") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
