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

@Entity('MembershipLevels', { schema: 'public' })
@Index(['idx'], { unique: true })
export class MembershipLevels {
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

	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('text', {
		nullable: false,
		name: 'membership_type',
	})
	membership_type: number;

	@Column('text', {
		nullable: false,
		name: 'points_range',
	})
	points_range: number;

	@Column('text', {
		nullable: false,
		name: 'points_difference',
	})
	points_difference: number;

	@Column('boolean', {
		nullable: false,
		default: () => 'true',
		name: 'is_active',
	})
	is_active: boolean;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;
}
