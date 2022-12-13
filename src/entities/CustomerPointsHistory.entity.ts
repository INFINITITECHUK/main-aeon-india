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

@Entity('CustomerPointsHistory', { schema: 'public' })
export class CustomerPointsHistory {
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

	@Column('integer', { name: 'reward_point', nullable: true })
	reward_point: number;

	@Column('text', { name: 'total_points', nullable: true })
	total_points: string;

	@Column('text', { name: 'points_elapsed', nullable: true })
	points_elapsed: string;

	@Column('text', { name: 'point_redemption', nullable: true })
	point_redemption: string;

	@Column('text', { name: 'point_redeemed', nullable: true })
	point_redeemed: string;

	@Column('text', { name: 'point_available_redemption', nullable: true })
	point_available_redemption: string;
}
