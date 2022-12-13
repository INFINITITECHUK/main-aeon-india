import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNewFields1994115359814 implements MigrationInterface {
	name = 'addNewFields1994115359814';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`alter table "Branch"
			add column bank_code text,
			add column branch_code text,
			add column micr_code text,
			add column address text,
			add column std_code text,
			add column contact text;`);

		await queryRunner.query(`alter table "EMandate"
			add column bank_code text,
			add column branch_code text;`);

		await queryRunner.query(`alter table "CancellationRequests"
			add column interest_rate text;`);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
