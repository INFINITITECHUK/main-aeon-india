import {
	Column,
	Entity,
	Generated,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Customer } from './customer.entity';

@Entity('ActivityLogCustomer', { schema: 'public' })
export class ActivityLog {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string | null;

	@ManyToOne(() => Customer)
	@JoinColumn()
	user_id: Customer;

	@Column('text', {
		nullable: true,
		name: 'activity_type',
	})
	activity_type: string | null;

	@Column('boolean', {
		nullable: true,
		name: 'status',
	})
	status: boolean | null;

	@Column('text', {
		nullable: true,
		name: 'login_type',
	})
	login_type: string | null;

	@Column('text', {
		nullable: true,
		name: 'ip_address',
	})
	ip_address: string | null;

	@Column('text', {
		nullable: true,
		name: 'device_id',
	})
	device_id: string | null;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('boolean', {
		nullable: false,
		default: () => 'true',
		name: 'is_active',
	})
	is_active: boolean;

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
}
