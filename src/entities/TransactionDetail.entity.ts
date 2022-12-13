import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('PK_9235fe28da42a40cebe0bfcf20d', ['id'], { unique: true })
@Index('TransactionDetail_pkey', ['id'], { unique: true })
@Index('UQ_6fa0dbe12b60c3be1d84089ba52', ['idx'], { unique: true })
@Index('transactiondetail_loan_id_uindex', ['loan_id'], { unique: true })
@Entity('TransactionDetail', { schema: 'public' })
export class TransactionDetail {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('uuid', {
		name: 'idx',
		nullable: true,
		unique: true,
		default: () => 'uuid_generate_v4()',
	})
	idx: string | null;

	@Column('uuid', { name: 'customer_idx', nullable: true })
	customer_idx: string | null;

	@Column('uuid', { name: 'merchant_idx', nullable: true })
	merchant_idx: string | null;

	@Column('text', { name: 'ledger_type', nullable: true })
	ledger_type: string | null;

	@Column('timestamp without time zone', { name: 'transaction_date' })
	transaction_date: Date;

	@Column('double precision', { name: 'amount', precision: 53 })
	amount: number;

	@Column('double precision', {
		name: 'total_payable',
		nullable: true,
		precision: 53,
	})
	totalPayable: number | null;

	@Column('double precision', {
		name: 'interest_amount',
		nullable: true,
		precision: 53,
	})
	interestAmount: number | null;

	@Column('integer', { name: 'no_days', nullable: true, default: () => '0' })
	no_days: number | null;

	@Column('text', { name: 'transaction_type' })
	transaction_type: string;

	@Column('text', {
		nullable: true,
		name: 'transaction_medium',
	})
	transaction_medium: string | null;

	@Column('text', {
		nullable: true,
		name: 'payment_type',
	})
	payment_type: string | null;

	@Column('text', { name: 'application_number', nullable: true })
	application_number: string | null;

	@Column('text', { name: 'transaction_id', nullable: true })
	transaction_id: string | null;

	@Column('text', { name: 'user_type', default: () => "'User'" })
	user_type: string;

	@Column('double precision', {
		name: 'refund_charge',
		nullable: true,
		precision: 53,
	})
	refundCharge: number | null;

	@Column('double precision', { name: 'outstanding_balance', precision: 53 })
	outstanding_balance: number;

	@Column('text', { name: 'loan_type', nullable: true })
	loan_type: string | null;

	@Column('text', { name: 'transaction_value_date', nullable: true })
	transaction_value_date: string | null;

	@Column('text', { name: 'receipt_no', nullable: true })
	receipt_no: string | null;

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

	@Column('boolean', { name: 'is_outstanding', default: () => 'false' })
	is_outstanding: boolean;

	@Column('boolean', { name: 'is_processed', default: () => 'false' })
	is_processed: boolean;

	@Column('integer', { name: 'loan_agreement_no', nullable: true })
	loan_agreement_no: string | null;

	@Column('uuid', { name: 'loan_id', nullable: true })
	loan_id: string | null;

	@Column('timestamp with time zone', { name: 'inactive_on', nullable: true })
	inactive_on: Date | null;

	@Column('boolean', { name: 'is_active', default: () => 'true' })
	is_active: boolean;
}
