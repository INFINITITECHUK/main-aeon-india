import { MigrationInterface, QueryRunner } from 'typeorm';

export class applicaiton1610520949947 implements MigrationInterface {
	name = 'applicaiton1610520949947';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "public"."CustomerApplication" 
						add "can_add_bank" boolean NOT NULL DEFAULT false,
            add "approval_status" text NOT NULL DEFAULT 'PENDING'`);
		await queryRunner.query(`ALTER TABLE "public"."EMandate" 
            add "penny_drop_success" boolean NOT NULL DEFAULT false, 
            add "emandate_success" boolean NOT NULL DEFAULT false,
            add "pennydrop_failure_data" text array default array[]::text[],
            add "emandate_failure_data" text array default array[]::text[]`);
		await queryRunner.query(`ALTER TABLE "public"."EMandateTemp" 
            add "penny_drop_success" boolean NOT NULL DEFAULT false, 
            add "emandate_success" boolean NOT NULL DEFAULT false,
            add "pennydrop_failure_data" text array default array[]::text[],
            add "emandate_failure_data" text array default array[]::text[]`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
