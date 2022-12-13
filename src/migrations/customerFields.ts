import { MigrationInterface, QueryRunner } from 'typeorm';

export class customerFields implements MigrationInterface {
	name = 'customerFields';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`alter table "Customer"
			add id_expiry_date date,
			add city_state text,
			add district text,
			add notification_time timestamp,
			add is_notification_sent boolean default 'false' not null;`);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
