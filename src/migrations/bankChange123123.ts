import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNewFields1994115359814 implements MigrationInterface {
	name = 'addNewFields1994115359814';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`alter table "Bank"
			add column enash_net_banking_code text default '',
			add column enash_debit_card_code text default '';`);

		await queryRunner.query(`alter table "EMandate"
			drop "penny_drop_status",
			add "penny_drop_status" text NOT NULL DEFAULT 'APPROVED',
			add column user_identifier text default '',
			add column "physical_mandate_verification" text default 'INACTIVE';`);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
