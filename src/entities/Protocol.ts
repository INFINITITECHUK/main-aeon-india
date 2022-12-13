import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('CustomerProtocol', { schema: 'public' })
export class Protocol {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string | null;

	@Column('int', {
		nullable: false,
		name: 'login_attempt_interval',
	})
	login_attempt_interval: number;

	@Column('text', {
		nullable: false,
		name: 'login_interval_unit',
	})
	login_interval_unit: string;

	@Column('int', {
		nullable: false,
		name: 'login_max_retry',
	})
	login_max_retry: number;

	@Column('int', {
		nullable: true,
		name: 'mpin_attempt_interval',
	})
	mpin_attempt_interval: number;

	@Column('text', {
		nullable: true,
		name: 'mpin_interval_unit',
	})
	mpin_interval_unit: string;

	@Column('int', {
		nullable: true,
		name: 'mpin_max_retry',
	})
	mpin_max_retry: number;

	@Column('int', {
		nullable: false,
		name: 'otp_expires_in_minutes',
		default: () => 5,
	})
	otp_expires_in_minutes: number;

	@Column('int', {
		nullable: false,
		name: 'otp_lock_period_in_hours',
		default: () => 2,
	})
	otp_lock_period_in_hours: number;

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
