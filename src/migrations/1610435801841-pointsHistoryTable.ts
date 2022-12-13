import { MigrationInterface, QueryRunner } from 'typeorm';

export class pointsHistoryTable1610435801841 implements MigrationInterface {
	name = 'pointsHistoryTable1610435801841';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."CustomerPointsHistory" ("id" SERIAL NOT NULL, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "is_obsolete" boolean NOT NULL DEFAULT false, "customer_idx" uuid NOT NULL, "reward_point" integer , "total_points" text, "points_elapsed" text, "point_redemption" text, "point_redeemed" text, "point_available_redemption" text, CONSTRAINT "PK_fefc3e4a0bf686795219bc12734" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
