import { MigrationInterface, QueryRunner } from 'typeorm';

export class applicaiton1610520949947 implements MigrationInterface {
	name = 'applicaiton1610520949947';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "public"."EMandate" 
            DROP "penny_drop_success", 
            DROP "emandate_success" ,
            ADD "pennydrop_success_data" text,
            ADD "emandate_success_data" text,
            ADD "penny_drop_status" text NOT NULL DEFAULT 'PENDING',
            add "emandate_status" text NOT NULL DEFAULT 'PENDING';`);
		await queryRunner.query(`ALTER TABLE "public"."EMandateTemp" 
            DROP "penny_drop_success", 
            DROP "emandate_success" ,
            ADD "pennydrop_success_data" text,
            ADD "emandate_success_data" text,
            ADD "penny_drop_status" text NOT NULL DEFAULT 'PENDING',
            add "emandate_status" text NOT NULL DEFAULT 'PENDING';`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
