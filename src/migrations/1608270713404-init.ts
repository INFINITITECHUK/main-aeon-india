import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1608270713404 implements MigrationInterface {
	name = 'init1608270713404';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."MembershipLevels" ("id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "membership_type" text NOT NULL, "points_range" text NOT NULL,"points_difference" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_f3782c441340fa9d7a90b47f96f" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_a9a75211d907ec907c5a5b3f45" ON "public"."MembershipLevels" ("idx") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "public"."CustomerDevice"`);
	}
}
