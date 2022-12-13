import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('CustomerTemp', { schema: 'public' })
export class CustomerTemp {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('text', {
		nullable: false,
		name: 'mobile_number_ext',
	})
	mobile_number_ext: string;

	@Column('boolean', {
		name: 'is_panno_verified',
		nullable: true,
	})
	is_panno_verified: boolean | null;

	@Column('boolean', {
		name: 'is_transaction_locked',
		nullable: true,
	})
	is_transaction_locked: boolean | null;

	@Column('text', { name: 'panno', nullable: true })
	panno: string | null;

	@Column('bigint', {
		nullable: true,
		name: 'customer_id',
	})
	customer_id: string | null;

	@Column('text', {
		nullable: false,
		name: 'customer_code',
	})
	customer_code: string;

	@Column('double precision', {
		nullable: true,
		default: () => 0,
		name: 'credit_limit',
	})
	credit_limit: number | null;

	@Column('text', {
		nullable: true,
		name: 'first_name',
	})
	first_name: string | null;

	@Column('text', {
		nullable: true,
		name: 'middle_name',
	})
	middle_name: string | null;

	@Column('text', {
		nullable: true,
		name: 'last_name',
	})
	last_name: string | null;

	@Column('text', {
		nullable: true,
		name: 'email',
	})
	email: string | null;

	@Column('text', {
		nullable: true,
		name: 'gender',
	})
	gender: string | null;

	@Column('text', {
		nullable: true,
		name: 'mobile_number',
	})
	mobile_number: string | null;

	@Column('date', {
		nullable: true,
		name: 'date_of_birth',
	})
	date_of_birth: string | null;

	@Column('text', {
		nullable: true,
		name: 'id_type',
	})
	id_type: string | null;

	@Column('text', {
		nullable: true,
		name: 'id_no',
	})
	id_no: string | null;

	@Column('date', {
		nullable: true,
		name: 'id_expiry_date',
	})
	id_expiry_date: string | null;

	@Column('text', {
		nullable: true,
		name: 'city_state',
	})
	city_state: string | null;

	@Column('text', {
		nullable: true,
		name: 'district',
	})
	district: string | null;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('text', {
		nullable: false,
		name: 'status',
	})
	status: string;

	@Column('uuid', {
		nullable: true,
		name: 'created_by',
	})
	created_by: string | null;

	@Column('text', {
		nullable: false,
		name: 'operation',
	})
	operation: string;

	@Column('text', {
		nullable: true,
		name: 'rejection_reason',
	})
	rejection_reason: string;

	@Column('text', {
		nullable: true,
		name: 'profile_picture',
	})
	profile_picture: string;

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
