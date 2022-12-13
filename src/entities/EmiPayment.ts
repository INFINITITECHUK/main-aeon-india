import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Index('emipayment_pk', ['id'], { unique: true })
@Index('emipayment_order_id_uindex', ['orderId'], { unique: true })
@Entity('PaymentLogs', { schema: 'public' })
export class EmiPayment {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('uuid', { name: 'idx' })
	@Generated('uuid')
	idx: string;

	@Column('timestamp without time zone', {
		name: 'created_on',
		default: () => 'now()',
	})
	createdOn: Date;

	@Column('boolean', {
		name: 'is_obsolete',
		nullable: true,
		default: () => 'false',
	})
	isObsolete: boolean | null;

	@Column('boolean', {
		name: 'is_active',
		nullable: true,
		default: () => 'true',
	})
	isActive: boolean | null;

	@Column('timestamp without time zone', {
		name: 'modified_on',
		nullable: true,
		default: () => 'now()',
	})
	modifiedOn: Date | null;

	@Column('text', { name: 'customer_idx', nullable: true })
	customer_idx: string | null;

	@Column('uuid', { name: 'order_id', nullable: true })
	orderId: string | null;

	@Column('double precision', {
		name: 'txn_amount',
		nullable: true,
	})
	txnAmount: number | null;

	@Column('text', {
		nullable: true,
		name: 'transaction_medium',
	})
	transaction_medium: string | null;

	@Column('text', { name: 'txn_currency', nullable: true })
	txnCurrency: string | null;

	@Column('text', { name: 'email', nullable: true })
	email: string | null;

	@Column('text', { name: 'status', nullable: true })
	status: string | null;

	@Column('json', { name: 'data', nullable: true })
	data: object | null;

	// @Column('text', { name: 'full_name', nullable: true })
	// fullName: string | null;

	@Column('text', { name: 'payment_type', nullable: true })
	payment_type: string | null;

	@Column('integer', { name: 'transaction_id', nullable: true })
	transaction_id: number | null;
}
