import { Exclude } from 'class-transformer';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { EncryptionTransformer } from 'typeorm-encrypted';
import config from '../config';

@Entity('CustomerMembershipLogs', { schema: 'public' })
export class CustomerMembershipLogs {
	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;

	@Column('text', {
		name: 'membership_number',
		transformer: new EncryptionTransformer({
			key: config.db.key,
			algorithm: 'aes-256-cbc',
			ivLength: 16,
		}),
		nullable: false,
	})
	membership_number: string;

	@ManyToOne(() => Customer)
	@JoinColumn({ name: 'customer' })
	customer: Customer;

	@Column('text', {
		nullable: false,
		name: 'membership_status',
	})
	membership_status: string;

	@Column('text', {
		nullable: false,
		name: 'update_type',
	})
	update_type: string;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_notified',
	})
	is_notified: boolean;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;
}
