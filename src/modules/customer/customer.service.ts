import {
	HttpException,
	HttpService,
	HttpStatus,
	Injectable,
	Logger,
	NotFoundException,
	Inject,
} from '@nestjs/common';
import {
	InjectRepository,
	InjectConnection,
	InjectEntityManager,
} from '@nestjs/typeorm';
import {
	Brackets,
	getManager,
	getRepository,
	Repository,
	Connection,
	EntityManager,
	Between,
	getConnection,
} from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import {
	LoyaltyCustomer,
	LoyCustomer,
} from '../../oentities/loyaltyCustomer.entity';
import {
	//FinnOneCustomers,
	FinnOneCustomerPhoneDetails,
	FinnOneCustomerIdDetailsView,
	FinnOneCustomerEmailIDView,
	FinnOneCustomerAddressDetailsView,
	FinnOneCustomerApplicationDetailsView,
	FinnOneCustomerReferencesView,
	FinnOneCustomerInstrumentalDetailsView,
	FinnOneAddressDetailsView,
	FinnOneIncomeDetailsView,
	FinnOneEmploymnetDetailsView,
	FinnOneCustomer, //Bank Details changes -Last Commit
	FinnOneCommunicationDetails
} from '../../oentities/customerViews.entity';
import { CustomerPointsHistory } from '@entities/CustomerPointsHistory.entity';
import {
	Axios,
	paginate,
	cleanData,
	parseJwt,
	removeEmpty,
} from '../../utils/helpers';
import { FinnOneDBColumnMapping } from '../../oentities/customerViews.entity';
import { LoyaltyDBColumnMapping } from '../../oentities/loyaltyCustomer.entity';
import { UpdateCustomerDto } from '../../dtos/UpdateCustomer.Dto';
import { CustomerTemp } from '../../entities/customerTemp.entity';
import { ApproveRejectDto } from '../../dtos/ApproveReject.dto';
import { CreateCustomer } from '../../dtos/CreateCustomer.Dto';
import { Status } from '../../common/constants/status.enum';
import { Operations } from '../../common/constants/operations.enum';
import { blockunblock } from '../../common/constants/blockunblock.enum';
import { CustomerDevice } from '../../entities/CustomerDevice.entity';
import { Category } from '../../common/constants/category.enum';
import { EMandate } from '../../entities/EMandate.entity';
import { CreditModule } from '../../entities/CreditModule';
import { CustomerWallet } from '../../entities/CustomerWallet';
import { EMandateTemp } from '../../entities/EMandateTemp.entity';
import { Branch } from '../../entities/Branch.entity';
import { CustomerProfile } from '../../entities/CustomerProfile.entity';
import { CustomerCard } from '../../entities/CustomerCard.entity';
import { LockStatusDto } from '../../dtos/LockStatus.dto';
import { ActivityLog } from '../../entities/ActivityLog';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import * as moment from 'moment';
import { CustomFileLogger } from '@common/utils/custom-logger';
import { ValidateNested } from 'class-validator';

const customOnboardingLogs = new CustomFileLogger('onboarding logs');

@Injectable()
export class ClientService {
	constructor(
		@InjectConnection(process.env.FINONE_DB_NAME)
		private connection: Connection,
		@InjectEntityManager(process.env.FINONE_DB_NAME)
		private entityManager: EntityManager,
		@InjectRepository(LoyaltyCustomer, process.env.LOYALTY_DB_NAME)
		private readonly loyaltyRepository: Repository<LoyaltyCustomer>,
		// @InjectRepository(FinnOneCustomers, process.env.FINONE_DB_NAME)
		// private readonly CustomersRepository: Repository<FinnOneCustomers>,
		@InjectRepository(FinnOneCommunicationDetails, process.env.FINONE_DB_NAME)
		private readonly finnOneCommunicationDetailsRepository: Repository<FinnOneCommunicationDetails>,
		@InjectRepository(FinnOneCustomerPhoneDetails, process.env.FINONE_DB_NAME)
		private readonly finnOneCustomerPhoneDetailsRepository: Repository<FinnOneCustomerPhoneDetails>,
		@InjectRepository(FinnOneCustomerIdDetailsView, process.env.FINONE_DB_NAME)
		private readonly finnOneCustomerIdDetailsRepository: Repository<FinnOneCustomerIdDetailsView>,
		@InjectRepository(FinnOneCustomerEmailIDView, process.env.FINONE_DB_NAME)
		private readonly finnOneCustomerEmailIDRepository: Repository<FinnOneCustomerEmailIDView>,
		@InjectRepository(
			FinnOneCustomerAddressDetailsView,
			process.env.FINONE_DB_NAME,
		)
		private readonly finnOneCustomerAddressDetailsRepository: Repository<FinnOneCustomerAddressDetailsView>,
		@InjectRepository(LoyCustomer, process.env.LOYALTY_DB_NAME)
		private readonly loyCustomerRepository: Repository<LoyCustomer>,
		@InjectRepository(
			FinnOneCustomerApplicationDetailsView,
			process.env.FINONE_DB_NAME,
		)
		private readonly finnOneCustomerApplicationDetailsRepository: Repository<FinnOneCustomerApplicationDetailsView>,
		@InjectRepository(
			FinnOneCustomerInstrumentalDetailsView,
			process.env.FINONE_DB_NAME,
		)
		private readonly finnOneCustomerInstrumentalDetailsViewRepository: Repository<FinnOneCustomerInstrumentalDetailsView>,
		@InjectRepository(FinnOneCustomer, process.env.FINONE_DB_NAME)
		private readonly finnOneCustomerViewRepository: Repository<FinnOneCustomer>,
		@InjectRepository(FinnOneAddressDetailsView, process.env.FINONE_DB_NAME)
		private readonly finnOneFinnOneAddressDetailsViewRepository: Repository<FinnOneAddressDetailsView>,
		@InjectRepository(FinnOneIncomeDetailsView, process.env.FINONE_DB_NAME)
		private readonly finnOneFinnOneIncomeDetailsViewRepository: Repository<FinnOneIncomeDetailsView>,
		@InjectRepository(FinnOneEmploymnetDetailsView, process.env.FINONE_DB_NAME)
		private readonly finnOneFinnOneEmploymnetDetailsViewRepository: Repository<FinnOneEmploymnetDetailsView>, //Bank Details changes -Last Commit
		@InjectRepository(FinnOneCustomerReferencesView, process.env.FINONE_DB_NAME)
		private readonly finnOneCustomerReferencesRepository: Repository<FinnOneCustomerReferencesView>,
	) {}

