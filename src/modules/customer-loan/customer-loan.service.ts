import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { getConnectionName, InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { Customer } from '@entities/customer.entity';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { EMandate } from '@entities/EMandate.entity';
import { TransactionFiles } from '@entities/TransactionFiles.entity';
import { ProductBalance } from '@entities/ProductBalance.entity';
import { TransactionDetail } from '@entities/TransactionDetail';
import { SoaApiService } from '@modules/customer-loan/soa.api.service';
import { MINIO_CONNECTION } from 'nestjs-minio/dist';
import config from '@config/index';
import { CustomerCard } from '@entities/CustomerCard.entity';
import { titleCase } from '../../utils/helpers';
import { MEMBERSHIP_STATUS_MAP } from '@common/constants/membershipStatus.enum';

const uuid = require('uuid').v4;

@Injectable()
export class CustomerLoanService {
	constructor(
		@InjectRepository(Customer)
		private readonly customerRepo: Repository<Customer>,
		@InjectRepository(CustomerCard)
		private readonly customerCardRepository: Repository<CustomerCard>,
		private readonly soaApiService: SoaApiService,
		@InjectRepository(CustomerProfile)
		private readonly customerProfileRepo: Repository<CustomerProfile>,
		@InjectRepository(EMandate)
		private readonly eMandateRepository: Repository<EMandate>,
		@InjectRepository(TransactionFiles)
		private readonly transactionFilesRepo: Repository<TransactionFiles>,
		@InjectRepository(ProductBalance)
		private readonly productBalanceRepo: Repository<ProductBalance>,
		@InjectRepository(TransactionDetail)
		private readonly transactionDetailRepo: Repository<TransactionDetail>,
		@Inject(MINIO_CONNECTION) private readonly minioClient,
	) {}

	async selectConnection() {
		let connection;
		try {
			connection = await getConnection(process.env.FINONE_DB_NAME);
		} catch (e) {
			connection = await getConnection();
		}
		return connection;
	}

	async getCustomerLoans(customerIdx){
		const connection = await this.selectConnection();
		const customer = await this.customerRepo.findOne({
			where: { idx: customerIdx, is_obsolete: false },
		});
		const customerProfile = await this.customerProfileRepo.findOne({
			where: {
				customer: customer,
			},
		});
		const customerCard = await this.customerCardRepository.findOne({
			where: {
				customer_idx: customerIdx,
			},
		});
		const membershipType = titleCase(customerCard.membership_type);
		if (membershipType) {
			const nextLevel = MEMBERSHIP_STATUS_MAP[membershipType]['NEXT_LEVEL'];
			const numberOfLoans = MEMBERSHIP_STATUS_MAP[membershipType]['NUMBER_OF_LOANS'];
			const nextLevelAmount = MEMBERSHIP_STATUS_MAP[nextLevel]['CAP_AMOUNT'];
			if(membershipType === nextLevel){
				return {
				'next_level': nextLevel,
				'amount_to_pay_for_next_level': 0
				}
			} else {
				const query = `select "Product ID" as product_code,
       "Customer ID" as customer_id,
       "Loan Status" as loan_status,
       "Next Instalment Amount" as next_installment_amount,
       "Next Instalment Due Date" as next_installment_due_date,
       "Disbursed Loan Amount" as disbursed_loan_amount,
       "Principal O/S" as principal_os,
       "Disbursed Loan Amount" - "Principal O/S" as total_paid
       from "Loan Details"
       			where (("Loan Status" = 'A'  or ("Loan Status" = 'C' and "Total Instalment Overdue" = 0))
       			and "Customer ID" = '${customerProfile.customer_info_file_number}')
       			order by "DISBURSED_LOAN_AMOUNT" desc
       			fetch next ${numberOfLoans} ROWS ONLY
       			`;

				const productList = await connection.query(query);
				let totalPaid = 0;
				try {
					productList.map(product => {
						totalPaid += product['TOTAL_PAID']
					});
				} catch (e) {
					Logger.log(e)
				}
				const amountToPay = nextLevelAmount - totalPaid;
				return {
					'next_level': nextLevel,
					'amount_to_pay_for_next_level': amountToPay
				}
			}
		} else {
			return {
				'next_level': '',
				'amount_to_pay_for_next_level': ''
			}
		}
	}

	async getCustomerProducts(customerIdx: string) {
		const customer = await this.customerRepo.findOne({
			where: { idx: customerIdx, is_obsolete: false },
		});
		const customerProfile = await this.customerProfileRepo.findOne({
			where: {
				customer: customer,
			},
		});
		if (!customerProfile) {
			return [];
		}
		const connection = await this.selectConnection();
		return await connection
			.query(`
				select "Product ID" as product_code,
					"Product Code" as product_type,
					"Loan Account #" as loan_account_number,
					"Next Instalment Amount" as next_installment_amount,
					"Next Instalment Due Date" as next_installment_due_date,
					"Product"."Product Name" as product_name
					from "Loan Details"
						inner join "Product" using ("Product ID")
							where "Customer ID" = '${customerProfile.customer_info_file_number}'
							and "Loan Status" = 'A'
							and not "Product Code" = 'RL'`,
			)
			.catch(e => {
				console.log(e)
				throw new HttpException(
					'Unable to find the loan details of customer',
					HttpStatus.BAD_REQUEST,
				);
			});
	}

	async getCustomerProductSOA(customerIdx: string, product_code: string) {
		const customer = await this.customerRepo.findOne({
			where: { idx: customerIdx, is_obsolete: false },
		});
		const customerProfile = await this.customerProfileRepo.findOne({
			where: {
				customer: customer,
			},
		});

		if (!customerProfile) {
			return {};
		}

		const connection = await this.selectConnection();
		const loanDetails = await connection.query(
			`select "Loan Account #"  as loan
								from "Loan Details"
								where "Customer ID" = '${customerProfile.customer_info_file_number}'
									and "Product ID" = '${product_code}'
								`,
		);

		if (loanDetails.length === 0) {
			throw new HttpException(
				'Unable to find loan details with product code',
				HttpStatus.BAD_REQUEST,
			);
		}

		const pdfEncodedString = await this.soaApiService
			.getGeneratedSoaReport(loanDetails[0].loan)
			.catch(e => {
				console.log(e);
				throw new HttpException(
					'Unable to obtain SOA report',
					HttpStatus.BAD_REQUEST,
				);
			});

		const filePath = await this.prepareSOAFile(pdfEncodedString).catch(e => {
			console.log(e);
			throw new HttpException(
				'Unable to prepare SOA file',
				HttpStatus.BAD_REQUEST,
			);
		});

		await this.saveSoaReport(filePath, customerIdx, product_code).catch(e => {
			console.log(e);
			throw new HttpException('Error Saving file', HttpStatus.BAD_REQUEST);
		});
		return {
			soa_location: `${process.env.MINIO_FILE_SERVE_URL}${filePath}`,
		};
	}

	async prepareSOAFile(pdfEncodedString) {
		const reportBuffer = Buffer.from(pdfEncodedString, 'base64');
		const fileName = `soa_${uuid()}.pdf`;
		const filePath = `${config.soaBucketName}/${fileName}`;

		this.minioClient.putObject(
			config.soaBucketName,
			fileName,
			reportBuffer,
			error => {
				if (error) {
					throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
				}
			},
		);
		return filePath;
	}

	async saveSoaReport(
		filePath: string,
		customerIdx: string,
		product_code: string,
	) {
		const transactionFile = await this.transactionFilesRepo.findOne({
			customer_idx: customerIdx,
			product_code: product_code,
		});
		if (transactionFile) {
			await this.transactionFilesRepo.save({
				...transactionFile,
				soa: filePath,
			});
		} else {
			await this.transactionFilesRepo.save({
				soa: filePath,
				noc: '',
				customer_idx: customerIdx,
				product_code: product_code,
			});
		}
		return filePath;
	}
}
