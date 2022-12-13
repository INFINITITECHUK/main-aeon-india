import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'Receipt' })
export class Receipt {
	@ViewColumn({ name: 'Loan Account #' })
	loan_account_number: number;

	@ViewColumn({ name: 'Product ID' })
	product_id: string | null;

	@ViewColumn({ name: 'Payment Mode Name' })
	payment_mode_name: string | null;

	@ViewColumn({ name: 'Payment Sub mode' })
	payment_sub_mode: string | null;

	@ViewColumn({ name: 'Receipt Purpose Description' })
	receipt_purpose_description: string | null;

	@ViewColumn({ name: 'Receipt or Payment' })
	receipt_or_payment: string | null;

	@ViewColumn({ name: 'Transaction Date' })
	transaction_date: string | null;

	@ViewColumn({ name: 'Transaction Amount' })
	transaction_amount: string | null;
}
