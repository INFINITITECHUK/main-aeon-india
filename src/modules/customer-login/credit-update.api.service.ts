import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Axios, getRandomNumber } from '@utils/helpers';
import * as moment from 'moment';
import { getConnection, getRepository, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { EMandate } from '@entities/EMandate.entity';
import { ThirdPartyAPILogs } from '@common/utils/api-logger';
import * as xml2js from 'xml2js';
import { Customer } from '@entities/customer.entity';

let transacRefIDCounter = 10000000;
const thirdPartyAPILogs = new ThirdPartyAPILogs('creditUpdate');

@Injectable()
export class CreditUpdateApiService {
	constructor(
		@InjectRepository(CustomerProfile)
		private readonly customerProfileRepo: Repository<CustomerProfile>,
		@InjectRepository(EMandate)
		private readonly eMandateRepository: Repository<EMandate>,
	) {}

	async handleDisbursalSuccess(responseString, customerIdx){
		try {
			const startString = '<SOAP-ENV:Envelope'
			const endString = '</SOAP-ENV:Envelope>'
			const xmlString = startString + responseString.split(startString)[1].split(endString)[0] + endString
			const responseJson = await xml2js.parseStringPromise(xmlString, {
				mergeAttrs: true,
			});
			const lanNo = responseJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['ns22:subsequentDisbursalResponse'][0]['ns22:loanAccountNumber'][0]
			await getRepository(Customer).update({idx: customerIdx}, {rl_lan_no: lanNo})

		} catch (e){
				console.log('Error during update')
				console.log(e)
		}
	}

	async qrUpdate(amount, customer, merchantIdx) {
		try {
			const update_creditLimit_config = await this.creditLimitUpdate(
				amount,
				customer,
			);
			const creditLimit_response = await Axios.post(
				update_creditLimit_config.url,
				update_creditLimit_config.data
			)
			.then(response => {
				console.log('****QR credit limit response**********************')
				console.log(response)
				thirdPartyAPILogs.log(update_creditLimit_config.data, response.data);
				return response
			})
			.catch(e => {
				console.log('****QR credit limit error response**********************')
				console.log(e)
				thirdPartyAPILogs.log(update_creditLimit_config.data, e.response.data);
				return e.response
			});

			if (creditLimit_response.data.code == 0) {
				const disbursal_config = await this.qrConfig(
					amount,
					customer,
					merchantIdx,
				);
				const disbursal_response = await Axios.post(
					disbursal_config.url,
					disbursal_config.data,
				{headers: disbursal_config.headers}
				)
				.then(response => {
					console.log('****QR disbursal  response**********************')
					console.log(response)
					this.handleDisbursalSuccess(response.data, customer.idx)
					thirdPartyAPILogs.log(disbursal_config.data, response.data);
					return response
				})
				.catch(e => {
					console.log('****QR disbursal error response**********************')
					console.log(e)
					thirdPartyAPILogs.log(disbursal_config.data, e.response.data);
					return e.response
				});
				console.log(disbursal_response)

			}
			return creditLimit_response.data;
		} catch (e) {
			Logger.log(e);
			throw new HttpException('Not Found', e.response);
		}
	}

	async cashWithdrawl(amount, customer) {
		const update_creditLimit_config = await this.creditLimitUpdate(
			amount,
			customer,
		);
		const disbursal_config = await this.withdrawlConfig(amount, customer);
		try {
			const creditLimit_response = await Axios.post(
				update_creditLimit_config.url,
				update_creditLimit_config.data,
			)
			.then(response => {
				thirdPartyAPILogs.log(update_creditLimit_config.data, response.data);
				return response
			})
			.catch(e => {
				thirdPartyAPILogs.log(update_creditLimit_config.data, e.response.data);
				return e.response
			});
			if (creditLimit_response.data.code == 0) {
				const disbursal_response = await Axios.post(
					disbursal_config.url,
					disbursal_config.data,
			{headers: disbursal_config.headers })
				.then(response => {
					thirdPartyAPILogs.log(disbursal_config.data, response.data);
					this.handleDisbursalSuccess(response.data, customer.idx)
					return response
				})
				.catch(e => {
					thirdPartyAPILogs.log(disbursal_config.data, e.response.data);
					return e.response
				});
			}
			return creditLimit_response.data;
		} catch (e) {
			throw new HttpException('Not Found', 400);
		}
	}

	async creditLimitUpdate(amount, customer) {
		// Credit Limit Update API
		const [customerApplication] = await getConnection().query(
			`SELECT * FROM "CustomerApplication"  where customer_idx = '${customer.idx}'`,
		);

		const update_creditLimit_req = {
			appNumber: customerApplication.application_number,
			totalSanctionedLimit: customer.total_sanctioned_limit,
			totalDisburseAmount: customer.total_disburse_amount,
			totalReceivedAmount: customer.total_received_amount,
			availableLimit: customer.available_limit,
			dateofLimitUpdate: moment(customer.limit_update_date).format(
				'DD/MM/YYYY',
			),
			transacRefID: transacRefIDCounter++,
		};
		return  {
			method: 'post',
			url: process.env.CREDIT_LIMIT_UPDATE,
			headers: {
				'Content-Type': 'application/json',
			},
			data: update_creditLimit_req,
		};
	}

	async qrConfig(amount, customer, merchantIdx) {
		const [defaults] = await getConnection().query(
			'SELECT * FROM "ThirdPartyDefaults"',
		);
		const [merchant] = await getConnection().query(
			`SELECT * FROM "MerchantProfile"  where idx = '${merchantIdx}';`,
		);

		const [customerApplication] = await getConnection().query(
			`SELECT * FROM "CustomerApplication"  where customer_idx = '${customer.idx}'`,
		);
		const disbursal_req = this.getQRDisbursalRequest(
			customer,
			customerApplication,
			merchant,
			defaults,
			amount,
		);

		// let disbursal_req =
		// 	'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://schema.subsequent.disbursal.ws.pro.finnone.nucleus.com">\n    <soapenv:Header/>\n    <soapenv:Body>\n        <sch:subsequentDisbursalRequest>\n            <sch:productProcessor>EXTERNAL</sch:productProcessor>\n  <sch:requestReferenceNumber>45321</sch:requestReferenceNumber>\n          <sch:applicationId>APPL00000041</sch:applicationId>\n            <sch:operationType>CI</sch:operationType>\n            <sch:disbursalAmount>500</sch:disbursalAmount>\n            <sch:disbursalDate>23/01/2021</sch:disbursalDate>\n            <sch:principalRecoveryFlag>1</sch:principalRecoveryFlag>\n            <sch:principalRecoveryAccountType>D</sch:principalRecoveryAccountType>\n            <sch:startPrincipalRecoveryFrom>23/01/2021</sch:startPrincipalRecoveryFrom>\n            <sch:disbursalRemarks>disbursal</sch:disbursalRemarks>\n            <sch:payeeDetails>\n                <sch:bpType>Customer</sch:bpType>\n                <sch:paymentAmount>500</sch:paymentAmount>\n                <sch:paymentMode>ELECTRONIC_FUND_TRANSFER</sch:paymentMode>\n                <sch:creditDays>7</sch:creditDays>\n                <sch:paymentDetails>\n                    <!--Optional:-->\n                    <sch:subPaymentMode>NEFT</sch:subPaymentMode>\n                    <!--Optional:-->\n                    <sch:beneficiaryName>VARDHMAN MOBILE</sch:beneficiaryName>\n                    <!--Optional:-->\n                    <sch:ifscCode>CBIN0282739</sch:ifscCode>\n                    <!--Optional:-->\n                    <sch:beneficiaryAccountType></sch:beneficiaryAccountType>\n                    <!--Optional:-->\n                    <sch:accountNumber>undefined</sch:accountNumber>\n                </sch:paymentDetails>\n            </sch:payeeDetails>\n        </sch:subsequentDisbursalRequest>\n    </soapenv:Body>\n</soapenv:Envelope>';
		console.log('disbursal_req: ', disbursal_req);
		return  {
			method: 'post',
			url: process.env.CREDIT_DISBURSAL,
			headers: {
				'Content-Type': 'text/xml',
			},
			data: disbursal_req,
		};
	}

	async withdrawlConfig(amount, customer) {
		const [defaults] = await getConnection().query(
			'SELECT * FROM "ThirdPartyDefaults"',
		);
		const customerEmandateDetails = await getRepository(EMandate).findOne({
				where:{
					customer_idx	: customer.idx
				}}
		);

		const [
			branchDetails,
		] = await getConnection().query(`SELECT * FROM "Branch"  where idx = '${customerEmandateDetails.branch_idx}'`);

		const [
			customerApplication,
		] = await getConnection().query(
			`SELECT * FROM "CustomerApplication"  where customer_idx = '${customer.idx}'`
		);
		const disbursal_req = this.getWithdrawlDisbursalRequest(
			customer,
			customerApplication,
			customerEmandateDetails,
			defaults,
			branchDetails,
			amount,
		);
		console.log('disbursal_req: ', disbursal_req);
		return {
			method: 'post',
			url: process.env.CREDIT_DISBURSAL,
			headers: {
				'Content-Type': 'text/xml',
			},
			data: disbursal_req,
		};
	}

	getQRDisbursalRequest(
		customer,
		customerApplication,
		merchant,
		defaults,
		amount,
	) {
		const requestBody = `<?xml version="1.0" encoding="UTF-8"?>
					<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://schema.subsequent.disbursal.ws.pro.finnone.nucleus.com">
						 <soapenv:Header />
						 <soapenv:Body>
								<sch:subsequentDisbursalRequest>
									 <sch:productProcessor>mCAS</sch:productProcessor>
									 <sch:requestReferenceNumber>${getRandomNumber(20)}</sch:requestReferenceNumber>
									 <sch:applicationId>${customerApplication.application_number}</sch:applicationId>
									 <sch:operationType>${defaults.operation_type}</sch:operationType>
									 <sch:disbursalAmount>${amount}</sch:disbursalAmount>
									 <sch:disbursalDate>${moment().format('DD/MM/YYYY')}</sch:disbursalDate>
									 <sch:principalRecoveryFlag>true</sch:principalRecoveryFlag>
									 <sch:principalRecoveryAccountType>D</sch:principalRecoveryAccountType>
									 <sch:startPrincipalRecoveryFrom>${moment().format(
											'DD/MM/YYYY',
										)}</sch:startPrincipalRecoveryFrom>
									 <sch:disbursalRemarks>Disbursal</sch:disbursalRemarks>
									 <sch:payeeDetails>
											<sch:bpType>Primary Applicant</sch:bpType>
											<sch:paymentAmount>${amount}</sch:paymentAmount>
											<sch:paymentMode>ELECTRONIC_FUND_TRANSFER</sch:paymentMode>
											<sch:creditDays>${merchant.settlement_days}</sch:creditDays>
											<sch:paymentDetails>
												 <!--Optional:-->
												 <sch:subPaymentMode>${defaults.sub_payment_mode}</sch:subPaymentMode>
												 <!--Optional:-->
												 <sch:beneficiaryName>${merchant.bank_account_name}</sch:beneficiaryName>
												 <sch:inFavorOf>${merchant.bank_account_name}</sch:inFavorOf>
												 <sch:instrumentNumber>${getRandomNumber(6)}</sch:instrumentNumber>
												 <sch:instrumentDate>${moment().format('DD/MM/YYYY')}</sch:instrumentDate>
												 <!--Optional:-->
												 <sch:ifscCode>${merchant.ifsc_code}</sch:ifscCode>
												 <!--Optional:-->
												<!-- <sch:beneficiaryAccountType>${merchant.account_type}</sch:beneficiaryAccountType> -->
												 <sch:beneficiaryAccountType>SavingAccount</sch:beneficiaryAccountType>
												 <!--Optional:-->
												 <sch:accountNumber>${merchant.bank_account_no}</sch:accountNumber>
												 <sch:dealingBankId>5000180</sch:dealingBankId>

											</sch:paymentDetails>
									 </sch:payeeDetails>
								</sch:subsequentDisbursalRequest>
						 </soapenv:Body>
					</soapenv:Envelope>`;
		return requestBody.replace(/[\r\n\t]/g, "");
	}

	getWithdrawlDisbursalRequest(
		customer,
		customerApplication,
		customerEmandateDetails,
		defaults,
		branchDetails,
		amount,
	) {
		const requestBody = `<?xml version="1.0" encoding="UTF-8"?>
					<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://schema.subsequent.disbursal.ws.pro.finnone.nucleus.com">
						 <soapenv:Header />
						 <soapenv:Body>
								<sch:subsequentDisbursalRequest>
									 <sch:productProcessor>mCAS</sch:productProcessor>
									 <sch:requestReferenceNumber>${getRandomNumber(20)}</sch:requestReferenceNumber>
									 <sch:applicationId>${customerApplication.application_number}</sch:applicationId>
									 <sch:operationType>${defaults.operation_type}</sch:operationType>
									 <sch:disbursalAmount>${amount}</sch:disbursalAmount>
									 <sch:disbursalDate>${moment().format('DD/MM/YYYY')}</sch:disbursalDate>
									 <sch:principalRecoveryFlag>true</sch:principalRecoveryFlag>
									 <sch:principalRecoveryAccountType>D</sch:principalRecoveryAccountType>
									 <sch:startPrincipalRecoveryFrom>${moment().format(
											'DD/MM/YYYY',
										)}</sch:startPrincipalRecoveryFrom>
									 <sch:disbursalRemarks>Disbursal</sch:disbursalRemarks>
									 <sch:payeeDetails>
											<sch:bpType>Primary Applicant</sch:bpType>
											<sch:paymentAmount>${amount}</sch:paymentAmount>
											<sch:paymentMode>ELECTRONIC_FUND_TRANSFER</sch:paymentMode>
											<sch:creditDays>3</sch:creditDays>
											<sch:paymentDetails>
												 <sch:inFavorOf>${customerEmandateDetails.full_name}</sch:inFavorOf>
												 <sch:instrumentNumber>${getRandomNumber(6)}</sch:instrumentNumber>
												 <sch:instrumentDate>${moment().format('DD/MM/YYYY')}</sch:instrumentDate>
												 <!--Optional:-->
												 <sch:subPaymentMode>${defaults.sub_payment_mode}</sch:subPaymentMode>
												 <!--Optional:-->
												 <sch:beneficiaryName>${`${customer.first_name} ${customer.last_name}`}</sch:beneficiaryName>
												 <!--Optional:-->
												 <sch:ifscCode>${branchDetails.ifsc_code}</sch:ifscCode>
												 <!--Optional:-->
												 <!--<sch:beneficiaryAccountType>${customerEmandateDetails.account_type}</sch:beneficiaryAccountType> -->
												 <sch:beneficiaryAccountType>SavingAccount</sch:beneficiaryAccountType>
												 <!--Optional:-->
												 <sch:accountNumber>${customerEmandateDetails.account_number}</sch:accountNumber>
												<sch:dealingBankId>5000180</sch:dealingBankId>
											</sch:paymentDetails>
									 </sch:payeeDetails>
								</sch:subsequentDisbursalRequest>
						 </soapenv:Body>
					</soapenv:Envelope>`;
		return requestBody.replace(/[\r\n\t]/g, "");
	}
}
