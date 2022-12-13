import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Index(['idx'], { unique: true })
@Entity('ThirdPartyDefaults', { schema: 'public' })
export class ThirdPartyDefaults {
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

	@Column('text', {
		nullable: false,
		name: 'questions',
	})
	questions: string;

	@Column('text', {
		nullable: false,
		name: 'product_processor',
	})
	product_processor: string;

	@Column('text', {
		nullable: false,
		name: 'operation_type',
	})
	operation_type: string;

	@Column('text', {
		nullable: false,
		name: 'principal_recovery_flag',
	})
	principal_recovery_flag: string;

	@Column('text', {
		nullable: false,
		name: 'principal_recovery_amount_type',
	})
	principal_recovery_amount_type: string;

	@Column('text', {
		nullable: false,
		name: 'sub_payment_mode',
	})
	sub_payment_mode: string;
}
