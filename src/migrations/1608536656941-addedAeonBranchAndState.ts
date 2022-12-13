import { MigrationInterface, QueryRunner } from 'typeorm';
import { insertAeonBranch } from '../seeds/AeonBranch.seed';
import { insertStateCodes } from '../seeds/insertStateCodes.seed';

const formattedInsertAeonBranchQueries = insertAeonBranch
	.replace(/(\r\n|\n|\r)/gm, ' ') // remove newlines
	.replace(/\s+/g, ' '); // excess white space

const formattedInsertStateCodesQueries = insertStateCodes
	.replace(/(\r\n|\n|\r)/gm, ' ') // remove newlines
	.replace(/\s+/g, ' '); // excess white space

export class addedAeonBranchAndState1608536656941
	implements MigrationInterface {
	name = 'addedAeonBranchAndState1608536656941';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "public"."AeonBranch" ("id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_6fae58fcb8a33cbe6961f93e48b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_ff3d4ce6d7ed943fa124207234" ON "public"."AeonBranch" ("idx") `,
		);

		await queryRunner.query(
			`CREATE TABLE "public"."StateCode" ("id" SERIAL NOT NULL, "is_obsolete" boolean NOT NULL DEFAULT false, "modified_on" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "idx" uuid NOT NULL DEFAULT uuid_generate_v4(), "state_code" text NOT NULL, "state_name" text NOT NULL, "country" text NOT NULL, "region" text NOT NULL, "created_on" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_8edb94ad4c5f9560a179e6fbe85" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_adcbc279110c9db917e908593d" ON "public"."StateCode" ("idx") `,
		);

		await queryRunner.query(formattedInsertAeonBranchQueries);
		await queryRunner.query(formattedInsertStateCodesQueries);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
