import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('Counter', { schema: 'public' })
@Index(['idx'], { unique: true })
export class Counter {
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
		name: 'reference_id_counter',
	})
	reference_id_counter: number;

	@Column('text', {
		name: 'loan_id_counter',
	})
	loan_id_counter: number;

	@Column('text', {
		nullable: false,
		default: () => '24',
		name: 'customer_onboarding_hour_24_format',
	})
	customer_onboarding_hour_24_format: string;

	@Column('text', {
		nullable: false,
		default: () => '0',
		name: 'customer_onboarding_minute',
	})
	customer_onboarding_minute: string;

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
