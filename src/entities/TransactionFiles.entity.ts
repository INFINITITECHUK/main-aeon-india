import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductBalance } from './ProductBalance.entity';
import { TransactionDetail } from './TransactionDetail';

@Index('TransactionFiles_pkey', ['id'], { unique: true })
@Index('TransactionFiles_idx_key', ['idx'], { unique: true })
@Entity('TransactionFiles', { schema: 'public' })
export class TransactionFiles {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('uuid', { name: 'idx', unique: true })
	idx: string;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;

	@Column('character varying', { name: 'soa' })
	soa: string;

	@Column('character varying', { name: 'noc', nullable: true })
	noc: string | null;

	@Column('character varying', { name: 'product_code', nullable: true })
	product_code: string | null;

	@Column('uuid', { name: 'customer_idx' })
	customer_idx: string;
}
