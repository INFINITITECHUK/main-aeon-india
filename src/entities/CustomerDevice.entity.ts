import {
	Column,
	Entity,
	Generated,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Exclude } from 'class-transformer';
import { EncryptionTransformer } from 'typeorm-encrypted';
import config from '../config';

@Entity('CustomerDevice', { schema: 'public' })
@Index(['idx'], { unique: true })
export class CustomerDevice {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@OneToOne(() => Customer, customer => customer.id, {})
	@JoinColumn({ name: 'customer_id' })
	customer_id: bigint;

	@Column('text', {
		nullable: true,
		name: 'phone_brand',
	})
	phone_brand: string | null;

	@Column('text', {
		nullable: true,
		name: 'phone_os',
	})
	phone_os: string | null;

	@Column('text', {
		nullable: true,
		name: 'os_version',
	})
	os_version: string | null;

	@Column('text', {
		name: 'deviceid',
		transformer: new EncryptionTransformer({
			key: config.db.key,
			algorithm: 'aes-256-cbc',
			ivLength: 16,
		}),
	})
	deviceid: string;

	@Column('text', {
		nullable: true,
		name: 'fcm_token',
	})
	fcm_token: string;

	@Column('text', {
		nullable: false,
		name: 'otp',
	})
	otp: string;

	@Column('text', {
		name: 'token',
	})
	token: string;

	@Column('text', {
		nullable: true,
		name: 'otp_type',
	})
	otp_type: string | null;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'otp_status',
	})
	otp_status: boolean;

	@Column('bigint', {
		nullable: true,
		default: () => '0',
		name: 'total_attempt',
	})
	total_attempt: string | null;

	@Column('timestamp without time zone', { //we will user otp_created_time of customer table for login
		nullable: false,
		name: 'otp_created_at',
	})
	otp_created_at: Date;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

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
