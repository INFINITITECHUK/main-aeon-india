import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNewFields1994115359814 implements MigrationInterface {
	name = 'addNewFields1994115359814';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`alter table "Customer"
    add column application_number text,add column total_sanctioned_limit text default '0',
    add column total_disburse_amount text default '0',
    add column total_received_amount text default '0',
    add column available_limit text default '0',
    add column limit_update_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
`);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
