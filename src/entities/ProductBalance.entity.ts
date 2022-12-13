import {
	Column,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionFiles } from './TransactionFiles.entity';

@Index('PK_ed9ff1624021d88aafeb1d90fe6', ['id'], { unique: true })
@Index('UQ_0e19c73873fa1aa41681dcbf965', ['idx'], { unique: true })
@Entity('ProductBalance', { schema: 'public' })
export class ProductBalance {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('uuid', {
		name: 'idx',
		unique: true,
		default: () => 'uuid_generate_v4()',
	})
	idx: string;

	@Column('text', { name: 'name' })
	name: string;

	@Column('double precision', { name: 'credit_limit', precision: 53 })
	credit_limit: number;

	@Column('uuid', { name: 'customer_idx' })
	customer_idx: string;

	@Column('text', { name: 'loan_agreement_number', nullable: true })
	loan_agreement_number: string | null;

	@Column('text', { name: 'product_agreement_number', nullable: true })
	product_agreement_number: string | null;

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

	// @OneToMany(
	// 	() => TransactionFiles,
	// 	transactionFiles => transactionFiles.productType,
	// )
	// transactionFiles: TransactionFiles[];
}
