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

@Index(['membership_number', 'idx', 'customer_idx'], { unique: true })
@Entity('CustomerCard', { schema: 'public' })
export class CustomerCard {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('uuid', { name: 'idx' })
	@Generated('uuid')
	idx: string;

	@Column('timestamp with time zone', {
		name: 'created_on',
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
	})
	created_on: Date;

	@Exclude({ toPlainOnly: true })
	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;

	@Column('boolean', {
		nullable: false,
		default: () => 'true',
		name: 'is_active',
	})
	is_active: boolean;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	@Column('uuid', {
		name: 'customer_idx',
	})
	customer_idx: string;

	@Column('character varying', { name: 'membership_type', length: 16 })
	membership_type: string;

	@Column('text', {
		name: 'membership_number',
		transformer: new EncryptionTransformer({
			key: config.db.key,
			algorithm: 'aes-256-cbc',
			ivLength: 16,
		}),
	})
	membership_number: string;

	@Column('date', { name: 'valid_till', nullable: true })
	valid_till: string;

	@Column('integer', { name: 'reward_point', nullable: true })
	reward_point: number;

	@Column('text', { name: 'full_name', nullable: true })
	full_name: string;

	@Column('text', { name: 'card_status', nullable: true })
	card_status: string;

	@Column('text', { name: 'total_points', nullable: true })
	total_points: string;

	@Column('text', { name: 'points_elapsed', nullable: true })
	points_elapsed: string;

	@Column('text', { name: 'point_redemption', nullable: true })
	point_redemption: string;

	@Column('text', { name: 'registration_date', nullable: true })
	registration_date: string;

	@Column('date', { name: 'update_date', nullable: true })
	update_date: Date;

	@Column('text', { name: 'previous_membership_status', nullable: true })
	previous_membership_status: string;

	@Column('text', { name: 'point_redeemed', nullable: true })
	point_redeemed: string;

	@Column('text', { name: 'point_available_redemption', nullable: true })
	point_available_redemption: string;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_membership_changed',
	})
	is_membership_changed: boolean;
}
