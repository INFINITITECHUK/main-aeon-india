import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { EncryptionTransformer } from 'typeorm-encrypted';
import { Exclude } from 'class-transformer';
import config from '../config';
import { Status } from '@common/constants/status.enum';

@Index(['account_number', 'customer_idx', 'idx'], { unique: true })
@Entity('EMandate', { schema: 'public' })
export class EMandate {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('uuid', { name: 'customer_idx', nullable: true })
	customer_idx: string | null;

	@Column('text', { name: 'full_name', nullable: true })
	full_name: string;

	@Column('uuid', { name: 'branch_idx', nullable: true })
	branch_idx: string;

	@Column('text', {
		name: 'account_number',

		transformer: new EncryptionTransformer({
			key: config.db.key,
			algorithm: 'aes-256-cbc',
			ivLength: 16,
			// iv: config.db.iv
		}),
	})
	account_number: string;

	@Column('text', { name: 'account_type' })
	account_type: string;

	@Column('text', {
		nullable: true,
		default: 'PENDING',
		name: 'status',
	})
	status: string;

	@Column('boolean', {
		nullable: true,
		default: () => 'false',
		name: 'is_verified',
	})
	is_verified: boolean;

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
	@Column('text', {
		nullable: false,
		default: () => Status.PENDING,
		name: 'penny_drop_status',
	})
	penny_drop_status: Status;

	@Exclude({ toPlainOnly: true })
	@Column('text', {
		nullable: false,
		default: () => Status.PENDING,
		name: 'emandate_status',
	})
	emandate_status: Status;

	@Column('text', {
		name: 'pennydrop_failure_data',
		array: true,
		nullable: true,
	})
	pennydrop_failure_data: string[];

	@Column('text', {
		name: 'emandate_failure_data',
		array: true,
		nullable: true,
	})
	emandate_failure_data: string[];

	@Column('text', {
		name: 'pennydrop_success_data',
		nullable: true,
	})
	pennydrop_success_data: string;

	@Column('text', {
		name: 'emandate_success_data',
		nullable: true,
	})
	emandate_success_data: string;

	@Column('text', {
		name: 'user_identifier',
		nullable: true,
	})
	user_identifier: string;

	@Column('boolean', {
		nullable: false,
		default: () => Status.INACTIVE,
		name: 'physical_mandate_verification',
	})
	physical_mandate_verification: Status;

	@Column('text', { name: 'branch_code' })
	branch_code: string;

	@Column('text', { name: 'bank_code' })
	bank_code: string;
}
