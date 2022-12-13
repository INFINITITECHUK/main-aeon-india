import { MigrationInterface, QueryRunner } from 'typeorm';

export class addedCustomerProfile1604375416211 implements MigrationInterface {
	name = 'addedCustomerProfile1604375416211';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`alter table "CustomerCard" add "full_name" text, add "card_status" text, add "total_points" text, add "points_elapsed" text, add "point_redemption" text, add "registration_date" text, add "update_date" date, add "previous_membership_status" text, add "point_redeemed" text, add "point_available_redemption" text`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
