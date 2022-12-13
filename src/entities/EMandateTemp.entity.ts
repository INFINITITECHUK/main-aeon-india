import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { EncryptionTransformer } from 'typeorm-encrypted';
import config from '../config';

@Index(['idx'], { unique: true })
@Entity('EMandateTemp', { schema: 'public' })
export class EMandateTemp {
	@Column('uuid', { name: 'idx', unique: true })
	@Generated('uuid')
	idx: string;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('character varying', { name: 'full_name', length: 100 })
	full_name: string;

	@Column('uuid', { name: 'branch_idx' })
	branch_idx: string;

	@Column('character varying', { name: 'account_type' })
	account_type: string;

	@Column('character varying', {
		name: 'account_number',
		length: 50,
		transformer: new EncryptionTransformer({
			key: 'e41c966f21f9e1577802463f8924e6a3fe3e9751f201304213b2f845d8841d61',
			algorithm: 'aes-256-cbc',
			ivLength: 16,
			iv: config.db.iv,
		}),
	})
	account_number: string;

	@Column('boolean', { name: 'is_verified' })
	is_verified: boolean;

	@Column('integer', { name: 'customer_temp_id' })
	customer_temp_id: number;

	@Column('text', {
		nullable: false,
		name: 'status',
	})
	status: string;

	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;
	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	@Exclude({ toPlainOnly: true })
	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'penny_drop_success',
	})
	penny_drop_success: boolean;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'emandate_success',
	})
	emandate_success: boolean;

	@Column('jsonb', {
		name: 'pennydrop_failure_data',
		array: true,
		nullable: true,
	})
	pennydrop_failure_data: object[];

	@Column('jsonb', {
		name: 'emandate_failure_data',
		array: true,
		nullable: true,
	})
	emandate_failure_data: object[];
}
