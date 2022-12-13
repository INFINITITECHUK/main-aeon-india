import {
	Column,
	Entity,
	Generated,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerDevice } from './CustomerDevice.entity';
import { CustomerProfile } from './CustomerProfile.entity';
import { Exclude } from 'class-transformer';

@Entity('Customer', { schema: 'public' })
export class Customer {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('text', { name: 'first_name' })
	first_name: string;

	@Column('text', { name: 'middle_name', nullable: true })
	middle_name: string | null;

	@Column('text', { name: 'last_name' })
	last_name: string;

	@Exclude({ toPlainOnly: true })
	@Column('text', { name: 'password' })
	password: string;

	@Column('boolean', {
		name: 'is_password_set',
		default: () => 'false',
	})
	is_password_set: boolean;

	@Column('boolean', {
		name: 'is_transaction_locked',
		default: () => 'false',
	})
	is_transaction_locked: boolean;

	@Column('text', { name: 'email' })
	email: string;

	@Column('text', { name: 'gender', nullable: true })
	gender: string | null;

	@Column('text', { name: 'mobile_number' })
	mobile_number: string;

	@Column('date', { name: 'date_of_birth', nullable: true })
	date_of_birth: string | null;

	@Column('text', { name: 'id_type' })
	id_type: string;

	@Column('text', { name: 'id_no' })
	id_no: string;

	@Column('date', { name: 'id_expiry_date', nullable: true })
	id_expiry_date: string;

	@Column('text', { name: 'city_state', nullable: true })
	city_state: string;

	@Column('text', { name: 'district', nullable: true })
	district: string;

	@Column('text', {
		name: 'total_sanctioned_limit',
		nullable: true,
		default: '0',
	})
	total_sanctioned_limit: string;

	@Column('text', { name: 'application_number', nullable: true })
	application_number: string;

	@Column('text', {
		name: 'total_disburse_amount',
		nullable: true,
		default: '0',
	})
	total_disburse_amount: string;

	@Column('text', {
		name: 'total_received_amount',
		nullable: true,
		default: '0',
	})
	total_received_amount: string;

	@Column('text', { name: 'available_limit', nullable: true, default: '0' })
	available_limit: string;

	@Column('timestamp without time zone', {
		name: 'limit_update_date',
		default: () => 'now()',
	})
	limit_update_date: Date;

	@Column('timestamp without time zone', {
		name: 'created_on',
		default: () => 'now()',
	})
	created_on: Date;

	@Column('timestamp without time zone', {
		name: 'notification_time',
	})
	notification_time: Date;

	@Column('boolean', {
		name: 'is_notification_sent',
		default: () => 'false',
	})
	is_notification_sent: boolean;

	@Column('boolean', {
		name: 'is_active',
		nullable: true,
		default: () => 'true',
	})
	is_active: boolean | null;

	@Column('boolean', {
		name: 'otp_locked_status',
		nullable: false,
		default: () => 'false',
	})
	otp_locked_status: boolean | null;

	@Column('boolean', {
		name: 'is_mpin_set',
		nullable: true,
		default: () => 'false',
	})
	is_mpin_set: boolean | null;

	@Column('boolean', {
		name: 'is_mpin_reset',
		default: () => 'false',
	})
	is_mpin_reset: boolean;

	@Column('boolean', {
		name: 'is_security_set',
		nullable: false,
		default: () => 'false',
	})
	is_security_set: boolean;

	@Column('text', { name: 'mobile_number_ext', nullable: true })
	mobile_number_ext: string | null;

	@Column('character varying', {
		name: 'loyalty_customer_number',
		nullable: true,
		length: 18,
	})
	loyalty_customer_number: string;

	@Column('boolean', {
		name: 'is_panno_verified',
		nullable: true,
		default: () => 'false',
	})
	is_panno_verified: boolean | null;

	@Column('text', {
		nullable: true,
		name: 'rl_lan_no',
	})
	rl_lan_no: string | null;

	@Column('boolean', {
		name: 'is_initial_terms_agreed',
		default: () => 'false',
	})
	is_initial_terms_agreed: boolean;

	@Column('text', { name: 'panno', nullable: true })
	panno: string | null;

	@Column('text', { name: 'customer_code', nullable: true })
	customer_code: string | null;

	@Column('text', { name: 'profile_picture', nullable: true })
	profile_picture: string | null;

	@Column('double precision', {
		name: 'credit_limit',
		nullable: true,
		default: () => '0',
	})
	credit_limit: number | null;

	@OneToMany(() => CustomerDevice, customerDevice => customerDevice.customer_id)
	customerDevices: CustomerDevice[];

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

	@Column('timestamp without time zone', { //we will use this time for checking
		nullable: true,
		name: 'otp_created_time',
	})
	otp_created_time: Date;

	@OneToOne(() => CustomerProfile, customerProfile => customerProfile.customer)
	customerProfile: CustomerProfile;

	getFullName(){
		const middleNameString = this.middle_name ? ' ' + this.middle_name + ' ' : ' '
		return  this.first_name + middleNameString + this.last_name
	}
}
