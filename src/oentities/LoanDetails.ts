import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'Loan Details' })
export class LoanDetails {
	@ViewColumn({ name: 'Product ID' })
	product_id: number;

	@ViewColumn({ name: 'Next Instalment Amount' })
	next_installment_amount: string | null;

	@ViewColumn({ name: 'Next Instalment Due Date' })
	next_installment_due_date: string | null;

	@ViewColumn({ name: 'Customer ID' })
	customer_id: string | null;
}
