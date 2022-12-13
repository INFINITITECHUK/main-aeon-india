import { Exclude } from 'class-transformer';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('MembershipStatusLog', { schema: 'public' })
export class MembershipStatusLog {
	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;

	@Column('text', {
		name: 'membership_number',
		nullable: false,
	})
	membership_number: string;

	@ManyToOne(() => Customer)
	@JoinColumn()
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
