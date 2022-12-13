import { Inject,Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { getConnection, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Customer } from '@entities/customer.entity';
import { Axios } from '@utils/helpers';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { v4 as uuidv4 } from 'uuid';
import { TransactionDetail } from '@entities/TransactionDetail.entity';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { Counter } from '@entities/counter';
import { EmiPayment } from '@entities/EmiPayment';
import { EMandate } from '@entities/EMandate.entity';
import { Status } from '@common/constants/status.enum';
import { Receipt } from '../../oentities/Receipt';
import { Cron } from '@nestjs/schedule';
import { MINIO_CONNECTION } from 'nestjs-minio';
import config from '@config/index';
import * as XLSX from 'xlsx';
let CronJob = require('cron').CronJob;
@Injectable()
export class CronJobsService {
	constructor(
		@InjectRepository(Customer)
		private readonly customerRepository: Repository<Customer>,
		@InjectRepository(CustomerProfile)
		private readonly customerProfileRepository: Repository<CustomerProfile>,
		@InjectRepository(CustomerApplication)
		private readonly customerApplicationRepository: Repository<CustomerApplication>,
		@InjectRepository(Counter)
		private readonly counterRepository: Repository<Counter>,
		@InjectRepository(TransactionDetail)
		private readonly transactionDetailRepository: Repository<TransactionDetail>,
		@InjectRepository(EmiPayment)
		private readonly paymentLogsRepo: Repository<EmiPayment>,
		@InjectRepository(EMandate)
		private readonly EMandateRepo: Repository<EMandate>,
		@InjectRepository(Receipt, process.env.FINONE_DB_NAME)
		private readonly receiptEntityRepository: Repository<Receipt>,
		@Inject(MINIO_CONNECTION) private readonly minioClient,
	) {}

	async getCustomerOnboardingTiming() {
		const data = await this.counterRepository.findOne({
			where: {
				is_obsolete: false,
			},
			select: [
				'customer_onboarding_hour_24_format',
				'customer_onboarding_minute',
			],
		});
		return data;
	}

	@Cron(`50 * * * * *`) //runs on 50th second of every minute to check the db
	async getCustomersOnboardTime() {
		const data = await this.getCustomerOnboardingTiming();

		if (!data) {
			return;
		}
		await this.notifyNewCustomers(data);
	}

	async notifyNewCustomers(data) {
		const job = new CronJob(
			`0 ${data.customer_onboarding_minute} ${data.customer_onboarding_hour_24_format} * * *`, // runs according to the db timing
			async () => {
				console.log(
					'*******************NEW CUSTOMERS ONBOARDING CRON JOB************************** ',
				);
				console.log(
					'****                                                                      ***',
				);
				console.log(
					'****                                                                      ***',
				);

				console.log(
					`0 ${data.customer_onboarding_minute} ${data.customer_onboarding_hour_24_format} * * *`,
				);

				const newCustomers: any = await this.customerRepository.find({
					where: {
						is_notification_sent: false,
						is_obsolete: false,
					},
					select: ['idx', 'first_name', 'last_name'],
				});

				if (newCustomers && newCustomers.length === 0) {
					console.log(
						'****                                                                        ***',
					);
					console.log(
						'****                                                                        ***',
					);
					console.log(
						'*******************NO NEW CUSTOMERS FOUND FOR ONBOARDING************************** ',
					);
					return;
				}

				const send_data = {
					action_alias: 'send_customer_registration_sms',
					customers: [],
				};
				let customersTobeNotified = {};
				const messageTemplate = await this.getNotiticationTemplate();
				newCustomers.map(customer => {
					send_data.customers.push({
						idx: `${customer.idx}`,
						message: `${messageTemplate
							.replace(
								'<customer name>',
								`${customer.first_name} ${customer.last_name}`,
							)
							.replace(
								'<google play link>',
								process.env.GOOGLE_PLAY_APPSTORE_LINK,
							)
							.replace('<apple store link>', process.env.APPSTORE_LINK)}`,
					});
					let updatedCustomer = customer;
					updatedCustomer['is_notification_sent'] = true;
					customersTobeNotified[customer.idx] = updatedCustomer;
				});
				const notificationResponse = await this.sendNotification(send_data);

				if (
					(notificationResponse.hasOwnProperty('status') &&
						notificationResponse.status === 200) ||
					notificationResponse.status === 201
				) {
					for (let [idx, customer] of Object.entries(customersTobeNotified)) {
						await this.customerRepository.update({ idx: idx }, customer);
					}
				}
				console.log(
					'****                                                                       ***',
				);
				console.log(
					'****                                                                       ***',
				);
				console.log(
					'****               Notification sent to new customers                      ***',
				);
				return;

			},
		);
		job.start();
	}

	async getNotiticationTemplate() {
		try {
			const getTemplateByActionAlias = await Axios.get(
				`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}send_customer_registration_sms`,
			);
			return getTemplateByActionAlias.data.action_message;
		} catch (e) {
			console.log(e.response);
			Logger.log(e.response.data);
		}
	}

	async sendNotification(send_data) {
		return await Axios.post(
			`${process.env.SEND_MEMBER_NOTIFICATION}`,
			send_data,
		).catch(e => {
			return e;
		});
	}

	generateTransactionID(loan_id: string, created_on) {
		const first = loan_id ? loan_id.substring(0, 6) : 'null';
		const created_on_string1 = moment(created_on).format('YYYY/MM/DD');
		const data1 = created_on_string1.split('/')[0];
		const data2 = created_on_string1.split('/')[1];
		const data3 = created_on_string1.split('/')[2];
		const hourMin = moment(created_on).format('HH/mm/ss');
		const data4 = hourMin.split('/')[0];
		const data5 = hourMin.split('/')[1];
		const data6 = hourMin.split('/')[2];

		return `${first}/${data1}${data2}${data3}/${data4}${data5}${data6}`;
	}

	async getTransactionCreateData(repaidTransactions, customerMap) {
		const createdOn = moment();
		const finalSaveData = [];

		repaidTransactions.map(repaidTxn => {
			const loan_id = uuidv4();
			try {
				finalSaveData.push({
					created_on: createdOn,
					customer_idx: customerMap[repaidTxn.loan_account_number].customer.idx,
					outstanding_balance: 0,
					ledger_type: 'CREDIT',
					transaction_date: moment().startOf('month').add(3, 'days'),
					amount: repaidTxn.transaction_amount,
					interestAmount: 0,
					transaction_type: 'REPAYMENT',
					transaction_medium: 'SYSTEM',
					payment_type: 'Electronic Fund Transfer',
					application_number: repaidTxn.loan_account_number,
					transaction_id: this.generateTransactionID(loan_id, createdOn),
					receipt_no: '',
				});
			} catch (e) {}
		});
		return finalSaveData;
	}

	@Cron('0 0 20 * * *')
	async importAutoRepaymentTransactions() {
		const lanIdsArray = [];
		const customerMap = {};
		const customerIds = [];
		const customerIdxs = [];
		const applicationCustomerMap = {};
		let customerCIFQueryString = '';
		const customerApplications: any = await this.customerApplicationRepository.find(
			{
				// where: {
				// 	approval_status: Status.APPROVED,
				// },
				select: [
					'application_number',
					'application_id',
					'customer_idx',
					'interest_rate',
				],
			},
		);

		customerApplications.map(application => {
			applicationCustomerMap[application.customer_idx] = {
				application_number: application.application_number,
				interest_rate: application.interest_rate,
			};
			customerIdxs.push(application.customer_idx);
			lanIdsArray.push(`'${application.application_number}'`);
		});

		const customers: any = await this.customerRepository.find({
			where: {
				idx: In(customerIdxs),
			},
			select: ['id', 'loyalty_customer_number'],
		});

		customers.map(customer => {
			customerIds.push(customer.id);
			customerCIFQueryString = customerCIFQueryString ?
				customerCIFQueryString + `, '` + customer.loyalty_customer_number + `'`:
				customerCIFQueryString + `'` + customer.loyalty_customer_number + `'`
		});

		const customerProfileData: any = await this.customerProfileRepository.find({
			join: {
				alias: 'profile',
				leftJoinAndSelect: {
					customer: 'profile.customer',
				},
			},
			where: {
				is_obsolete: false,
				customer: In(customerIds),
			},
			select: ['associated_loan_app_id'],
			relations: ['customer'],
		});

		customerProfileData.map(profile => {
			if (profile.customer) {
				customerMap[
					applicationCustomerMap[profile.customer.idx]['application_number']
				] = profile;
				profile['interest_rate'] =
					applicationCustomerMap[profile.customer.idx]['interest_rate'];
			}
		});
		const repaidTransactions = await this.receiptEntityRepository
			.createQueryBuilder()
			// .innerJoin(`"Loan Details"`, 'Loan Details', '')
			.where(`"Payment Mode Name" = 'Electronic Fund Transfer'`)
			.andWhere(`"Payment Sub mode" = 600025`)
			.andWhere(`"Receipt or Payment" = 'RECEIPT'`)
			.andWhere(`"Receipt Purpose Description" = 'Installment'`)
			.andWhere(`"Loan Account #" = (${customerCIFQueryString})`)
			.andWhere(`"Transaction Date" between to_date(${moment().startOf('month').format('YYYY/MM/DD')}, 'yyyy/mm/dd') AND to_date(${moment().endOf('month').format('YYYY/MM/DD')}, 'yyyy/mm/dd')`)
			.getMany();

		console.log('****************')
		console.log(repaidTransactions)

		return repaidTransactions
		// add balance to customer wallet
		const transactionCreateData = await this.getTransactionCreateData(
			repaidTransactions,
			customerMap,
		);
		console.log('****************************');
		console.log(transactionCreateData);
		// await getConnection()
		// 	.createQueryBuilder()
		// 	.insert()
		// 	.into(TransactionDetail)
		// 	.values(transactionCreateData)
		// 	.orIgnore()
		// 	.execute();
	}

	@Cron('0 59 23 28-31 * *') 
	async checkIfLastDayOrNot(){
		const isLastDay = await this.isLastDayOfMonth(); 
		if (isLastDay) {
			await this.importLanReport();
		}
	}
	  
	async isLastDayOfMonth(){
		const currentDay  =  moment().format('YYYY-MM-DD');
		const lastDayOfCurrentMonth  =  moment(currentDay).endOf('month').format('YYYY-MM-DD');
	  
		if (currentDay === lastDayOfCurrentMonth) {
		  return true;
		} else {
		  return false;
		}
	}

	// @Cron('20 * * * * *')
	async importLanReport(){
		const todayDate = moment(Date.now()).format('YYYYMMDD');

		let requiredCustomerformat = [] ;
	
		//get all customer eligible
		const customersElectronicFunded = await this.transactionDetailRepository.find({
			where: {
				payment_type: 'Electronic Fund Transfer',
				is_obsolete: false,
				
			},
			select: ['customer_idx','amount','transaction_date']

		})

		// let customersElectronicFunded = [
		// 	{
		// 		customer_idx: "c76c566f-7607-4273-8424-51fc0fc41db8",
		// 		amount: "122",
		// 		transaction_date: Date.now()
		// 	},
		// 	{
		// 		customer_idx: "c76c566f-7607-4273-8424-51fc0fc41db8",
		// 		amount: "200",
		// 		transaction_date: Date.now()
		// 	}
		// ]

		for (let cust of customersElectronicFunded){

			const defaultUserNumber = "MHCB00002000028958";
			const customerLanDetail:any = await this.paymentLogsRepo.findOne({
				where:{
					customer_idx: cust.customer_idx 
				},
				select: ['data']
			})

			const customerUmrnAndReference:any = await this.EMandateRepo.findOne({
				where:{
					customer_idx: cust.customer_idx 
				},
				select: ['emandate_success_data']
			})

			customerUmrnAndReference.emandate_success_data = '{"txnErrorCode":"PNY123","txnErrorMessage":"hello","Penny_Reference_ID":"ashjda"}'

			const  parsedData = customerUmrnAndReference && customerUmrnAndReference.emandate_success_data ? JSON.parse(customerUmrnAndReference.emandate_success_data) : "";

			const requiredDate = moment(cust.transaction_date).format('YYYYMMDD');

			const data = {
				"UserNumber": defaultUserNumber,
				"Unique Reference Number": parsedData ? parsedData.Mandate_Reference_ID : "",
				"Agreement No." : customerLanDetail.data[0].loan_agreement_number || "",
				"Debit Amount": cust.amount || 0,
				"Debit Date": requiredDate,
				"Actual Bill or debit date": requiredDate,
				"UMRN No.": parsedData ? parsedData.UMRN : ""
			}

			requiredCustomerformat.push(data);

		}

		if(customersElectronicFunded.length === 0){
			const data = {
				"UserNumber": '',
				"Unique Reference Number": "",
				"Agreement No." : "",
				"Debit Amount": "",
				"Debit Date": "",
				"Actual Bill or debit date": "",
				"UMRN No.": ""
			}

			requiredCustomerformat.push(data);
		}

		const requiredBuffer =  await this.exportAsExcelFile(requiredCustomerformat, `LANReport_${todayDate}`);
		
		const metaData = {
			'Content-Type': 'text/csv',
		};

		const currentFileName = `LANReport_${todayDate}.csv`;

		this.minioClient.putObject(
			config.lanBucketName,
			currentFileName,
			requiredBuffer,
			metaData,
			error => {
				if (error) {
					console.log(error);
					throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
				}
				console.log(
					`                      Successfully generated lan report for ${todayDate}`,
				);
				console.log(
					'**                                                                                      **',
				);
				console.log(
					'**                                                                                      **',
				);
				console.log(
					'**                                                                                      **',
				);
				console.log(
					'**                                                                                      **',
				);
				console.log(
					`**********************Ending generation of lan report(${todayDate}) ***************************`,
				);
			},
		);

	}

	async exportAsExcelFile(json: Array<any>, excelFileName: string) {
		const workBook: XLSX.WorkBook = XLSX.utils.book_new();

		const workSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

		const csvFile = XLSX.utils.sheet_to_csv(workSheet);

		XLSX.utils.book_append_sheet(workBook, workSheet, `${excelFileName}`);
		
		return csvFile;

	}
}


