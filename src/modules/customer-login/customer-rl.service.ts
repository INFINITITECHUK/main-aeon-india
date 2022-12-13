import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Between, getConnection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmiPayment } from '@entities/EmiPayment';
import * as moment from 'moment';


@Injectable()
export class CustomerRlService {
	constructor(
		@InjectRepository(EmiPayment)
		private readonly paymentLogRepository: Repository<EmiPayment>,
	) {}

	async getCustomerLANNo(customer){
		let loanAgreementNumber = '';
		const loanAccount = await getConnection(process.env.FINONE_DB_NAME)
			.query(`
			select "Product ID" as product_code,
				"Loan Account #" as loan_account_number,
				"Next Instalment Amount" as next_installment_amount,
				"Next Instalment Due Date" as next_installment_due_date,
				"PRODUCT NAME" as product_name
				from "Loan Details"
				inner join "Products" on "Loan Details"."Product ID" = "Products"."PRODUCT ID"
				where "Customer ID" = '${customer.loyalty_customer_number}'
				and "Loan Status" = 'A'
				and "Products"."PRODUCT CODE" = 'RL'
				`
			);
		console.log(loanAccount);

		if (loanAccount.length > 0){
			loanAgreementNumber = loanAccount[0]['LOAN_ACCOUNT_NUMBER']
		}

		return loanAgreementNumber
	}

	async getCustomerRLandLanStatus(customer){
		let minimumAmountPaid = false;

		const value = await this.paymentLogRepository.find({where: {
				customer_idx: customer.customer_idx,
				status: 'APPROVED',
				payment_type: 'RL',
				createdOn: Between(moment().startOf('month').toISOString(), moment().endOf('month').toISOString())
			}})

		if (value.length > 0){
			minimumAmountPaid = true
		}
		try {

		return {
			loan_agreement_number: customer.rl_lan_no ? customer.rl_lan_no : '',
			minimum_amount_paid: minimumAmountPaid
		}
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data, e.response.status);
		}
	}
}