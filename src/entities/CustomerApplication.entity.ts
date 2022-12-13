import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Status } from '@common/constants/status.enum';

@Index(['idx'], { unique: true })
@Entity('CustomerApplication', { schema: 'public' })
export class CustomerApplication {
	@Column('uuid', { name: 'idx', unique: true })
	@Generated('uuid')
	idx: string;

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

	@Column('uuid', { name: 'customer_idx' })
	customer_idx: string;

	@Column('text', { name: 'application_number', nullable: true })
	application_number: string;

	@Column('text', { name: 'application_id', nullable: true })
	application_id: string;

	@Column('text', { name: 'customer_number', nullable: true })
	customer_number: string;

	@Column('text', { name: 'sanctioned_amount', nullable: true })
	sanctioned_amount: string;

	@Column('text', { name: 'interest_rate', nullable: true })
	interest_rate: string;

	@Column('text', { name: 'installment_amount', nullable: true })
	installment_amount: string;

	@Column('text', { name: 'customer_name', nullable: true })
	customer_name: string;

	@Exclude({ toPlainOnly: true })
	@Column('text', {
		nullable: false,
		default: () => Status.PENDING,
		name: 'approval_status',
	})
	approval_status: Status;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'can_add_bank',
	})
	can_add_bank: boolean;
}
