import { MigrationInterface, QueryRunner } from 'typeorm';

export class counter1608523718375 implements MigrationInterface {
	name = 'counter1608523718375';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."Counter" ("id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "reference_id_counter" text NOT NULL, "loan_id_counter" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_a521c3eab3e4b5f23e550b75828" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_e9902a3d80b6d0bf8dc4ddd75f" ON "public"."Counter" ("idx") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "public"."InterestRateRangeDetails" DROP CONSTRAINT "FK_4f2e9f5148807d8bba8b875cd74"`,
		);
		await queryRunner.query(
			`ALTER TABLE "public"."ActivityLogCustomer" DROP CONSTRAINT "FK_9fed5cf163855fde3bf9527b61f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "public"."CustomerProfile" DROP CONSTRAINT "FK_636fdf18c8fdf6b346afa0e297f"`,
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
			`DROP INDEX "public"."IDX_a9a75211d907ec907c5a5b3f45"`,
		);
		await queryRunner.query(`DROP TABLE "public"."MembershipLevels"`);
		await queryRunner.query(`DROP TABLE "public"."InterestRateDetails"`);
		await queryRunner.query(`DROP TABLE "public"."InterestRateRangeDetails"`);
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
			`DROP INDEX "public"."IDX_e9902a3d80b6d0bf8dc4ddd75f"`,
		);
		await queryRunner.query(`DROP TABLE "public"."Counter"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_20dde3705b7a45b0f36a3b6114"`,
		);
		await queryRunner.query(`DROP TABLE "public"."Answers"`);
		await queryRunner.query(`DROP TABLE "public"."ActivityLogCustomer"`);
		await queryRunner.query(`DROP TABLE "public"."CustomerProfile"`);
		await queryRunner.query(`DROP TABLE "public"."Customer"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_b9f54e792a20e771908b92dd74"`,
		);
		await queryRunner.query(`DROP TABLE "public"."CustomerDevice"`);
	}
}