	async checkLoyaltyCustomer(CUSTOMER_ID: number) {
		const loyalty: any = await this.loyaltyRepository.findOne({
			where: { CUSTOMER_ID },
		});
		customOnboardingLogs.log('Loyalty Customer DB data');
		customOnboardingLogs.log(loyalty);
		if (!loyalty) {
			throw new HttpException(
				'Customer with id not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return loyalty;
	}

	async checkBulkLoyaltyCustomer(cutomerSuperSet: any) {
		const bulkLoyalty: any = await this.loyaltyRepository.find({
			where: cutomerSuperSet,
		});
		if (!bulkLoyalty) {
			throw new HttpException(
				'Customer with Number not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return bulkLoyalty;
	}

	async checkBulkLoyCustomer(cutomerNumberSuperSet: any) {
		const bulkLoyalty: any = await this.loyCustomerRepository.find({
			where: cutomerNumberSuperSet,
		});
		if (!bulkLoyalty) {
			throw new HttpException(
				'Customer with CIF not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return bulkLoyalty;
	}

	async fetchAllLoyaltyCustomer() {
		console.log('***********');
		console.log('query fetch all loyalty');
		// const loyalty: any = await this.loyaltyRepository.find({
		// 	select: ['CUSTOMER_ID', 'CUSTOMER_NUMBER'],
		// });
		const loyalty = await getConnection('aoenClientLoyaltyDb').query(
			`SELECT * FROM "LOYALTY"."LOY_CUSTOMER_DTL"`,
		);
		if (!loyalty) {
			throw new HttpException('No Customer found', HttpStatus.NOT_FOUND);
		}

		return loyalty;
	}

	async fetchAllLoyCustomer() {
		// const loyalty: any = await this.loyCustomerRepository.find({
		// 	select: ['CUSTOMER_NUMBER', 'REGISTRATION_DATE'],
		// });
		console.log('***********');
		console.log('query fetch all loy customer');
		const loyalty = await getConnection('aoenClientLoyaltyDb').query(
			`SELECT * FROM "LOYALTY"."LOY_CUSTOMER"`,
		);
		if (!loyalty) {
			throw new HttpException('No Customer found', HttpStatus.NOT_FOUND);
		}

		return loyalty;
	}

	async fetchAllLoyaltyCustomerByRegistrationDate() {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const loyalty: any = await this.loyaltyRepository.find({
			select: ['CUSTOMER_ID', 'CUSTOMER_NUMBER', 'REGISTRATION_DATE'],
			where: [{ REGISTRATION_DATE: yesterday }],
		});
		if (!loyalty) {
			throw new HttpException('No Customer found', HttpStatus.NOT_FOUND);
		}

		return loyalty;
	}

	async fetchAllLoyCustomerByRegistrationDate() {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const loyalty: any = await this.loyCustomerRepository.find({
			select: ['CUSTOMER_NUMBER', 'REGISTRATION_DATE'],
			where: [{ REGISTRATION_DATE: yesterday }],
		});
		if (!loyalty) {
			throw new HttpException('No Customer found', HttpStatus.NOT_FOUND);
		}

		return loyalty;
	}
	// async checkFinnOneCustomer(CUSTOMER_ID: number) {
	// 	const finnOneCustomer: any = await this.CustomersRepository.find({
	// 		where: { CUSTOMER_ID },
	// 	});
	// 	customOnboardingLogs.log('Finnone Customer DB data');
	// 	customOnboardingLogs.log(finnOneCustomer);
	// 	if (!finnOneCustomer) {
	// 		throw new HttpException(
	// 			'Customer with id not found',
	// 			HttpStatus.NOT_FOUND,
	// 		);
	// 	}

	// 	return finnOneCustomer;
	// }

	// async checkFinnOneBulkCustomer(customerSuperSet: any) {
	// 	const bulkfinnOneCustomer: any = await this.CustomersRepository.find({
	// 		where: customerSuperSet,
	// 	});
	// 	if (!bulkfinnOneCustomer) {
	// 		throw new HttpException(
	// 			'Customer with CIF not found',
	// 			HttpStatus.NOT_FOUND,
	// 		);
	// 	}

	// 	return bulkfinnOneCustomer;
	// }

	async checkFinnOneBulkCustomerNeo(customerSuperSet: any) {
		const bulkfinnOneCustomer: any = await this.finnOneCustomerViewRepository.find({
			where: customerSuperSet,
		});
		if (!bulkfinnOneCustomer) {
			throw new HttpException(
				'Customer with Neo CIF not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return bulkfinnOneCustomer;
	}

	async checkFinnOneBulkCommunicationDetails(customerSuperSet: any) {
		const bulkfinnOneCommunication: any = await this.finnOneCommunicationDetailsRepository.find({
			where: customerSuperSet,
		});
		if (!bulkfinnOneCommunication) {
			throw new HttpException(
				'Customer with Number not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return bulkfinnOneCommunication;
	}

	async checkFinnOneCustomerPhoneDetails(CUSTOMER_NUMBER: string) {
		const finnOneCustomerPhoneDetails: any = await this.finnOneCustomerPhoneDetailsRepository.findOne(
			{
				where: { CUSTOMER_NUMBER },
			},
		);
		if (!finnOneCustomerPhoneDetails) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return finnOneCustomerPhoneDetails;
	}

	async checkFinnOneBulkCustomerPhoneDetails(cutomerNumberSuperSet: any) {
		const finnOneBulkCustomerPhoneDetails: any = await this.finnOneCustomerPhoneDetailsRepository.findOne(
			{
				where: cutomerNumberSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Phone Details DB data');
		customOnboardingLogs.log(finnOneBulkCustomerPhoneDetails);
		if (!finnOneBulkCustomerPhoneDetails) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return finnOneBulkCustomerPhoneDetails;
	}

	async checkCustomerIdentificationDetails(CUSTOMER_NUMBER: string) {
		const CustomerIdentificationDetails: any = await this.finnOneCustomerIdDetailsRepository.find(
			{
				where: { CUSTOMER_NUMBER },
			},
		);
		if (!CustomerIdentificationDetails) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return CustomerIdentificationDetails;
	}

	async checkCustomerBulkIdentificationDetails(cutomerNumberSuperSet: any) {
		const bulkCustomerIdentificationDetails: any = await this.finnOneCustomerIdDetailsRepository.find(
			{
				where: cutomerNumberSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Identification Details DB data');
		customOnboardingLogs.log(bulkCustomerIdentificationDetails);
		if (!bulkCustomerIdentificationDetails) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return bulkCustomerIdentificationDetails;
	}

	async checkCustomerEmailID(CUSTOMER_NUMBER: string) {
		const CustomerEmailID: any = await this.finnOneCustomerEmailIDRepository.find(
			{
				where: { CUSTOMER_NUMBER },
			},
		);
		if (!CustomerEmailID) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return CustomerEmailID;
	}

	async checkCustomerBulkEmailID(cutomerNumberSuperSet: any) {
		const bulkCustomerEmailID: any = await this.finnOneCustomerEmailIDRepository.find(
			{
				where: cutomerNumberSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Email Details DB data');
		customOnboardingLogs.log(bulkCustomerEmailID);
		if (!bulkCustomerEmailID) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return bulkCustomerEmailID;
	}

	async checkCustomerAddressDetails(CUSTOMER_NUMBER: string) {
		const CustomerAddressDetails: any = await this.finnOneCustomerAddressDetailsRepository.find(
			{
				where: { CUSTOMER_NUMBER },
			},
		);
		if (!CustomerAddressDetails) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return CustomerAddressDetails;
	}

	async checkCustomerBulkAddressDetails(cutomerNumberSuperSet: any) {
		const CustomerBulkAddressDetails: any = await this.finnOneCustomerAddressDetailsRepository.find(
			{
				where: cutomerNumberSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Address Details DB data');
		customOnboardingLogs.log(CustomerBulkAddressDetails);
		if (!CustomerBulkAddressDetails) {
			throw new HttpException(
				'Customer with cif not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return CustomerBulkAddressDetails;
	}

	async checkCustomerBulkApplicationDetails(neoCIFSuperSet: any) {
		const CustomerBulkApplicationDetails: any = await this.finnOneCustomerApplicationDetailsRepository.find(
			{
				where: neoCIFSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Application Details DB data');
		customOnboardingLogs.log(CustomerBulkApplicationDetails);
		if (!CustomerBulkApplicationDetails) {
			Logger.log('No Application Details found on Client Side for CIF Ids');
			Logger.log(neoCIFSuperSet);
			Logger.log('Skipping fields addition from references');
		}

		return CustomerBulkApplicationDetails;
	}
	//Bank Details changes -Last Commit start
	async checkCustomerBulkInstrumentDetails(neoCIFSuperSet: any) {
		let matchedBankDetailsInfo = [];
		let CustomerBulkApplicationDetails = [];
		const CustomerBulkApplicationDetailsWithoutFilter: any = await this.finnOneCustomerApplicationDetailsRepository.find(
			{
				where: neoCIFSuperSet,
			},
		);
		CustomerBulkApplicationDetailsWithoutFilter.forEach(element => {
			if (
				element.Disbursal_Status === 'Fully Disbursed' ||
				element.Disbursal_Status === 'Partial Disbursed'
			) {
				CustomerBulkApplicationDetails.push(element);
			}
		});
		customOnboardingLogs.log('Bulk Finnone Intrument Details DB data');
		customOnboardingLogs.log(CustomerBulkApplicationDetails);
		let inputForAppllicationInfo = [];
		let neoCIFIDApplicationNumberMap = {};
		let appNumToCIF = {};
		if (!CustomerBulkApplicationDetails) {
			Logger.log('No Intrument Details found on Client Side for CIF Ids');
			Logger.log(neoCIFSuperSet);
			Logger.log('Skipping fields addition from references');
		} else {
			CustomerBulkApplicationDetails.forEach(instrument => {
				if (!neoCIFIDApplicationNumberMap[instrument['Neo_CIF_ID']]) {
					neoCIFIDApplicationNumberMap[instrument['Neo_CIF_ID']] =
						instrument['APPLICATION_NUMBER'];
				}
				let num = instrument['APPLICATION_NUMBER'].substring(4) | 0;
				let maxNum = parseInt(
					neoCIFIDApplicationNumberMap[instrument['Neo_CIF_ID']].substring(4),
					10,
				);
				if (maxNum < num) {
					neoCIFIDApplicationNumberMap[instrument['Neo_CIF_ID']] =
						instrument['APPLICATION_NUMBER'];
				}
			});
			for (let [key, value] of Object.entries(neoCIFIDApplicationNumberMap)) {
				let appNum = value;
				inputForAppllicationInfo.push({ APPLICATION_NUMBER: value });
				appNumToCIF['' + appNum] = key;
			}
			const CustomerBulkInstrumentDetails: any = await this.finnOneCustomerInstrumentalDetailsViewRepository.find(
				{
					where: inputForAppllicationInfo,
				},
			);
			customOnboardingLogs.log('Bulk Finnone Application Details DB data');
			customOnboardingLogs.log(CustomerBulkInstrumentDetails);
			if (!CustomerBulkInstrumentDetails) {
				Logger.log('No Application Details found on Client Side for CIF Ids');
				Logger.log(inputForAppllicationInfo);
				Logger.log('Skipping fields addition from references');
			} else {
				CustomerBulkInstrumentDetails.forEach(appDetail => {
					let appNum = appDetail['APPLICATION_NUMBER'];
					if (appNumToCIF[appNum]) {
						appDetail['Neo_CIF_ID'] = appNumToCIF[appNum];
					}
					matchedBankDetailsInfo.push(appDetail);
				});
			}
		}
		return matchedBankDetailsInfo;
	}
	//Bank Details changes -Last Commit end
	async fetchCustomerNumberAndCIFMap(neoCIFSuperSet: any) {
		const customerBulkDetails: any = await this.finnOneCustomerViewRepository.find(
			{
				where: neoCIFSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Application Details DB data');
		customOnboardingLogs.log(customerBulkDetails);
		if (!customerBulkDetails) {
			Logger.log('No Application Details found on Client Side for CIF Ids');
			Logger.log(customerBulkDetails);
			Logger.log('Skipping fields addition from references');
		}
		let resultMap = {};
		let reverseResultMap = {};
		customerBulkDetails.forEach(cust => {
			if (cust['Neo_CIF_ID'] && !reverseResultMap[cust['Neo_CIF_ID']]) {
				reverseResultMap[cust['Neo_CIF_ID']] = cust['CUSTOMER_NUMBER'];
			} else if (cust['Neo_CIF_ID'] && reverseResultMap[cust['Neo_CIF_ID']]) {
				let maxNum = parseInt(
					cust['CUSTOMER_NUMBER'].substring(4),
					10,
				);
				let num = parseInt(
					reverseResultMap[cust['Neo_CIF_ID']].substring(4),
					10,
				);
				if (maxNum > num) {
					reverseResultMap[cust['Neo_CIF_ID']] = cust['CUSTOMER_NUMBER'];
				}
			}
		});
		for (let [key, value] of Object.entries(reverseResultMap)) {
			resultMap['' + value] = key;
		}
		return {result: resultMap, customerResponse: customerBulkDetails};
	}

	async checkAddressDetailsBulk(cNumSuperSet: any) {
		const addressBulkDetails: any = await this.finnOneFinnOneAddressDetailsViewRepository.find(
			{
				where: cNumSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Application Details DB data');
		customOnboardingLogs.log(addressBulkDetails);
		if (!addressBulkDetails) {
			Logger.log('No Application Details found on Client Side for CIF Ids');
			Logger.log(cNumSuperSet);
			Logger.log('Skipping fields addition from references');
		}

		return addressBulkDetails;
	}

	async checkIncomeDetailsBulk(cNumSuperSet: any) {
		const incomeBulkDetails: any = await this.finnOneFinnOneIncomeDetailsViewRepository.find(
			{
				where: cNumSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Application Details DB data');
		customOnboardingLogs.log(incomeBulkDetails);
		if (!incomeBulkDetails) {
			Logger.log('No Application Details found on Client Side for CIF Ids');
			Logger.log(cNumSuperSet);
			Logger.log('Skipping fields addition from references');
		}

		return incomeBulkDetails;
	}

	async checkEmploymentDetailsBulk(cNumSuperSet: any) {
		const employmentBulkDetails: any = await this.finnOneFinnOneEmploymnetDetailsViewRepository.find(
			{
				where: cNumSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone Application Details DB data');
		customOnboardingLogs.log(employmentBulkDetails);
		if (!employmentBulkDetails) {
			Logger.log('No Application Details found on Client Side for CIF Ids');
			Logger.log(cNumSuperSet);
			Logger.log('Skipping fields addition from references');
		}

		return employmentBulkDetails;
	}

	async checkCustomerBulkReferences(applicationNumberSuperSet: any) {
		const CustomerBulkRefrence: any = await this.finnOneCustomerReferencesRepository.find(
			{
				where: applicationNumberSuperSet,
			},
		);
		customOnboardingLogs.log('Bulk Finnone References Details DB data');
		customOnboardingLogs.log(CustomerBulkRefrence);
		if (!CustomerBulkRefrence) {
			Logger.log('No References found on Client Side for Application Numbers');
			Logger.log(applicationNumberSuperSet);
			Logger.log('Skipping fields addition from references');
		}

		return CustomerBulkRefrence;
	}

	// createLoyalityMappedObject = qresult => {
	// 	let customer = {};
	// 	let customerProfile = {};
	// 	let customerCard = {};
	// 	//for(let i= 0;i<qresult.length;i++){
	// 	for (const [okey, ovalue] of Object.entries(qresult)) {
	// 		let matchFound = false;
	// 		for (const [key, value] of Object.entries(LoyaltyDBColumnMapping)) {
	// 			if (!matchFound && okey === key) {
	// 				matchFound = true;
	// 				switch (value['entity'][0]) {
	// 					case 'Customer':
	// 						customer[value['column'][0]] = ovalue;
	// 						if (value['column'][0] === 'panno') {
	// 							customer['id_type'] = 'PAN';
	// 							customer['id_no'] = ovalue;
	// 						}
	// 						break;
	// 					case 'CustomerProfile':
	// 						customerProfile[value['column'][0]] = ovalue;
	// 						break;
	// 					case 'CustomerCard':
	// 						customerCard[value['column'][0]] = ovalue;
	// 						break;
	// 					default:
	// 						break;
	// 				}
	// 			}
	// 			if (matchFound) {
	// 				break;
	// 			}
	// 		}
	// 	}
	// 	//}
	// 	return {
	// 		customerObj: customer,
	// 		customerProfileObj: customerProfile,
	// 		customerCardObj: customerCard,
	// 	};
	// };

	checkReturnString(entity) {
		return entity || "";
	};
	membershipStatusMapping(value: any) {
		value = value.toLocaleLowerCase();
		switch (value) {
			case 'a':
				return 'Associate';
			case 'ap':
				return 'Premium Associate';
			case 's':
				return 'Silver';
			case 'g':
				return 'Gold';
			case 'p':
				return 'Platinum';
			case 'd':
				return 'Diamond';
			default:
				return null;
		}
	}
	membershipDetailsMapping(value: any) {
		value = value.toLocaleLowerCase();
		switch (value) {
			case 'a':
				return 'Active';
			case 's':
				return 'Suspended';
			case 'x':
				return 'Cancelled';
			default:
				return null;
		}
	}
	createLoyalityMappedObject = qresult => {
		let customer = {};
		let customerProfile = {};
		let customerCard = {};
		//for(let i= 0;i<qresult.length;i++){
		for (let [okey, ovalue] of Object.entries(qresult)) {
			let matchFound = false;
			for (const [key, value] of Object.entries(LoyaltyDBColumnMapping)) {
				if (!matchFound && okey === key) {
					matchFound = true;
					switch (value['entity'][0]) {
						case 'Customer':
							customer[value['column'][0]] = ovalue;
							if (value['column'][0] === 'panno') {
								customer['id_type'] = 'PAN';
								customer['id_no'] = ovalue;
							}
							break;
						case 'CustomerProfile':
							customerProfile[value['column'][0]] = ovalue;
							break;
						case 'CustomerCard':
							if (
								(key === 'PREVIOUS_MEMBERSHIP_STATUS' ||
									key === 'CURRENT_MEMBERSHIP_STATUS') &&
								ovalue
							) {
								ovalue = this.membershipStatusMapping(ovalue);
							}
							if (key === 'CARD_STATUS' && ovalue) {
								ovalue = this.membershipDetailsMapping(ovalue);
							}
							customerCard[value['column'][0]] = ovalue;
							break;
						default:
							break;
					}
				}
				if (matchFound) {
					break;
				}
			}
		}
		//}
		return {
			customerObj: customer,
			customerProfileObj: customerProfile,
			customerCardObj: customerCard,
		};
	};

	createCustomerMappedObject = (qresult, preparedObjLatest) => {
		let customer = preparedObjLatest.customer;
		let customerProfile = preparedObjLatest.customerProfile;
		let customerCard = preparedObjLatest.customerCard;
		let eMandateObj = preparedObjLatest.eMandate;
		for (const [okey, ovalue] of Object.entries(qresult)) {
			let matchFound = false;
			for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
				if (!matchFound && okey === key) {
					matchFound = true;
					switch (value['entity'][0]) {
						case 'Customer':
							customer[value['column'][0]] = ovalue;
							// if (key === 'CUSTOMER_NAME') {
							// 	let nameValue = '' + ovalue;
							// 	let nameSplit = nameValue.split(' ');
							// 	if (nameSplit.length === 3) {
							// 		customer['first_name'] = nameSplit[0];
							// 		customer['middle_name'] = nameSplit[1];
							// 		customer['last_name'] = nameSplit[2];
							// 	} else if (nameSplit.length === 2) {
							// 		customer['first_name'] = nameSplit[0];
							// 		customer['last_name'] = nameSplit[1];
							// 	} else {
							// 		customer['first_name'] = nameSplit[0];
							// 	}
							// }
							if (key === 'GENDER') {
								let genderValue = '' + ovalue;
								if (genderValue) {
									genderValue = genderValue.toUpperCase();
								}
								customer[value['column'][0]] = genderValue;
							}
							break;
						case 'CustomerProfile':
							customerProfile[value['column'][0]] = ovalue;
							break;
						case 'EMandate':
							eMandateObj[value['column'][0]] = ovalue;
							break;
					}
				}
				if (matchFound) {
					break;
				}
			}
		}
		return {
			customerObj: customer,
			customerProfileObj: customerProfile,
			customerCardObj: customerCard,
			eMandateObj: eMandateObj,
		};
	};

	createReferenceMappedObject = (qresult, preparedObjLatest) => {
		let customer = preparedObjLatest.customer;
		let customerProfile = preparedObjLatest.customerProfile;
		let customerCard = preparedObjLatest.customerCard;
		for (const [okey, ovalue] of Object.entries(qresult)) {
			let matchFound = false;
			for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
				if (!matchFound && okey === key) {
					matchFound = true;
					switch (value['entity'][0]) {
						case 'Customer':
							customer[value['column'][0]] = ovalue;
							break;
						case 'CustomerProfile':
							let keyToStore = value['column'][0];
							let newKeyToStore = keyToStore.replace("reference", "reference2");
							customerProfile[newKeyToStore] = ovalue;
							break;
					}
				}
				if (matchFound) {
					break;
				}
			}
		}
		return {
			customerObj: customer,
			customerProfileObj: customerProfile,
			customerCardObj: customerCard,
		};
	};

	createMappedObject = (qresult, preparedObjLatest) => {
		let customer = preparedObjLatest.customer;
		let customerProfile = preparedObjLatest.customerProfile;
		let customerCard = preparedObjLatest.customerCard;
		for (const [okey, ovalue] of Object.entries(qresult)) {
			let matchFound = false;
			for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
				if (!matchFound && okey === key) {
					matchFound = true;
					switch (value['entity'][0]) {
						case 'Customer':
							customer[value['column'][0]] = ovalue;
							break;
						case 'CustomerProfile':
							if ('Address_Type' in qresult && qresult['Address_Type'] !== 'PermanentAddress' && qresult['Address_Type'] == 'OfficeAddress') {
								customerProfile[value['column'][0]] = ovalue;
							} else if (!qresult.hasOwnProperty('Address_Type')) {
								customerProfile[value['column'][0]] = ovalue;
							}
							if (value['column'][0] === 'address_type' && 'Address_Type' in qresult && qresult['Address_Type'] === 'ResidentialAddress') {	
								customerProfile['address1'] = this.checkReturnString(qresult['Address_Line_1']) + this.checkReturnString(qresult['Address_Line_2']) + this.checkReturnString(qresult['Address_Line_3']);
							} else if (value['column'][0] === 'address_type' && qresult['Address_Type'] === 'PermanentAddress') {
								customerProfile['permanent_address'] =
								this.checkReturnString(qresult['Address_Line_1']) +
								this.checkReturnString(qresult['Address_Line_2']) +
								this.checkReturnString(qresult['Address_Line_3']);
							} else if (value['column'][0] === 'address_type' && qresult['Address_Type'] === 'OfficeAddress') {
								customerProfile['office_address'] = customerProfile['full_address'];
							}

							if ((value['column'][0] === 'land_mark' || value['column'][0] === 'zip_code' || value['column'][0] === 'state' || value['column'][0] === 'accomodation_type') && ('Address_Type' in qresult && qresult['Address_Type'] === 'PermanentAddress')) {
								if (value['column'][0] === 'land_mark') {
									customerProfile['permanent_landmark'] = ovalue;
								}
								if (value['column'][0] === 'zip_code') {
									customerProfile['permanent_pincode'] = ovalue;
								}
								if (value['column'][0] === 'state') {
									customerProfile['permanent_state'] = ovalue;
								}
								if (value['column'][0] === 'accomodation_type') {
									customerProfile['permanent_residence_status'] = ovalue;
								}
							} else if ((value['column'][0] === 'land_mark' || value['column'][0] === 'zip_code' || value['column'][0] === 'state' || value['column'][0] === 'accomodation_type') && ('Address_Type' in qresult && qresult['Address_Type'] === 'OfficeAddress')) {
								if (value['column'][0] === 'land_mark') {
									customerProfile['office_landmark'] = ovalue;
								}
								if (value['column'][0] === 'zip_code') {
									customerProfile['office_pincode'] = ovalue;
								}
								if (value['column'][0] === 'state') {
									customerProfile['office_state'] = ovalue;
								}
								if (value['column'][0] === 'accomodation_type') {
									customerProfile['office_residence_status'] = ovalue;
								}
							}
							break;
					}
				}
				if (matchFound) {
					break;
				}
			}
		}
		return {
			customerObj: customer,
			customerProfileObj: customerProfile,
			customerCardObj: customerCard,
		};
	};
}

@Injectable()
export class CustomerService {
	private readonly cacheHost: string;

	constructor(
		@InjectRepository(Customer)
		private readonly customerRepository: Repository<Customer>,
		@InjectRepository(CustomerDevice)
		private readonly customerDeviceRepo: Repository<CustomerDevice>,
		@InjectRepository(CustomerTemp)
		private readonly customerTempRepository: Repository<CustomerTemp>,
		@InjectRepository(EMandate)
		private readonly eMandateRepository: Repository<EMandate>,
		@InjectRepository(Branch)
		private readonly branchRepository: Repository<Branch>,
		@InjectRepository(CreditModule)
		private readonly creditRepository: Repository<CreditModule>,
		@InjectRepository(CustomerWallet)
		private readonly customerWalletRepository: Repository<CustomerWallet>,
		@InjectRepository(EMandateTemp)
		private readonly eMandateTempRepository: Repository<EMandateTemp>,
		@InjectRepository(CustomerProfile)
		private readonly customerProfileRepository: Repository<CustomerProfile>,
		@InjectRepository(CustomerCard)
		private readonly customerCardRepository: Repository<CustomerCard>,
		@InjectRepository(CustomerPointsHistory)
		private readonly CustomerPointsHistoryRepo: Repository<CustomerPointsHistory>,
		@InjectRepository(ActivityLog)
		private readonly activityLogRepository: Repository<ActivityLog>,
		private readonly httpService: HttpService,
		@Inject(WINSTON_MODULE_PROVIDER)
		private readonly logger: Logger,
		@InjectQueue('userLog') private readonly userLogQueue: Queue,
	) {}

	async getHost() {
		// if (this.cacheHost) {
		// 	return this.cacheHost;
		// }
		// const host = await this.httpService.get('http://icanhazip.com').toPromise();
		// return host.data;
		return '';
	}

	async AuthenticateForMiddleware() {
		const response = await Axios.post(
			`${process.env.AUTHENTICATE_FOR_MIDDLEWARE}`,
			{
				consumer_code: 'demo',
				email: 'demo@rosebay.com',
				phone_number: '987654321',
				phone_number_ext: '977',
				password: 'password',
			},
		);

		return response.data.key;
	}

	async syncCustomer(data) {
		try {
			const key = await this.AuthenticateForMiddleware();
			const response = await Axios.post(
				`${process.env.SYNC_CUSTOMER}${data.customer_code}`,
				data,
				{
					headers: {
						Authorization: `Token ${key}`,
					},
				},
			);
			return response.data;
		} catch (e) {
			throw new HttpException(e.response.data.response, e.data.response.status);
		}
	}

	async getCustomerIdxByCIF(loyaltyCustomerNumber: string) {
		const duplicateCustomer = await this.customerRepository.findOne({
			where: {
				loyalty_customer_number: loyaltyCustomerNumber,
				is_obsolete: false,
			},
		});

		if (duplicateCustomer) {
			return duplicateCustomer.idx;
		} else {
			return '';
		}
	}

	async getCustomerIdByCIF(loyaltyCustomerNumber: string) {
		const duplicateCustomer = await this.customerRepository.findOne({
			where: {
				loyalty_customer_number: loyaltyCustomerNumber,
				is_obsolete: false,
			},
		});
		console.log('Service response for ' + loyaltyCustomerNumber);
		console.log(duplicateCustomer);
		if (duplicateCustomer) {
			return duplicateCustomer.id;
		} else {
			return -1;
		}
	}

	async getBranchIdx(ifscInput) {
		const branchResult = await this.branchRepository.findOne({
			where: {
				ifsc_code: ifscInput,
				is_obsolete: false,
			},
		});

		if (branchResult) {
			return branchResult.idx;
		} else {
			return '';
		}
	}

	async getAllCustomers(
		page: number,
		offset: number,
		limit: number,
		search: string,
		status: string,
		order_by: string,
	) {
		const userLog = {
			user: process.env.username,
			action: 'get all customers',
			action_message: 'User requested all customers',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const query = getRepository(Customer)
			.createQueryBuilder('customer')
			.leftJoinAndMapOne(
				'customer.emandate',
				EMandate,
				'emandate',
				'emandate.customer_idx = customer.idx',
			)
			.where('customer.is_obsolete = :is_obsolete', {
				is_obsolete: false,
			});

		if (status !== '') {
			query.andWhere('customer.is_active = :status', {
				status: status.toLowerCase() === 'active',
			});
		}

		if (search !== '') {
			query.andWhere(
				new Brackets(qb => {
					qb.where(
						`CONCAT(customer.first_name, ' ', customer.middle_name, ' ', customer.last_name) ILIKE :search OR CONCAT(customer.first_name, ' ', customer.last_name) ILIKE :search OR customer.mobile_number ILIKE :search OR customer.middle_name ILIKE :search OR customer.last_name ILIKE :search`,
						{ search: `%${search}%` },
					);
				}),
			);
		}

		if (order_by !== '') {
			query.orderBy(`customer.${order_by}`, 'ASC');
		} else {
			query.orderBy(`customer.first_name`, 'ASC');
		}

		const [result, total] = await query
			.take(limit)
			.skip(offset)
			.getManyAndCount();

		const pages = Math.ceil(total / limit);
		const host = await this.getHost();
		return paginate(pages, page, total, host, result);
	}

	async logUser(userLog: unknown) {
		await this.userLogQueue.add('saveUserLog', { dataObject: userLog });
	}

	async checkCustomer(idx: string) {
		const customer: any = await this.customerRepository.findOne({
			where: { idx, is_obsolete: false },
		});

		if (!customer) {
			throw new HttpException(
				'Customer with idx not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return customer;
	}

	async getAllCustomerByIdx(idx: string): Promise<any> {
		const userLog = {
			user: process.env.username,
			action: 'get one customer',
			action_message: 'User requested one customer by id',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const customer: any = await this.customerRepository.findOne({
			where: { idx, is_obsolete: false },
		});

		if (!customer) {
			throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
		}
		const customerId = customer.id;

		let customerDataToReturn: any = {};

		const customerEmandateInfo: any = await this.eMandateRepository.findOne({
			where: { customer_idx: idx, is_obsolete: false },
			select: ['full_name', 'account_number', 'account_type', 'idx'],
		});

		if (!customerEmandateInfo) {
			customerDataToReturn.full_name = '';
			customerDataToReturn.account_number = '';
			customerDataToReturn.account_type = '';
		}

		const customerProfileInfo = await this.customerProfileRepository.findOne({
			where: { customer: customerId, is_obsolete: false },
			select: [
				'customer_info_file_number',
				'marital_status',
				'constitution_code',
				'nationality',
				'identification_type',
				'identification_number',
				'country_of_issue',
				'address_type',
				'address1',
				'pin_code',
				'state',
				'reference_resident_status',
				'land_mark',
				'years_at_current_state',
				'months_at_current_state',
				'phone1',
				'occupation_type',
				'employer_code',
				'nature_of_business',
				'industry',
				'registration_number',
				'organization_name',
				'nature_of_profession',
				'net_income',
				'interest_charge_method',
				'reference_name',
				'reference_relationship',
				'reference_mobile_number',
				'reference_email',
				'ifsc',
				'bank_name_id',
				'customer_id',
				'salutation',
				'customer_type',
				'marital_status_code',
				'inst_description',
				'profession',
				'constitution_description',
				'phone_number',
				'preferred_language',
				'customer_category',
				'customer_segment',
				'additional_info',
				'country_code',
				'isd_code',
				'phone_number_type',
				'primary_telephone',
				'std_code',
				'is_phone_number_verified',
				'associated_loan_app_id',
				'accomodation_type',
				'active_address',
				'address_line1',
				'address_line2',
				'address_line3',
				'address_line4',
				'area',
				'city',
				'country',
				'full_address',
				'landmark',
				'primary_address',
				'region',
				'residence_type',
				'taluka',
				'village',
				'zip_code',
				'is_primary_email',
				'default_id_for_customer',
				'expiry_date_of_identification',
				'issue_date',
				'primary_id',
				'duration_at_current_city',
				'month_duration_at_current_city',
				'address_proof',
				'permanent_address',
				'permanent_landmark',
				'permanent_pincode',
				'permanent_state',
				'permanent_residence_status',
				'permanent_duration_at_current_address',
				'permanent_address_proof',
				'bank_name',
				'loan_details',
				'preferred_branch',
				'monthly_income',
				'years_in_job',
				'months_in_job',
				'office_address',
				'office_landmark',
				'office_pincode',
				'office_state',
				'income_proof',
				'reference_address',
				'reference_landmark',
				'reference_pincode',
				'reference_state',
				'reference2_name',
				'reference2_mobile_number',
				'reference2_address',
				'reference2_landmark',
				'reference2_pincode',
				'reference2_state',
				'reference2_relationship',
				'has_terms_aggreed',
				'employer_name',
			],
		});

		if (!customerProfileInfo) {
			customerDataToReturn.customer_info_file_number = '';
			customerDataToReturn.marital_status = '';
			customerDataToReturn.constitution_code = '';
			customerDataToReturn.nationality = '';
			customerDataToReturn.identification_type = '';
			customerDataToReturn.identification_number = '';
			customerDataToReturn.country_of_issue = '';
			customerDataToReturn.address_type = '';
			customerDataToReturn.address1 = '';
			customerDataToReturn.pin_code = '';
			customerDataToReturn.state = '';
			customerDataToReturn.resident_status = '';
			customerDataToReturn.land_mark = '';
			customerDataToReturn.years_at_current_state = '';
			customerDataToReturn.months_at_current_state = '';
			customerDataToReturn.phone1 = '';
			customerDataToReturn.occupation_type = '';
			customerDataToReturn.employer_code = '';
			customerDataToReturn.nature_of_business = '';
			customerDataToReturn.industry = '';
			customerDataToReturn.registration_number = '';
			customerDataToReturn.organization_name = '';
			customerDataToReturn.nature_of_profession = '';
			customerDataToReturn.net_income = '';
			customerDataToReturn.interest_charge_method = '';
			customerDataToReturn.reference_name = '';
			customerDataToReturn.reference_relationship = '';
			customerDataToReturn.reference_mobile_number = '';
			customerDataToReturn.reference_email = '';
			customerDataToReturn.ifsc = '';
			customerDataToReturn.bank_name_id = '';
			customerDataToReturn.customer_id = '';
			customerDataToReturn.salutation = '';
			customerDataToReturn.customer_type = '';
			customerDataToReturn.marital_status_code = '';
			customerDataToReturn.inst_description = '';
			customerDataToReturn.profession = '';
			customerDataToReturn.constitution_description = '';
			customerDataToReturn.phone_number = '';
			customerDataToReturn.preferred_language = '';
			customerDataToReturn.customer_category = '';
			customerDataToReturn.customer_segment = '';
			customerDataToReturn.additional_info = '';
			customerDataToReturn.country_code = '';
			customerDataToReturn.isd_code = '';
			customerDataToReturn.phone_number_type = '';
			customerDataToReturn.primary_telephone = '';
			customerDataToReturn.std_code = '';
			customerDataToReturn.is_phone_number_verified = '';
			customerDataToReturn.associated_loan_app_id = '';
			customerDataToReturn.accomodation_type = '';
			customerDataToReturn.active_address = '';
			customerDataToReturn.address_line1 = '';
			customerDataToReturn.address_line2 = '';
			customerDataToReturn.address_line3 = '';
			customerDataToReturn.address_line4 = '';
			customerDataToReturn.area = '';
			customerDataToReturn.city = '';
			customerDataToReturn.country = '';
			customerDataToReturn.full_address = '';
			customerDataToReturn.landmark = '';
			customerDataToReturn.primary_address = '';
			customerDataToReturn.region = '';
			customerDataToReturn.residence_type = '';
			customerDataToReturn.taluka = '';
			customerDataToReturn.village = '';
			customerDataToReturn.zip_code = '';
			customerDataToReturn.is_primary_email = '';
			customerDataToReturn.default_id_for_customer = '';
			customerDataToReturn.expiry_date_of_identification = '';
			customerDataToReturn.issue_date = '';
			customerDataToReturn.primary_id = '';
			customerDataToReturn.duration_at_current_city = '';
			customerDataToReturn.month_duration_at_current_city = '';
			customerDataToReturn.address_proof = '';
			customerDataToReturn.permanent_address = '';
			customerDataToReturn.permanent_landmark = '';
			customerDataToReturn.permanent_pincode = '';
			customerDataToReturn.permanent_state = '';
			customerDataToReturn.permanent_residence_status = '';
			customerDataToReturn.permanent_duration_at_current_address = '';
			customerDataToReturn.permanent_address_proof = '';
			customerDataToReturn.bank_name = '';
			customerDataToReturn.loan_details = '';
			customerDataToReturn.preferred_branch = '';
			customerDataToReturn.monthly_income = '';
			customerDataToReturn.years_in_job = '';
			customerDataToReturn.months_in_job = '';
			customerDataToReturn.office_address = '';
			customerDataToReturn.office_landmark = '';
			customerDataToReturn.office_pincode = '';
			customerDataToReturn.office_state = '';
			customerDataToReturn.income_proof = '';
			customerDataToReturn.reference_address = '';
			customerDataToReturn.reference_landmark = '';
			customerDataToReturn.reference_pincode = '';
			customerDataToReturn.reference_state = '';
			customerDataToReturn.reference2_name = '';
			customerDataToReturn.reference2_mobile_number = '';
			customerDataToReturn.reference2_address = '';
			customerDataToReturn.reference2_landmark = '';
			customerDataToReturn.reference2_pincode = '';
			customerDataToReturn.reference2_state = '';
			customerDataToReturn.reference2_relationship = '';
			customerDataToReturn.has_terms_aggreed = false;
			customerDataToReturn.employer_name = '';
		}

		const customerCardInfo = await this.customerCardRepository.findOne({
			where: { customer_idx: idx, is_obsolete: false },
			select: [
				'membership_type',
				'membership_number',
				'valid_till',
				'reward_point',
				'card_status',
				'total_points',
				'points_elapsed',
				'point_redemption',
				'registration_date',
				'update_date',
				'previous_membership_status',
				'point_redeemed',
				'point_available_redemption',
			],
		});

		if (!customerCardInfo) {
			customerDataToReturn.membership_type = '';
			customerDataToReturn.membership_number = '';
			customerDataToReturn.valid_till = '';
			customerDataToReturn.reward_point = '';
			customerDataToReturn.card_status = '';
			customerDataToReturn.total_points = '';
			customerDataToReturn.points_elapsed = '';
			customerDataToReturn.point_redemption = '';
			customerDataToReturn.registration_date = '';
			customerDataToReturn.update_date = '';
			customerDataToReturn.previous_membership_status = '';
			customerDataToReturn.point_redeemed = '';
			customerDataToReturn.point_available_redemption = '';
		}

		customerDataToReturn = {
			...customer,
			...customerEmandateInfo,
			...customerProfileInfo,
			...customerCardInfo,
			...customerDataToReturn,
			document_url: `${process.env.MINIO_ADDRESSPROOF_DOCUMENTS}`,
		};

		cleanData(customerDataToReturn, [
			'id',
			'is_obsolete',
			'modified_on',
			'created_on',
			'password',
			'is_password_set',
			'is_mpin_set',
			'is_security_set',
		]);

		return customerDataToReturn;

		// let bankInfo;

		// if (customerEmandateInfo) {
		// 	try {
		// 		const response = await Axios.get(
		// 			`${process.env.GET_BRANCH_INFO}${customerEmandateInfo.branch_idx}`,
		// 		);
		// 		if (response.status === 200 || response.status === 201) {
		// 			customOnboardingLogs.log(response.data, 'here is data');

		// 			bankInfo = response.data;
		// 		}
		// 	} catch (e) {
		// 		Logger.log(e);
		// 		throw new HttpException(
		// 			e.response.data.response,
		// 			e.data.response.status,
		// 		);
		// 	}

		// 	return customerWithEmandate;
		// }
	}

	async getAllPendingCustomers(
		page: number,
		offset: number,
		limit: number,
		request_type: string,
		search = '',
	) {
		const userLog = {
			user: process.env.username,
			action: 'get all pending customers',
			action_message: 'User requested pending customers',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const query = getRepository(CustomerTemp)
			.createQueryBuilder('customerTemp')
			.where('customerTemp.status = :status', { status: Status.PENDING })
			.andWhere('customerTemp.is_obsolete = :is_obsolete', {
				is_obsolete: false,
			});

		if (request_type === 'by') {
			query.andWhere('customerTemp.created_by = :idx', {
				idx: process.env.idx,
			});
		}
		if (request_type === 'to') {
			query.andWhere('customerTemp.created_by != :idx', {
				idx: process.env.idx,
			});
		}

		if (search !== '') {
			query.andWhere(
				new Brackets(qb => {
					qb.where(
						`CONCAT(customerTemp.first_name, ' ', customerTemp.middle_name, ' ', customerTemp.last_name) ILIKE :search OR CONCAT(customerTemp.first_name, ' ', customerTemp.last_name) ILIKE :search OR customerTemp.mobile_number ILIKE :search OR customerTemp.middle_name ILIKE :search OR customerTemp.last_name ILIKE :search`,
						{ search: `%${search}%` },
					);
				}),
			);
		}

		const [result, total] = await query
			.take(limit)
			.skip(offset)
			.getManyAndCount();

		let mappedResult = [];

		if (result.length > 0) {
			const getAllCreatedByIdx =
				result &&
				result.map(el => {
					return el.created_by;
				});

			const uniqueCreatedByIdx: any = [...new Set(getAllCreatedByIdx)];

			const getUserInfoFromIdx = await Axios.post(
				`${process.env.GET_USER_INFO}`,
				{
					usersArray: uniqueCreatedByIdx,
				},
			);

			mappedResult = result.map(el => {
				return {
					...el,
					created_by: getUserInfoFromIdx.data[el.created_by],
				};
			});
		}

		const pages = Math.ceil(total / limit);
		const host = await this.getHost();
		return paginate(pages, page, total, host, mappedResult);
	}

	async getPendingCustomerByIdx(idxVal: string): Promise<any> {
		const userLog = {
			user: process.env.username,
			action: 'get one pending customer',
			action_message: 'User requested one pending customer',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		let pendingCustomer: any = await this.customerTempRepository.findOne({
			where: { idx: idxVal, is_obsolete: false },
		});

		if (!pendingCustomer) {
			throw new HttpException(
				'Customer with Idx not found',
				HttpStatus.NOT_FOUND,
			);
		}

		const emandateInfo = await this.getEmandateTempInfo(pendingCustomer.id);

		pendingCustomer = { ...pendingCustomer, ...emandateInfo };

		pendingCustomer.customer = await this.customerRepository.findOne({
			id: pendingCustomer.customer_id,
			is_obsolete: false,
		});

		const emandateInsideCustomerInfo = await this.getEmandateInfo(
			pendingCustomer.customer.idx,
		);

		pendingCustomer.customer = {
			...pendingCustomer.customer,
			...emandateInsideCustomerInfo,
		};

		const getUserInfoFromIdx = await Axios.post(
			`${process.env.GET_USER_INFO}`,
			{
				usersArray: [pendingCustomer.created_by],
			},
		);

		pendingCustomer.created_by =
			getUserInfoFromIdx.data[pendingCustomer.created_by];

		delete pendingCustomer.id;

		return pendingCustomer;
	}

	async getEmandateInfo(customer_idx) {
		const customerEmandateInfo: any = await this.eMandateRepository.findOne({
			where: { customer_idx, is_obsolete: false },
			select: [
				'full_name',
				'account_number',
				'account_type',
				'branch_idx',
				'idx',
			],
		});

		if (!customerEmandateInfo) {
			return {
				full_name: '',
				account_number: '',
				account_type: '',
				branch_idx: '',
				branch_name: '',
				ifsc_code: '',
				city_name: '',
				state_name: '',
				bank_name: '',
			};
		}
		let bankInfo;

		if (customerEmandateInfo) {
			try {
				const response = await Axios.get(
					`${process.env.GET_BRANCH_INFO}${customerEmandateInfo.branch_idx}`,
				);
				if (response.status === 200 || response.status === 201) {
					bankInfo = response.data;
				}
			} catch (e) {
				Logger.log(e);
				throw new HttpException(
					e.response.data.response,
					e.data.response.status,
				);
			}

			const customerWithEmandate: any = {
				...customerEmandateInfo,
				...bankInfo,
			};
			return customerWithEmandate;
		}
	}

	async getEmandateTempInfo(id) {
		const customerEmandateInfo: any = await this.eMandateTempRepository.findOne(
			{
				where: { customer_temp_id: id, is_obsolete: false },
				select: [
					'full_name',
					'account_number',
					'account_type',
					'branch_idx',
					'idx',
				],
			},
		);

		if (!customerEmandateInfo) {
			return {
				full_name: '',
				account_number: '',
				account_type: '',
				branch_idx: '',
				branch_name: '',
				ifsc_code: '',
				city_name: '',
				state_name: '',
				bank_name: '',
			};
		}
		let bankInfo;

		if (customerEmandateInfo) {
			try {
				const response = await Axios.get(
					`${process.env.GET_BRANCH_INFO}${customerEmandateInfo.branch_idx}`,
				);
				if (response.status === 200 || response.status === 201) {
					bankInfo = response.data;
				}
			} catch (e) {
				Logger.log(e);
				throw new HttpException(
					e.response.data.response,
					e.data.response.status,
				);
			}

			const customerWithEmandate: any = {
				...customerEmandateInfo,
				...bankInfo,
			};
			return customerWithEmandate;
		}
	}

	async getPendingCustomerByCondition(condition: any): Promise<CustomerTemp> {
		return this.customerTempRepository.findOne(condition);
	}

	async deleteCustomer(idx: string): Promise<IResponse> {
		const userLog = {
			user: process.env.username,
			action: 'delete customer',
			action_message: 'User requested to delete customer',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const customer = await this.customerRepository.findOne({
			idx,
		});

		const id = customer.id;
		cleanData(customer, [
			'id',
			'idx',
			'is_obsolete',
			'is_active',
			'created_on',
			'modified_on',
		]);
		Logger.log('process: ' + process.env.is_superadmin, 'CustomerService');
		if (process.env.is_superadmin === 'true') {
			await this.customerDeviceRepo.update(
				{ customer_id: BigInt(id) },
				{ is_obsolete: true },
			);
			await this.customerRepository.update({ idx }, { is_obsolete: true });
			await this.eMandateRepository.update(
				{ customer_idx: idx },
				{ is_obsolete: true },
			);
			return { statusCode: 200, message: 'Customer Deleted' };
		}
		await this.customerTempRepository.save({
			customer_id: id.toString(),
			status: Status.PENDING,
			operation: Operations.DELETE,
			created_by: process.env.idx,
			...customer,
		});

		const payload = `{ message: "Customer delete Request", idx: "${idx}" }`;

		await this.sendForNotification(
			process.env.idx,
			Category.CUSTOMER_DELETE,
			payload,
			'user',
		);

		return { statusCode: 200, message: 'Request awaiting approval' };
	}

	async bulkCustomerWalletCreate(data) {
		let customerWallets = [];
		for (let i = 0, len = data.length; i < len; i++) {
			let custWallet = {
				customer_idx: data[i],
				balance: 0,
				is_rl_active: 'INACTIVE',
				is_obsolete: false,
			};
			// const customerWallet = custWallet;

			const walletEntry = await this.customerWalletRepository.findOne({
				where: {
					customer_idx: data[i],
					is_obsolete: false,
				},
			});

			if (!walletEntry) {
				customerWallets.push(custWallet);
			}
		}
		console.log('Customer Wallet final create Array');
		console.log(customerWallets);
		await this.customerWalletRepository.save(customerWallets);
		return { status: 200, message: 'New Customer Wallet Data Imported' };
	}

	async bulkCreditModuleCreate(data) {
		let creditModules = [];
		for (let i = 0, len = data.length; i < len; i++) {
			const creditModule = {
				customer_idx: data[i],
				credit_limit: 0,
				is_obsolete: false,
			};

			const creditEntry = await this.creditRepository.findOne({
				where: {
					customer_idx: data[i],
					is_obsolete: false,
				},
			});

			if (!creditEntry) {
				creditModules.push(creditModule);
			}
		}
		console.log('Credit module final create Array');
		console.log(creditModules);
		await this.creditRepository.save(creditModules);
		return { status: 200, message: 'New Credit Module Data Imported' };
	}

	async bulkCustomerCreate(data) {
		const arr = [];
		const customers: Customer[] = [];
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		for (let i = 0, len = data.length; i < len; i++) {
			const customerValidate: CreateCustomer = data[i];

			// validation
			const error = await this.customExcelValidate(customerValidate, i);
			// Logger.log(error, 'her');
			if (error) {
				Logger.log('Gender validation failed for Customer create');
				Logger.log(data[i].customer_code);
				Logger.log('Skipping insertion for above customer');
				continue;
			}

			// const Errors = await validate(customerValidate).then(errors => {

			// 	Logger.log(errors, "here are error in loop")
			// 	if (errors.length > 0) {
			// 		return { status: 'True', errors };
			// 	}
			// });

			// return Logger.log(Errors);
			// if (Errors) {
			// 	if (Errors.status === 'True') {
			// 		throw new BadRequestException(Errors.errors);
			// 	}
			// }
			const customer: Customer = data[i];
			
			console.log('Has no duplicate check for email Array ---');
			console.log(arr);
			const emailDuplicate = await this.hasNoDuplicate(arr, customer.email);
			arr.push(customer.email);
			if (emailDuplicate === false) {
				Logger.log('Duplicate Email found for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping insertion for above customer');
				continue;
			}
			
			const mobileNumberDuplicate = await this.hasNoDuplicate(
				arr,
				customer.mobile_number,
			);
			arr.push(customer.mobile_number);
			if (mobileNumberDuplicate === false) {
				Logger.log('Mobile number duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping insertion for above customer');
				continue;
			}

			
			const customerCodeDuplicate = await this.hasNoDuplicate(
				arr,
				customer.customer_code,
			);
			arr.push(customer.customer_code);
			if (customerCodeDuplicate === false) {
				Logger.log('Customer Code duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping insertion for above customer');
				continue;
			}
			const panNoDuplicate = await this.hasNoDuplicate(arr, customer.panno);
			arr.push(customer.panno);
			if (panNoDuplicate === false) {
				Logger.log('Pan No duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping insertion for above customer');
				continue;
			}

			const duplicateCustomer = await this.customerRepository.findOne({
				where: {
					email: customer.email,
					id_no: customer.id_no,
					mobile_number: customer.mobile_number,
					customer_code: customer.customer_code,
					panno: customer.panno,
					is_obsolete: false,
				},
			});
			if (duplicateCustomer) {
				const dbValues = {
					email: duplicateCustomer.email,
					id_no: duplicateCustomer.id_no,
					mobile_number: duplicateCustomer.mobile_number,
					customer_code: customer.customer_code,
					panno: customer.panno,
				};
				const excelValues = {
					email: customer.email,
					id_no: customer.id_no,
					mobile_number: customer.mobile_number,
					customer_code: customer.customer_code,
					panno: customer.panno,
				};
				const duplicates: Array<string> = [];
				for (const [key, value] of Object.entries(dbValues)) {
					if (value !== excelValues[key]) {
						duplicates.push(` ${key}`);
					}
				}

				Logger.log('Duplicate values found for Customer table');
				Logger.log(customer.customer_code);
				Logger.log('Skipping insertion for above customer');
				continue;
			}
			customer['notification_time'] = tomorrow;
			customers.push(customer);
		}
		await this.customerRepository.save(customers);
		return { status: 200, message: 'New Customer Data Imported' };
	}

	async bulkCustomerProfileCreate(data) {
		const arr = [];
		const customerProfiles: CustomerProfile[] = [];

		for (let i = 0, len = data.length; i < len; i++) {
			const customerProfile: CustomerProfile = data[i];
			
			const customerIdDuplicate = await this.hasNoDuplicate(
				arr,
				customerProfile.customer_id,
			);
			arr.push(customerProfile.customer_id);
			if (customerIdDuplicate === false) {
				Logger.log('Duplicate Customer Id found for Customer Profile');
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping insertion for above customer profile');
				continue;
			}

			const idNumberDuplicate = await this.hasNoDuplicate(
				arr,
				customerProfile.identification_number,
			);
			arr.push(customerProfile.identification_number);
			if (idNumberDuplicate === false) {
				Logger.log(
					'Duplicate Identification number found for Customer Profile',
				);
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping insertion for above customer profile');
				continue;
			}

			const customerCIF = await this.hasNoDuplicate(
				arr,
				customerProfile.customer_info_file_number,
			);
			arr.push(customerProfile.customer_info_file_number);
			if (customerCIF === false) {
				Logger.log('Duplicate Customer CIF found for Customer Profile');
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping insertion for above customer profile');
				continue;
			}

			const duplicateCustomerProfile = await this.customerProfileRepository.findOne(
				{
					where: {
						customer_id: customerProfile.customer_id,
						identification_number: customerProfile.identification_number,
						customer_info_file_number:
							customerProfile.customer_info_file_number,
						is_obsolete: false,
					},
				},
			);
			if (duplicateCustomerProfile) {
				Logger.log('Duplicate Customer Profile');
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping insertion for above customer profile');
				continue;
			}
			customerProfiles.push(customerProfile);
		}
		await this.customerProfileRepository.save(customerProfiles);
		return { status: 200, message: 'New Customer Data Imported' };
	}

	async bulkEMandateCreate(data) {
		const arr = [];
		const emandateArr: EMandate[] = [];

		for (let i = 0, len = data.length; i < len; i++) {
			const emandate: EMandate = data[i];
			
			const customerIdxDuplicate = await this.hasNoDuplicate(
				arr,
				emandate.customer_idx,
			);
			arr.push(emandate.customer_idx);
			if (customerIdxDuplicate === false) {
				Logger.log('Duplicate Customer Idx found for Emandate');
				Logger.log(emandate.customer_idx);
				Logger.log('Skipping insertion for above Emandate');
				continue;
			}
			emandateArr.push(emandate);
		}
		await this.eMandateRepository.save(emandateArr);
		return { status: 200, message: 'New Emandate Data Imported' };
	}

	async bulkCustomerCardCreate(data, customerIDArr) {
		const arr = [];
		const customerCards: CustomerCard[] = [];

		for (let i = 0, len = data.length; i < len; i++) {
			const customerCard: CustomerCard = data[i];
			const customerIdxDuplicate = await this.hasNoDuplicate(
				arr,
				customerCard.customer_idx,
			);
			arr.push(customerCard.customer_idx);
			if (customerIdxDuplicate === false) {
				Logger.log('Duplicate Customer Idx found for Customer Card');
				Logger.log(customerCard.customer_idx);
				Logger.log('Skipping insertion for above customer card');
				continue;
			}

			const duplicateCustomer = await this.customerRepository.findOne({
				where: {
					loyalty_customer_number: customerIDArr[i],
					is_obsolete: false,
				},
			});

			if (duplicateCustomer) {
				const duplicateCustomerCard = await this.customerCardRepository.findOne(
					{
						where: {
							customer_idx: duplicateCustomer.idx,
							is_obsolete: false,
						},
					},
				);

				if (duplicateCustomerCard) {
					Logger.log('Duplicate Customer Card');
					Logger.log(customerCard.customer_idx);
					Logger.log('Skipping insertion for above customer card');
					continue;
				}
				customerCards.push(customerCard);
			}
		}
		await this.customerCardRepository.save(customerCards);
		return { status: 200, message: 'New Customer Card Data Imported' };
	}

	async customExcelValidate(data: CreateCustomer, i) {
		if (
			data.first_name === '' ||
			data.first_name.length < 3 ||
			data.first_name.length > 30
		) {
			return {
				statusCode: 400,
				error: `Not a valid first name at row ${i + 1}`,
			};
		}
		if (
			data.last_name === '' ||
			data.last_name.length < 3 ||
			data.last_name.length > 30
		) {
			return {
				statusCode: 400,
				error: `Not a valid last name at row ${i + 1}`,
			};
		}
		const genders = ['MALE', 'FEMALE', 'NOT SPECIFIED', 'THIRD GENDER'];
		if (data.gender === '' || !genders.includes(data.gender)) {
			return {
				statusCode: 400,
				error: `Not a valid gender at row ${i + 1}`,
			};
		}
		if (
			data.email === '' ||
			!new RegExp(
				/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/,
			).test(data.email)
		) {
			return { statusCode: 400, error: `Not a valid email at row ${i + 1}` };
		}
		// if (data.mobile_number_ext === '') {
		// 	return {
		// 		statusCode: 400,
		// 		error: `Not a valid mobile number ext at row ${i + 1}`,
		// 	};
		// }
		if ( 
			data.mobile_number === '' || !data.mobile_number ||
			(data.mobile_number && data.mobile_number.toString().length !== 10)
		) {
			return {
				statusCode: 400,
				error: `Not a valid mobile number at row ${i + 1}`,
			};
		}
		if (data.customer_code === '') {
			return {
				statusCode: 400,
				error: `Not a valid customer code at row ${i + 1}`,
			};
		}
		if (data.panno === '' || (data.panno && data.panno.toString().length !== 10)) {
			return {
				statusCode: 400,
				error: `Not a valid PAN No at row ${i + 1}`,
			};
		}
		return null;
	}

	async bulkCustomerSyncFile(data) {
		const arr = [];
		let count = 0;
		for (let i = 0, len = data.length; i < len; i++) {
			const customerValidate: CreateCustomer = data[i];

			// validation for excel data
			const error = await this.customExcelValidate(customerValidate, i);
			if (error) {
				Logger.log('customExcelValidate failed for Customer ID');
				Logger.log(data[i].customer_code);
				Logger.log('Skipping updation for above customer');
				continue;
			}

			const customer: Customer = data[i];
			
			const emailDuplicate = await this.hasNoDuplicate(arr, customer.email);
			arr.push(customer.email);
			if (emailDuplicate === false) {
				Logger.log('Email duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping updation for above customer');
				continue;
			}
			
			const mobileNumberDuplicate = await this.hasNoDuplicate(
				arr,
				customer.mobile_number,
			);
			arr.push(customer.mobile_number);
			if (mobileNumberDuplicate === false) {
				Logger.log('Mobile Number duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping updation for above customer');
				continue;
			}
			
			const idNumberDuplicate = await this.hasNoDuplicate(arr, customer.id_no);
			arr.push(customer.id_no);
			if (idNumberDuplicate === false) {
				Logger.log('Id_no duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping updation for above customer');
				continue;
			}
			
			const customerCodeDuplicate = await this.hasNoDuplicate(
				arr,
				customer.customer_code,
			);
			arr.push(customer.customer_code);
			if (customerCodeDuplicate === false) {
				Logger.log('customer_code duplicate for Customer ID');
				Logger.log(customer.customer_code);
				Logger.log('Skipping updation for above customer');
				continue;
			}

			const customerFound = await this.customerRepository.findOne({
				where: {
					customer_code: customer.customer_code,
					is_obsolete: false,
				},
			});
			if (customerFound) {
				const resultArray = [];
				const keys = Object.keys(customerFound);
				for (let k = 0; k < keys.length; k++) {
					if (customerFound[keys[k]] !== customer[keys[k]]) {
						resultArray.push(false);
					} else {
						resultArray.push(true);
					}
				}

				if (resultArray.indexOf(false) > -1) {
					// difference found
					count = count + 1;
					await this.customerRepository.update(
						{ customer_code: customer.customer_code },
						customer,
					);
				}
			}
		}

		if (count === 0) {
			return { status: 200, message: `No difference found` };
		}

		return {
			status: 200,
			message: `(${count}) Customer Data Updated Successfully`,
		};
	}

	async bulkCustomerProfileSyncFile(data) {
		const arr = [];
		let count = 0;
		for (let i = 0, len = data.length; i < len; i++) {
			const customerProfile: CustomerProfile = data[i];
			
			const customerIdDuplicate = await this.hasNoDuplicate(
				arr,
				customerProfile.customer_id,
			);
			arr.push(customerProfile.customer_id);
			if (customerIdDuplicate === false) {
				Logger.log('Duplicate Customer ID found for Customer Profile');
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping updation for above customer profile');
				continue;
			}

			
			const idNumberDuplicate = await this.hasNoDuplicate(
				arr,
				customerProfile.identification_number,
			);
			arr.push(customerProfile.identification_number);
			if (idNumberDuplicate === false) {
				Logger.log(
					'Duplicate Identification Number found for Customer Profile',
				);
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping updation for above customer profile');
				continue;
			}

			const customerCIF = await this.hasNoDuplicate(
				arr,
				customerProfile.customer_info_file_number,
			);
			arr.push(customerProfile.customer_info_file_number);
			if (customerCIF === false) {
				Logger.log('Duplicate Customer CIF found for Customer Profile');
				Logger.log(customerProfile.customer_id);
				Logger.log('Skipping updation for above customer profile');
				continue;
			}

			const customerProfileFound = await this.customerProfileRepository.findOne(
				{
					where: {
						customer_id: customerProfile.customer_id,
						is_obsolete: false,
					},
				},
			);

			if (customerProfileFound) {
				const resultArray = [];
				const keys = Object.keys(customerProfileFound);
				for (let k = 0; k < keys.length; k++) {
					if (customerProfileFound[keys[k]] !== customerProfile[keys[k]]) {
						resultArray.push(false);
					} else {
						resultArray.push(true);
					}
				}

				if (resultArray.indexOf(false) > -1) {
					// difference found
					count = count + 1;
					await this.customerProfileRepository.update(
						{ customer_id: customerProfile.customer_id },
						customerProfile,
					);
				}
			}
		}

		if (count === 0) {
			return { status: 200, message: `No difference found` };
		}

		return {
			status: 200,
			message: `(${count}) Customer Profile Data Updated Successfully`,
		};
	}

	async bulkCustomerCardSyncFile(data) {
		const arr = [];
		let count = 0;
		for (let i = 0, len = data.length; i < len; i++) {
			const customerCard: CustomerCard = data[i];
			
			const customerIdxDuplicate = await this.hasNoDuplicate(
				arr,
				customerCard.customer_idx,
			);
			arr.push(customerCard.customer_idx);
			if (customerIdxDuplicate === false) {
				Logger.log('Duplicate Customer Idx found for Customer Card');
				Logger.log(customerCard.customer_idx);
				Logger.log('Skipping updation for above customer card');
				continue;
			}

			const customerCardFound = await this.customerCardRepository.findOne({
				where: {
					customer_idx: customerCard.customer_idx,
					is_obsolete: false,
				},
			});

			if (customerCardFound) {
				const resultArray = [];
				const keys = Object.keys(customerCardFound);
				for (let k = 0; k < keys.length; k++) {
					if (customerCardFound[keys[k]] !== customerCard[keys[k]]) {
						resultArray.push(false);
					} else {
						resultArray.push(true);
					}
				}

				if (resultArray.indexOf(false) > -1) {
					// difference found
					count = count + 1;
					await this.customerCardRepository.update(
						{ customer_idx: customerCard.customer_idx },
						customerCard,
					);
				}
			}
		}

		if (count === 0) {
			return { status: 200, message: `No difference found` };
		}

		return {
			status: 200,
			message: `(${count}) Customer Card Data Updated Successfully`,
		};
	}

	async bulkEMandateSyncFile(data) {
		const arr = [];
		for (let i = 0, len = data.length; i < len; i++) {
			const emandate: EMandate = data[i];
			
			const customerIdxDuplicate = await this.hasNoDuplicate(
				arr,
				emandate.customer_idx,
			);
			arr.push(emandate.customer_idx);
			if (customerIdxDuplicate === false) {
				Logger.log('Duplicate Customer Idx found for Emandate');
				Logger.log(emandate.customer_idx);
				Logger.log('Skipping updation for above Emandate');
				continue;
			}

			await this.eMandateRepository.update(
				{ customer_idx: emandate.customer_idx },
				emandate,
			);
		}

		return {
			status: 200,
			message: `Emandate Data Updated Successfully`,
		};
	}

	async customerCardDetailIdentification(data) {
		let customerToCreate = [];
		let customerToUpdate = [];
		let customerCardToUpdate = [];
		let customerCardToCreate = [];
		const customerId = data.CUSTOMER_ID;

		const duplicateCustomer = await this.customerRepository.findOne({
			where: {
				customer_code: customerId,
				is_obsolete: false,
			},
		});

		if (duplicateCustomer) {
			customerToUpdate.push(data);
			const duplicateCustomerCard = await this.customerCardRepository.findOne({
				where: {
					customer_idx: duplicateCustomer.idx,
					is_obsolete: false,
				},
			});

			if (duplicateCustomerCard) {
				customerCardToUpdate.push(data);
			} else {
				customerCardToCreate.push(data);
			}
		} else {
			customerToCreate.push(data);
			customerCardToCreate.push(data);
		}
		return {
			customer_to_create: customerToCreate,
			customer_to_update: customerToUpdate,
			customer_card_to_create: customerCardToCreate,
			customer_card_to_update: customerCardToUpdate,
		};
	}

	async hasNoDuplicates(arr, type) {
		return arr.every(num => arr.indexOf(num) === arr.lastIndexOf(num));
	}

	async hasNoDuplicate(arr, val) {
		let result = true;
		arr.forEach(element => {
			if (element === val) {
				result= false;
			}
		});
		return result;
	}

	async changeCustomerMobileNumberService(
		customerIdx: string,
		data,
		request,
		customer,
	) {
		const userLog = {
			user: process.env.username,
			action: 'change customer mobile number',
			action_message: 'User requested to change customer mobile number',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const header: any = request.headers;
		const token = header.authorization.split(' ')[1];
		const { is_superadmin, idx } = await parseJwt(token);

		const { id } = await this.customerRepository.findOne({
			idx: customerIdx,
			is_obsolete: false,
		});

		cleanData(customer, [
			'id',
			'idx',
			'is_obsolete',
			'is_active',
			'created_on',
			'modified_on',
		]);

		if (is_superadmin) {
			const customerRepoUpdate = await this.customerRepository.update(
				{ idx: customerIdx },
				{ mobile_number: data.mobile_number },
			);

			// const customerDeviceRepoUpdate = await this.customerDeviceRepo.update(
			// 	{ customer_id : BigInt(id) },
			// 	// { mobile_number: customer.mobile_number },
			// 	{ mobile_number: data.mobile_number },
			// );

			if (customerRepoUpdate) {
				return { statusCode: 200, message: 'Customer Mobile Number Updated' };
			}
		}

		customer.status = 'PENDING';
		customer.customer_id = BigInt(id);
		customer.mobile_number = data.mobile_number;
		await this.customerTempRepository.save({
			...customer,
			created_by: idx,
			operation: Operations.UPDATE,
		});

		const payload = `{ message: "Customer Change Mobile Number Request", idx: "${customerIdx}" }`;

		await this.sendForNotification(
			process.env.idx,
			Category.CUSTOMER_CHANGEMOBILENUMBER,
			payload,
			'user',
		);

		return { statusCode: 200, message: 'Customer update pending' };
	}

	async updateCustomer(customer: UpdateCustomerDto, idx: string) {
		const userLog = {
			user: process.env.username,
			action: 'update customer',
			action_message: 'User requested to update customer',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const customerOldData = await this.customerRepository.findOne({
			idx,
			is_obsolete: false,
		});

		const customerEmandateOldData = await this.eMandateRepository.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: [
				'account_number',
				'account_type',
				'branch_idx',
				'full_name',
				'is_obsolete',
				'is_verified',
			],
		});

		const requiredCustomer_id = customerOldData.id;

		cleanData(customerOldData, [
			'id',
			'idx',
			'created_on',
			'modified_on',
			'password',
			'is_password_set',
		]);
		cleanData(customer, ['idx']);

		const dataToSave = { ...customerOldData, ...customer };

		const obj1 = {
			account_number: customer.account_number,
			account_type: customer.account_type,
			branch_idx: customer.branch_idx,
			full_name: customer.full_name,
		};

		const obj2 = {
			account_number: customer.account_number,
			account_type: customer.account_type,
			branch_idx: customer.branch_idx,
			extra_details: customer.extra_details,
			full_name: customer.full_name,
		};

		if (process.env.is_superadmin === 'true') {
			await this.eMandateRepository.update(
				{
					customer_idx: idx,
				},
				customer.extra_details ? obj2 : obj1,
			);

			cleanData(customer, [
				'account_number',
				'account_type',
				'extra_details',
				'branch_idx',
				'full_name',
			]);

			await this.customerRepository.update(
				{
					idx,
				},
				customer,
			);
			this.syncCustomer(customer);

			return { statusCode: 200, message: 'Customer Updated' };
		}

		dataToSave.status = 'PENDING';
		dataToSave.customer_id = requiredCustomer_id.toString();

		const customerTempData: any = await this.customerTempRepository.save({
			...dataToSave,
			created_by: process.env.idx,
			operation: Operations.UPDATE,
		});

		let dataForEmandateTemp: any = {};
		dataForEmandateTemp = customer.extra_details ? obj2 : obj1;
		dataForEmandateTemp.customer_temp_id = customerTempData.id;

		await this.eMandateTempRepository.save({
			...customerEmandateOldData,
			...dataForEmandateTemp,
			status: 'PENDING',
		});

		const payload = `{ message: "Customer Update Request", idx: "${idx}" }`;

		await this.sendForNotification(
			process.env.idx,
			Category.CUSTOMER_UPDATE,
			payload,
			'user',
		);

		return { statusCode: 200, message: 'Request awaiting approval' };
	}

	async verifyCustomer(approveReject: ApproveRejectDto) {
		const userLog = {
			user: process.env.username,
			action: 'verify customer actions',
			action_message: 'User requested to verify customer changes',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const customerTemp: any = await this.customerTempRepository.findOne({
			idx: approveReject.idx,
			is_obsolete: false,
		});

		if (!customerTemp) {
			throw new NotFoundException('The request was not found');
		}

		const customer: any = await this.customerRepository.findOne({
			id: customerTemp.customer_id,
			is_obsolete: false,
		});

		Logger.log(approveReject);

		if (approveReject.status === 'REJECTED') {
			if (!approveReject.rejection_reason) {
				throw new HttpException(
					'Rejection reason is required',
					HttpStatus.BAD_REQUEST,
				);
			}
			await this.customerTempRepository.update(
				{ idx: approveReject.idx },
				{
					status: 'REJECTED',
					rejection_reason: approveReject.rejection_reason,
				},
			);

			if (customerTemp.operation === Operations.UPDATE) {
				await this.eMandateTempRepository.update(
					{ customer_temp_id: customerTemp.id },
					{
						status: 'REJECTED',
					},
				);
			}

			return { statusCode: 200, message: 'Request Rejected' };
		}

		if (
			customerTemp.operation === Operations.BLOCK ||
			customerTemp.operation === Operations.UNBLOCK
		) {
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.getRepository(CustomerTemp)
					.update(
						{ idx: approveReject.idx, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				await transactionalEntityManager
					.getRepository(Customer)
					.update(
						{ id: customerTemp.customer_id, is_obsolete: false },
						{ is_active: customerTemp.operation === Operations.UNBLOCK },
					);

				if (customerTemp.operation === blockunblock.UNBLOCK) {
					await this.customerDeviceRepo.update(
						{
							customer_id: BigInt(customer.id),
							is_obsolete: false,
						},
						{ total_attempt: '0' },
					);
				}

				if (customerTemp.operation === blockunblock.UNBLOCK) {
					const findCustomerLog = await this.activityLogRepository.findOne({
						user_id: customer,
						is_obsolete: false,
					});

					if (findCustomerLog) {
						await this.activityLogRepository.update(
							{
								user_id: customer,
								is_obsolete: false,
							},
							{ is_obsolete: true },
						);
					}
				}
			});

			return {
				statusCode: 200,
				message: `Request Approved`,
			};
		}

		if (
			customerTemp.operation === Operations.BLOCK_RL ||
			customerTemp.operation === Operations.UNBLOCK_RL
		) {
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.getRepository(CustomerTemp)
					.update(
						{ idx: approveReject.idx, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				await transactionalEntityManager.getRepository(Customer).update(
					{ id: customerTemp.customer_id, is_obsolete: false },
					{
						is_transaction_locked:
							customerTemp.operation === Operations.BLOCK_RL ? true : false,
					},
				);
			});

			return {
				statusCode: 200,
				message: `Request Approved`,
			};
		}

		if (customerTemp.operation === Operations.DELETE) {
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.getRepository(CustomerTemp)
					.update(
						{ idx: approveReject.idx, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				await transactionalEntityManager
					.getRepository(Customer)
					.update(
						{ id: customerTemp.customer_id, is_obsolete: false },
						{ is_obsolete: true },
					);

				await transactionalEntityManager
					.getRepository(CustomerDevice)
					.update(
						{ customer_id: customerTemp.customer_id, is_obsolete: false },
						{ is_obsolete: true },
					);

				await transactionalEntityManager
					.getRepository(EMandate)
					.update(
						{ customer_idx: customer.idx, is_obsolete: false },
						{ is_obsolete: true },
					);
			});

			return { statusCode: 200, message: 'Request Approved' };
		}

		if (customerTemp.operation === Operations.RESET_PIN) {
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.getRepository(CustomerTemp)
					.update(
						{ idx: approveReject.idx, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				await transactionalEntityManager.getRepository(Customer).update(
					{ id: customerTemp.customer_id, is_obsolete: false },
					{
						is_mpin_set: false,
						// is_mpin_reset: true,
					},
				);
			});

			const getTemplateByActionAlias = await Axios.get(
				`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}reset_mpin_customer`,
			);

			const requiredTemplate = getTemplateByActionAlias.data.action_message;

			try {
				const response: any = await Axios.post(
					`${process.env.SEND_MEMBER_NOTIFICATION}`,
					{
						action_alias: 'reset_mpin_customer',
						customers: [
							{
								idx: customer.idx,
								message: `${requiredTemplate}`,
							},
						],
					},
				);
				customOnboardingLogs.log('response.data: ', response.data);
			} catch (e) {
				customOnboardingLogs.log(e.response);
				Logger.log(e.response.data);
				throw new HttpException(e.response.data.message, e.response.status);
			}

			return { statusCode: 200, message: 'Request Approved' };
		}

		if (customerTemp.operation === Operations.UPDATE) {
			// filtering out data not in MerchantProfile

			const {
				id,
				idx,
				customer_id,
				status,
				operation,
				created_by,
				...data
			}: any = customerTemp;

			customOnboardingLogs.log(customerTemp.id, 'id is here');

			const emandateTemp: any = await this.eMandateTempRepository.findOne({
				customer_temp_id: customerTemp.id,
				status: 'PENDING',
				is_obsolete: false,
			});

			if (!emandateTemp) {
				throw new NotFoundException('The emandate request was not found');
			}

			cleanData(emandateTemp, [
				'id',
				'idx',
				'is_obsolete',
				'customer_temp_id',
				'created_on',
				'modified_on',
				'status',
			]);

			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.getRepository(CustomerTemp)
					.update(
						{ idx: approveReject.idx, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				await transactionalEntityManager
					.getRepository(Customer)
					.update({ id: customer_id, is_obsolete: false }, removeEmpty(data));

				await transactionalEntityManager
					.getRepository(EMandate)
					.update(
						{ customer_idx: customer.idx, is_obsolete: false },
						removeEmpty(emandateTemp),
					);

				await transactionalEntityManager
					.getRepository(EMandateTemp)
					.update(
						{ customer_temp_id: customerTemp.id, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				const {
					customer_code,
					first_name,
					middle_name,
					last_name,
					email,
					gender,
					mobile_number,
					date_of_birth,
					id_type,
					id_no,
					id_expiry_date,
					city_state,
					district,
					panno,
				} = data;

				this.syncCustomer({
					customer_code,
					first_name,
					middle_name,
					last_name,
					email,
					gender,
					mobile_number,
					date_of_birth,
					id_type,
					id_no,
					id_expiry_date,
					city_state,
					district,
					panno,
				});
			});

			return { statusCode: 200, message: 'Request Approved' };
		}

		if (customerTemp.operation === Operations.RESET_DEVICE) {
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.getRepository(CustomerTemp)
					.update(
						{ idx: approveReject.idx, is_obsolete: false },
						{ status: 'APPROVED' },
					);

				await transactionalEntityManager
					.getRepository(CustomerDevice)
					.update(
						{ customer_id: customerTemp.customer_id, is_obsolete: false },
						{ is_obsolete: true },
					);
			});

			return { statusCode: 200, message: 'Request Approved' };
		}
	}

	async BlockUnblockCustomer(
		idx: string,
		operation: string,
		customer: Customer,
	) {
		const userLog = {
			user: process.env.username,
			action: 'block customer',
			action_message: 'User requested to block customer',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		if (process.env.is_superadmin === 'true') {
			await this.customerRepository.update(
				{ idx },
				{ is_active: operation === blockunblock.UNBLOCK },
			);

			if (operation === blockunblock.UNBLOCK) {
				await this.customerDeviceRepo.update(
					{
						customer_id: BigInt(customer.id),
						is_obsolete: false,
					},
					{ total_attempt: '0' },
				);
			}

			if (operation === blockunblock.UNBLOCK) {
				const findCustomerLog = await this.activityLogRepository.findOne({
					user_id: customer,
					is_obsolete: false,
				});

				if (findCustomerLog) {
					await this.activityLogRepository.update(
						{
							user_id: customer,
							is_obsolete: false,
						},
						{ is_obsolete: true },
					);
				}
			}

			return {
				statusCode: 200,
				message: `Customer has been ${operation.toLowerCase()}ed`,
			};
		}

		const { id } = Object.assign({}, customer);

		cleanData(customer, [
			'id',
			'idx',
			'is_obsolete',
			'is_active',
			'created_on',
			'modified_on',
			'is_mpin_set',
		]);

		await this.customerTempRepository.save({
			customer_id: id.toString(),
			...customer,
			status: Status.PENDING,
			operation,
			created_by: process.env.idx,
		});

		const payload = `{ message: "Customer ${operation} Request", idx: "${idx}" }`;

		await this.sendForNotification(
			process.env.idx,
			operation === blockunblock.UNBLOCK
				? Category.CUSTOMER_UNBLOCK
				: Category.CUSTOMER_BLOCK,
			payload,
			'user',
		);

		return {
			statusCode: 200,
			message: `Request awaiting approval`,
		};
	}

	async GetActiveCustomersByCondition(condition: any): Promise<Customer> {
		return this.customerRepository.findOne(condition);
	}

	async ResetCustomerMpin(idx: string, customer: Customer) {
		const userLog = {
			user: process.env.username,
			action: 'reset customer mpin',
			action_message: 'User requested to reset customer mpin',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		customOnboardingLogs.log(process.env.is_superadmin);
		customOnboardingLogs.log(process.env.idx);

		if (process.env.is_superadmin === 'true') {
			await this.customerRepository.update(
				{ idx },
				{
					is_mpin_set: false,
					// is_mpin_reset: true,
				},
			);

			const getTemplateByActionAlias = await Axios.get(
				`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}reset_mpin_customer`,
			);

			const requiredTemplate = getTemplateByActionAlias.data.action_message;

			try {
				const response: any = await Axios.post(
					`${process.env.SEND_MEMBER_NOTIFICATION}`,
					{
						action_alias: 'reset_mpin_customer',
						customers: [
							{
								idx,
								message: `${requiredTemplate}`,
							},
						],
					},
				);
				customOnboardingLogs.log('response.data: ', response.data);
			} catch (e) {
				customOnboardingLogs.log(e.response);
				Logger.log(e.response.data);
				throw new HttpException(e.response.data.message, e.response.status);
			}

			return {
				statusCode: 200,
				message: `Customer m-PIN has been reset`,
			};
		}

		const { id } = Object.assign({}, customer);

		cleanData(customer, [
			'id',
			'idx',
			'is_obsolete',
			'is_active',
			'created_on',
			'modified_on',
			'is_mpin_set',
			'is_mpin_reset',
		]);

		await this.customerTempRepository.save({
			customer_id: id.toString(),
			...customer,
			status: Status.PENDING,
			operation: Operations.RESET_PIN,
			created_by: process.env.idx,
		});

		const payload = `{ message: "Customer Reset Mpin Request", idx: "${idx}" }`;

		await this.sendForNotification(
			process.env.idx,
			Category.CUSTOMER_RESETMPIN,
			payload,
			'user',
		);

		return {
			statusCode: 200,
			message: `Request awaiting approval`,
		};
	}

	async resetDeviceId(mobile_number: string, customer: Customer) {
		const userLog = {
			user: process.env.username,
			action: 'reset customer device',
			action_message: 'User requested to reset customer device',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const customerDeviceInfo = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: customer.id,
				is_obsolete: false,
			},
		});

		const customerIdx = customer.idx;

		if (!customerDeviceInfo) {
			throw new HttpException(
				'Customer has no device information to reset.',
				HttpStatus.BAD_REQUEST,
			);
		}

		const customerTempInfo = await this.customerTempRepository.findOne({
			customer_id: customer.id.toString(),
			status: Status.PENDING,
			operation: Operations.RESET_DEVICE,
			is_obsolete: false,
		});

		if (customerTempInfo) {
			throw new HttpException(
				'Reset customer device request already exist.',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (process.env.is_superadmin === 'true') {
			await this.customerDeviceRepo.update(
				{
					customer_id: BigInt(customer.id),
					is_obsolete: false,
				},
				{
					is_obsolete: true,
				},
			);
			return {
				statusCode: 200,
				message: `Customer Device has been reset`,
			};
		}

		const { id } = Object.assign({}, customer);

		cleanData(customer, [
			'id',
			'idx',
			'is_obsolete',
			'is_active',
			'created_on',
			'modified_on',
			'is_mpin_set',
		]);

		await this.customerTempRepository.save({
			customer_id: id.toString(),
			...customer,
			status: Status.PENDING,
			operation: Operations.RESET_DEVICE,
			created_by: process.env.idx,
		});

		const payload = `{ message: "Customer Reset Device Request", idx: "${customerIdx}" }`;

		await this.sendForNotification(
			process.env.idx,
			Category.CUSTOMER_RESETDEVICE,
			payload,
			'user',
		);

		return {
			statusCode: 200,
			message: `Request awaiting approval`,
		};
	}

	async asyncForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	}

	async GetCustomerNamesService(data: Array<string>) {
		const result = {};

		await this.asyncForEach(data, async el => {
			const res = await this.customerRepository.findOne({
				where: {
					idx: el,
					is_obsolete: false,
				},
				select: [
					'idx',
					'first_name',
					'middle_name',
					'last_name',
					'mobile_number_ext',
					'mobile_number',
				],
			});

			if (!res) {
				result[el] = null;
			} else {
				result[el] = res;
			}
		});
		return result;
	}

	async GetCustomerLastMonthPointsService(idx, date) {
		const startOfMonth = moment(date)
			.startOf('month')
			.format('YYYY-MM-DD hh:mm');
		const endOfMonth = moment(date).endOf('month').format('YYYY-MM-DD hh:mm');

		const result = await this.CustomerPointsHistoryRepo.find({
			where: {
				is_obsolete: false,
				customer_idx: idx,
				created_on: Between(startOfMonth, endOfMonth),
			},
			order: {
				created_on: 'DESC',
			},
		});

		return result;
	}

	async sendForNotification(
		idx: string,
		category: number,
		payload: string,
		type: string,
	) {
		try {
			const jwtData: any = await Axios.get(
				`${process.env.GETALLUSER_FOR_NOTIFICATION}${idx}`,
			);

			const dataWeWant = jwtData.data.map(el => {
				return {
					user_idx: el.idx,
					category,
					payload,
					type,
				};
			});

			await Axios.post(`${process.env.SEND_FOR_NOTIFICATION}`, {
				dataWeWant,
			});
		} catch (error) {
			customOnboardingLogs.log(error);
		}
	}

	async GetActiveCustomersEmandateByCondition(condition: any) {
		return this.eMandateRepository.findOne(condition);
	}

	async GetActiveCustomersEmandateTempByCondition(condition: any) {
		return this.eMandateTempRepository.findOne(condition);
	}

	async LockTransactionService(customerIdx: string, lockStatus: LockStatusDto) {
		const userLog = {
			user: process.env.username,
			action: 'lock customer transaction',
			action_message: 'User requested to lock customer transaction',
			date_time: `${new Date().toISOString()}`,
		};

		await this.logUser(userLog);

		const customerModuleData = await this.customerRepository.findOne({
			where: {
				idx: customerIdx,
				is_obsolete: false,
			},
		});

		if (!customerModuleData) {
			throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
		}

		const customerId = customerModuleData.id;

		const requestExists = await this.getPendingCustomerByCondition({
			customer_id: customerId,
			status: 'PENDING',
			is_obsolete: false,
		});

		if (requestExists) {
			throw new HttpException(
				'Request for customer already exists',
				HttpStatus.CONFLICT,
			);
		}

		if (
			lockStatus.status === 'BLOCK_RL' &&
			customerModuleData.is_transaction_locked
		) {
			throw new HttpException(
				'Customer transaction already blocked',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (
			lockStatus.status === 'UNBLOCK_RL' &&
			!customerModuleData.is_transaction_locked
		) {
			throw new HttpException(
				'Customer transaction already unblocked',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (process.env.is_superadmin === 'true') {
			await this.customerRepository.update(
				{
					idx: customerIdx,
					is_obsolete: false,
				},
				{
					is_transaction_locked:
						lockStatus.status === 'BLOCK_RL' ? true : false,
				},
			);

			return {
				statusCode: 200,
				message: `Customer transaction updated successfully`,
			};
		}

		const {
			idx,
			id,
			created_on,
			modified_on,
			password,
			is_password_set,
			...data
		}: any = customerModuleData;

		data.status = 'PENDING';
		data.customer_id = customerId;
		data.created_by = process.env.idx;
		data.operation = lockStatus.status;

		await this.customerTempRepository.save({
			...data,
		});

		return {
			statusCode: 200,
			message: `Request awaiting approval`,
		};
	}

	async checkCustomerByEmail(email: string) {
		const duplicateCustomer = await this.customerRepository.findOne({
			where: {
				email: email,
				is_obsolete: false,
			},
		});

		if (duplicateCustomer) {
			return true;
		}

		return false;
	}
	async checkCustomerProfileByCIF(cif: string) {
		const duplicateCustomer = await this.customerProfileRepository.findOne({
			where: {
				customer_info_file_number: cif,
				is_obsolete: false,
			},
		});

		if (duplicateCustomer) {
			return true;
		}

		return false;
	}

	async getCustomerByCIF(loyalty_customer_number) {
		let resultObject = {};
		resultObject['customerIdx'] = '';
		const customer = await this.customerRepository.findOne({
			where: {
				loyalty_customer_number: loyalty_customer_number,
				is_obsolete: false,
			},
		});
		if (customer) {
			resultObject['customer'] = 'true';
			resultObject['customerIdx'] = customer.idx;
			const duplicateCustomerCard = await this.customerCardRepository.findOne({
				where: {
					customer_idx: customer.idx,
					is_obsolete: false,
				},
			});
			if (duplicateCustomerCard) {
				resultObject['customerCard'] = 'true';
			} else {
				resultObject['customerCard'] = 'false';
			}

			const duplicateEMandate = await this.eMandateRepository.findOne({
				where: {
					customer_idx: customer.idx,
					is_obsolete: false,
				},
			});

			if (duplicateEMandate) {
				resultObject['emandate'] = 'true';
			} else {
				resultObject['emandate'] = 'false';
			}
		} else {
			resultObject['emandate'] = 'false';
			resultObject['customer'] = 'false';
			resultObject['customerCard'] = 'false';
		}

		const customerProfile = await this.customerProfileRepository.findOne({
			where: {
				customer_info_file_number: loyalty_customer_number,
				is_obsolete: false,
			},
		});
		if (customerProfile) {
			resultObject['customerProfile'] = 'true';
		} else {
			resultObject['customerProfile'] = 'false';
		}
		return resultObject;
	}
}
