import { MigrationInterface, QueryRunner } from 'typeorm';

export class addIstransactionLocked1594115359814 implements MigrationInterface {
	name = 'addIstransactionLocked1594115359814';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`alter table "Customer"
	add is_transaction_locked boolean default 'false' not null`);
		await queryRunner.query(`alter table "CustomerTemp"
	add is_transaction_locked boolean`);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
