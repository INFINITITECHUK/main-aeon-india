import {
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
	Inject,
	HttpService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	getManager,
	Repository,
	Brackets,
	getRepository,
	getConnection, Not,
} from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import validator from 'validator';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CUSTOMER_CARD_MEMBERSHIP } from '@common/constants/CUSTOMER_CARD_MEMBERSHIP.enum';
import { Operations } from '@common/constants/operations.enum';
import { Status } from '@common/constants/status.enum';
import { CustomerLoginDto } from '@dtos/CustomerLogin.dto';
import { CustomerLoginValidateDTO } from '@dtos/CutsomerLoginValidate.dto';
import { LoginWithPasswordDto } from '@dtos/LoginWithPassword.dto';
import { ValidatePanNoDto } from '@dtos/ValidatePanNo.dto';
import { ValidateInitialTermsDto } from './../../dtos/ValidateInitialTerms.dto';
import { Answers } from '@entities/Answers.entity';
import { Customer } from '@entities/customer.entity';
import { CustomerCard } from '@entities/CustomerCard.entity';
import { CustomerDevice } from '@entities/CustomerDevice.entity';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { CustomerTemp } from '@entities/customerTemp.entity';
import { EMandate } from '@entities/EMandate.entity';
import { InterestRateDetails } from '@entities/InterestRateDetails';
import { Operationlogs } from '@entities/Operationlogs.entity';
import { Operationrules } from '@entities/Operationrules.entity';
import { SecurityQuestion } from '@entities/SecutiyQuestion.entity';
import { TransactionFiles } from '../../entities/TransactionFiles.entity';
import { TransactionDetail } from '../../entities/TransactionDetail';
import { ProductBalance } from '../../entities/ProductBalance.entity';
import { AeonBranch } from '@entities/AeonBranch';
import { StateCode } from '@entities/StateCode';
import { Counter } from '@entities/counter';
import { CustomerPointsHistory } from '@entities/CustomerPointsHistory.entity';
import { Protocol } from '@entities/Protocol';
import { Benefits } from '@entities/Benefits.entity';

import { encryptCrypto, decryptCrypto } from '@utils/cipher';
import {
	Axios,
	hashString,
	cleanData,
	parseJwt,
	isObjectEmpty,
	paginate,
	getStateFromCode,
	getCodeFromState
} from '@utils/helpers';
import { formUrlEncoded } from '../../common/utils/helperFunctions.utils';
import config from '@config/index';
import * as argon from 'argon2';
import { MembershipLevels } from '@entities/MembershipLevels';
import { VerifyForgetMpinOtpDto } from '@dtos/VerifyForgetMpinOtp.dto';
import { SetMpinAfterForgetDto } from '@dtos/SetMpinAfterForget.dto';
import axios from 'axios';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { AnyCnameRecord } from 'dns';

Axios.interceptors.request.use(request => {
	console.log('Starting Request', request);
	return request;
});

@Injectable()
export class CustomerLoginService {
	private readonly cacheHost: string;
	constructor(
		@InjectRepository(Operationrules)
		private readonly OperationRulesRepo: Repository<Operationrules>,
		@InjectRepository(MembershipLevels)
		private readonly MembershipLevelsRepo: Repository<MembershipLevels>,
		@InjectRepository(Operationlogs)
		private readonly OperationLogsRepo: Repository<Operationlogs>,
		@InjectRepository(CustomerDevice)
		private readonly customerDeviceRepo: Repository<CustomerDevice>,
		@InjectRepository(Customer)
		private readonly customerRepo: Repository<Customer>,
		@InjectRepository(CustomerProfile)
		private readonly customerProfileRepo: Repository<CustomerProfile>,
		@InjectRepository(CustomerApplication)
		private readonly customerApplicationRepo: Repository<CustomerApplication>,
		@InjectRepository(TransactionFiles)
		private readonly transactionFilesRepo: Repository<TransactionFiles>,
		@InjectRepository(ProductBalance)
		private readonly productBalanceRepo: Repository<ProductBalance>,
		@InjectRepository(TransactionDetail)
		private readonly transactionDetailRepo: Repository<TransactionDetail>,
		@InjectRepository(InterestRateDetails)
		private readonly interestRateDetailsRepo: Repository<InterestRateDetails>,
		private readonly jwtService: JwtService,
		@InjectRepository(CustomerTemp)
		private readonly customerTempRepository: Repository<CustomerTemp>,
		@InjectRepository(SecurityQuestion)
		private readonly securityQuestionRepo: Repository<SecurityQuestion>,
		@InjectRepository(Answers)
		private readonly answersRepo: Repository<Answers>,
		@InjectRepository(CustomerCard)
		private readonly customerCardRepo: Repository<CustomerCard>,
		@InjectRepository(CustomerPointsHistory)
		private readonly customerPointsHistoryRepo: Repository<CustomerPointsHistory>,
		@InjectRepository(EMandate)
		private readonly emandateRepo: Repository<EMandate>,
		@InjectRepository(AeonBranch)
		private readonly aeonBranchRepo: Repository<AeonBranch>,
		@InjectRepository(StateCode)
		private readonly stateCodeRepo: Repository<StateCode>,
		@InjectRepository(Counter)
		private readonly counterRepo: Repository<Counter>,
		@InjectRepository(EMandate)
		private readonly eMandateRepository: Repository<EMandate>,
		@InjectRepository(Protocol)
		private readonly protocolRepository: Repository<Protocol>,
		@InjectRepository(Benefits)
		private readonly benefitsRepository: Repository<Benefits>,
		@Inject(WINSTON_MODULE_PROVIDER)
		private readonly logger: Logger,
		@InjectQueue('customerLog') private readonly customerLogQueue: Queue,
		private readonly httpService: HttpService,
		private readonly i18n: I18nRequestScopeService,
	) {}

	async getHost() {
		// if (this.cacheHost) {
		// 	return this.cacheHost;
		// }
		// const host = await this.httpService.get('http://icanhazip.com').toPromise();
		// return host.data;
		return '';
	}

	async rewardInfo(idx: string) {
		const cardInfo = await this.customerCardRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: [
				'total_points',
				'point_redeemed',
				'membership_type',
				'point_redemption',
				'point_available_redemption',
			],
		});
		if (!cardInfo) {
			throw new HttpException(
				'No card info found for the customer',
				HttpStatus.NOT_FOUND,
			);
		}

		const membershipsQuery = this.MembershipLevelsRepo.find({
			where: {
				is_obsolete: false,
			},
			select: ['membership_type', 'points_range', 'points_difference'],
		});

		const loanQuery = getConnection().query(
			`select sum(amount) as overall_loan from public."TransactionDetail" where customer_idx = $1 and ledger_type = 'DEBIT'`,
			[idx],
		);

		const [memberships, loan] = await Promise.all([
			membershipsQuery,
			loanQuery,
		]);

		const response = {
			info: {
				total_points: cardInfo.total_points,
				point_redeemed: cardInfo.point_redeemed,
				point_redemption: cardInfo.point_redemption,
				point_available_redemption: cardInfo.point_available_redemption,
				membership_type: cardInfo.membership_type,
			},
			memberships,
			// query returns array of one
			overall_loan: loan[0].overall_loan || 0,
		};

		return response;
	}

	async getOtp(customerLogin: CustomerLoginDto) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				mobile_number: customerLogin.mobile_number,
				is_obsolete: false,
			},
			select: [
				'id',
				'idx',
				'mobile_number',
				'mobile_number_ext',
				'is_active',
				'otp_locked_status',
				'first_name',
				'otp_created_time'
			],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		if (!customerProfileExist.is_active) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_BLOCKED',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();
		const otpEncripted = await hashString(otpGenerated);

		const customer = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: customerProfileExist.id,
				is_obsolete: false,
			},
		});

		const deviceUsedByOtherCustomer = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: Not(customerProfileExist.id),
				deviceid: customerLogin.deviceid,
				is_obsolete: false,
			},
		});

		const protocols = await this.protocolRepository.findOne({
			is_obsolete: false,
		});

		cleanData(customerLogin, ['mobile_number', 'phone_ext']);

		if (customer) {
			if (customer.deviceid !== customerLogin.deviceid) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.DEVICE_ID_MISMATCH',
					},
					HttpStatus.FORBIDDEN,
				);
			}

			if(deviceUsedByOtherCustomer){
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.MOBILE_DEVICE_ID_MISMATCH',
					},
					HttpStatus.FORBIDDEN,
				);
			}

			if (customerProfileExist.otp_locked_status) {
				if (
					moment(new Date()).diff(
						moment(new Date(customerProfileExist.otp_created_time)),
						'hours',
					) > protocols.otp_lock_period_in_hours
				) {
					throw new HttpException(
						{
							message: 'operations.CANNOT_PROCEED',
							sub: 'operations.CUSTOMER_TEMPORARY_BLOCKED',
							args: { time: `${protocols.otp_lock_period_in_hours}` },
						},
						HttpStatus.FORBIDDEN,
					);
				} else {
					await this.customerRepo.update(
						{
							idx: customerProfileExist.idx,
							is_obsolete: false,
						},
						{
							otp_locked_status: false,
						},
					);
					await this.customerDeviceRepo.update(
						{
							customer_id: BigInt(customerProfileExist.id),
							is_obsolete: false,
						},
						{
							total_attempt: '0',
						},
					);
				}
			}

			await getManager()
				.createQueryBuilder()
				.update(CustomerDevice)
				.where('customer_id = :customer_id', {
					customer_id: customerProfileExist.id,
				})
				.set({
					...customerLogin,
					otp: otpEncripted,
					otp_status: false,
					total_attempt: '0',
					otp_created_at: new Date(),
					otp_type: 'LOGIN',
				})
				.execute();

				await this.customerRepo.update({
					is_obsolete:false,
					idx: customerProfileExist.idx
				},{
					otp_created_time: new Date(), //we use this time for otp time check for login
	
				})
		} else {
			if (customerProfileExist.otp_locked_status) { 
			
				if (
					moment(new Date()).diff(
						moment(new Date(customerProfileExist.otp_created_time)),
						'hours',
					) > protocols.otp_lock_period_in_hours
				) {
					throw new HttpException(
						{
							message: 'operations.CANNOT_PROCEED',
							sub: 'operations.CUSTOMER_TEMPORARY_BLOCKED',
							args: { time: `${protocols.otp_lock_period_in_hours}` },
						},
						HttpStatus.FORBIDDEN,
					);
				} else {
					await this.customerRepo.update(
						{
							idx: customerProfileExist.idx,
							is_obsolete: false,
						},
						{
							otp_locked_status: false,
						},
					);
				}


				await this.customerRepo.update(
					{
						idx: customerProfileExist.idx,
						is_obsolete: false,
					},
					{
						otp_locked_status: false,
					},
				);
				
			}

			const customerDeviceExist = await this.customerDeviceRepo.findOne({
				where: {
					deviceid: customerLogin.deviceid,
					is_obsolete: false,
				},
			});

			if (customerDeviceExist) {
				throw new HttpException(
					{
						message: 'operations.CUSTOMER_DEVICE_EXIST',
					},
					HttpStatus.BAD_REQUEST,
				);
			}

			await getManager()
				.createQueryBuilder()
				.insert()
				.into(CustomerDevice)
				.values([
					{
						...customerLogin,
						customer_id: BigInt(customerProfileExist.id),
						otp: otpEncripted,
						otp_status: false,
						otp_created_at: new Date(),
						otp_type: 'LOGIN',
					},
				])
				.execute();

			await this.customerRepo.update({
				is_obsolete:false,
				idx: customerProfileExist.idx
			},{
				otp_created_time: new Date(), //we use this time for otp time check for login

			})
		}
		try {
			const getTemplateByActionAlias = await Axios.get(
				`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}send_otp`,
			);

			const requiredTemplate = getTemplateByActionAlias.data.action_message;
			const requiredMessageToSend = requiredTemplate.replace(
				'<OTP>',
				`${otpGenerated}`,
			);
			const requiredMessageToSendFinal = requiredMessageToSend.replace(
				'<USER>',
				`${customerProfileExist.first_name}`,
			);

			const response: any = await Axios.post(
				`${process.env.SEND_MEMBER_NOTIFICATION}`,
				{
					action_alias: 'send_otp',
					customers: [
						{
							idx: customerProfileExist.idx,
							message: `${requiredMessageToSendFinal}`,
						},
					],
				},
			);

			if (response.status === 200 || response.status === 201) {
				return { statusCode: 200, message: 'OTP sent' };
			}
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data.message, e.response.status);
		}
	}

	async loginWithPasswordService(
		idx: string,
		loginWithPasswordData: LoginWithPasswordDto,
		deviceId: string,
	) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				mobile_number: loginWithPasswordData.mobile_number,
				is_obsolete: false,
			},
			select: [
				'id',
				'idx',
				'is_mpin_set',
				'is_panno_verified',
				'is_initial_terms_agreed',
				'is_security_set',
				'first_name',
				'last_name',
				'password',
				'is_password_set',
				'is_active',
				'otp_created_time'
			],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		if (!customerProfileExist.is_active) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_BLOCKED',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const customer = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: customerProfileExist.id,
				is_obsolete: false,
			},
		});

		if (!customer) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		if (customer) {
			if (deviceId === undefined) {
				throw new HttpException(
					{
						message: 'operations.DEVICE_ID_MISSING',
					},
					HttpStatus.BAD_REQUEST,
				);
			}

			const device_id = deviceId.split(' ')[1];

			if (customer.deviceid !== device_id) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.DEVICE_ID_MISMATCH',
					},
					HttpStatus.FORBIDDEN,
				);
			}

			if (parseInt(customer.total_attempt, 10) >= 3) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.CUSTOMER_BLOCKED',
					},
					HttpStatus.FORBIDDEN,
				);
			}
		}

		const isPasswordValid = await argon.verify(
			customerProfileExist.password,
			loginWithPasswordData.password,
		);

		if (!isPasswordValid) {
			const attempt = +customer.total_attempt + 1;

			await getManager()
				.createQueryBuilder()
				.update(CustomerDevice)
				.where('customer_id = :customer_id', {
					customer_id: customerProfileExist.id,
				})
				.set({
					total_attempt: attempt.toString(),
				})
				.execute();

			throw new HttpException(
				{
					message: 'operations.OOPS_INVALID_CREDENTIAL',
					sub: 'operations.INVALID_CREDENTIAL',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		if (isPasswordValid) {
			let time =
				new Date().valueOf() - new Date(customerProfileExist.otp_created_time).valueOf();
			time = Math.round(((time % 86400000) % 3600000) / 60000);

			const payload = {
				mobile_number: loginWithPasswordData.mobile_number,
				idx: customerProfileExist.idx,
			};

			cleanData(loginWithPasswordData, [
				'phone_ext',
				'mobile_number',
				'otp',
				'password',
			]);

			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.createQueryBuilder()
					.update(CustomerDevice)
					.where('customer_id = :customer_id', {
						customer_id: customerProfileExist.id,
					})
					.set({
						total_attempt: '0',
						token: null,
					})
					.execute();
			});

			return [payload, customerProfileExist];
		}
	}

	async validateOtp(
		validateCustomerLogin: CustomerLoginValidateDTO,
		deviceId: string,
	) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				mobile_number: validateCustomerLogin.mobile_number,
				is_obsolete: false,
			},
			select: [
				'id',
				'idx',
				'is_mpin_set',
				'is_panno_verified',
				'is_initial_terms_agreed',
				'is_security_set',
				'first_name',
				'last_name',
				'is_active',
				'otp_locked_status',
				'is_mpin_reset',
				'otp_created_time'
			],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (!customerProfileExist.is_active) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_BLOCKED',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const protocols = await this.protocolRepository.findOne({
			is_obsolete: false,
		});

		if (customerProfileExist.otp_locked_status) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_TEMPORARY_BLOCKED',
					args: { time: `${protocols.otp_lock_period_in_hours}` },
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const customer = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: customerProfileExist.id,
				is_obsolete: false,
			},
		});

		if (!customer) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_DETAIL_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (customer) {
			if (deviceId === undefined) {
				throw new HttpException(
					{
						message: 'operations.DEVICE_ID_MISSING',
					},
					HttpStatus.NOT_FOUND,
				);
			}

			const device_id = deviceId.split(' ')[1];

			if (customer.deviceid !== device_id) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.DEVICE_ID_MISMATCH',
					},
					HttpStatus.FORBIDDEN,
				);
			}

			if (customer.otp_type !== 'LOGIN') {
				throw new HttpException(
					{
						message: 'operations.NOT_VALID_OTP_TYPE',
					},
					HttpStatus.BAD_REQUEST,
				);
			}

			if (customer.otp_status) {
				throw new HttpException(
					{
						message: 'operations.OTP_ALREADY_USED',
					},
					HttpStatus.BAD_REQUEST,
				);
			}

			if (parseInt(customer.total_attempt, 10) >= 3) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.CUSTOMER_BLOCKED',
					},
					HttpStatus.FORBIDDEN,
				);
			}
		}

		const isOtpValid = await argon.verify(
			customer.otp,
			validateCustomerLogin.otp,
		);

		if (!isOtpValid) {
			const attempt = +customer.total_attempt + 1;

			await getManager()
				.createQueryBuilder()
				.update(CustomerDevice)
				.where('customer_id = :customer_id', {
					customer_id: customerProfileExist.id,
				})
				.andWhere('is_obsolete = :is_obsolete', {
					is_obsolete: false,
				})
				.set({
					total_attempt: attempt.toString(),
				})
				.execute();

			if (attempt >= 3) {
				await getManager()
					.createQueryBuilder()
					.update(Customer)
					.where('id = :id', {
						id: customerProfileExist.id,
					})
					.andWhere('is_obsolete = :is_obsolete', {
						is_obsolete: false,
					})
					.set({
						otp_locked_status: true,
					})
					.execute();

				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.CUSTOMER_TEMPORARY_BLOCKED',
						args: { time: `${protocols.otp_lock_period_in_hours}` },
					},
					HttpStatus.FORBIDDEN,
				);
			}

			throw new HttpException(
				{
					message: 'operations.OOPS_INVALID_OTP',
					sub: 'operations.INVALID_OTP',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		if (isOtpValid) {
			let time =
				new Date().valueOf() - new Date(customerProfileExist.otp_created_time).valueOf();
			time = Math.round(((time % 86400000) % 3600000) / 60000); //in minutes difference

			if (time > protocols.otp_expires_in_minutes) {
				throw new HttpException('Otp Expired', HttpStatus.BAD_REQUEST);
			}

			const payload = {
				mobile_number: validateCustomerLogin.mobile_number,
				idx: customerProfileExist.idx,
			};

			cleanData(validateCustomerLogin, ['phone_ext', 'mobile_number', 'otp']);

			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.createQueryBuilder()
					.update(CustomerDevice)
					.where('customer_id = :customer_id', {
						customer_id: customerProfileExist.id,
					})
					.andWhere('is_obsolete = :is_obsolete', {
						is_obsolete: false,
					})
					.set({
						otp_status: true,
						total_attempt: '0',
						token: null,
						...validateCustomerLogin,
					})
					.execute();
			});

			return [payload, customerProfileExist];
		}
	}

	async JwtSign(payload: any) {
		return this.jwtService.sign(payload, { expiresIn: '30d' });
	}

	async getMyProfile(idx: string) {
		const customer = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
		});
		const emandate = await this.eMandateRepository.findOne({
			where: {
				customer_idx: customer.idx,
				is_obsolete: false,
			},
		});
		const customerProfile = await this.customerProfileRepo.findOne({
			where: {
				customer: customer,
				is_obsolete: false,
			},
		});
		const customerCard = await this.customerCardRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: ['card_status', 'registration_date', 'valid_till', 'is_active'],
		});
		const customerApplication = await this.customerApplicationRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
		});
		try {
			const response = await Axios.get(
				`${process.env.GET_CUSTOMER_CREDIT_LIMIT}${idx}`,
			);

			if (response.status === 200 || response.status === 201) {
				customer.credit_limit = response.data.credit_limit;
			}
		} catch (error) {
			throw new HttpException(
				error.response.data.message,
				error.response.data.statusCode,
			);
		}

		cleanData(customer, [
			'id',
			'is_obsolete',
			'is_active',
			'created_on',
			'modified_on',
			'is_mpin_set',
		]);

		customer['customer_account_number'] =
			emandate && emandate.account_number ? emandate.account_number : '';
		customer['age'] =
			customer && customer.date_of_birth
				? moment(new Date()).diff(
						moment(customer.date_of_birth).format('YYYY-MM-DD'),
						'years',
				  )
				: '';
		customer['residence_type'] =
			customerProfile && customerProfile.residence_type
				? customerProfile.residence_type
				: '';
		customer['monthly_income'] =
			customerProfile && customerProfile.monthly_income
				? customerProfile.monthly_income
				: '';
		customer['customer_id'] =
			customerProfile && customerProfile.customer_id
				? customerProfile.customer_id
				: '';
		customer['accomodation_type'] =
			customerProfile && customerProfile.accomodation_type
				? customerProfile.accomodation_type
				: '';
		customer['user_identifier'] =
			emandate && emandate.user_identifier ? emandate.user_identifier : '';
		customer['application_number'] =
			customerApplication && customerApplication.application_number
				? customerApplication.application_number
				: '';
		customer['preferred_branch'] =
			customerProfile && customerProfile.preferred_branch
				? customerProfile.preferred_branch
				: '';
		customer['card_status'] =
			customerCard && customerCard.card_status ? customerCard.card_status : '';
		customer['is_card_active'] =
			customerCard && customerCard.is_active ? customerCard.is_active : '';
		customer['full_address'] =
			customerProfile && customerProfile.address1
				? customerProfile.address1
				: '';
		customer['next_level_required_points'] = 20; //static key for now.will add logic to calculate later

		return customer;
	}

	async GetResidenceStatusService() {
		const required_resident_status: Array<any> = [
			{
				name: 'PARENTAL',
			},
			{
				name: 'HOSTEL',
			},
			{
				name: 'PG',
			},
			{
				name: 'RENTED',
			},
			{
				name: 'SELF',
			},
			{
				name: 'COMPANY PVRD',
			},
		];

		return { data: required_resident_status };
	}

	async GetAccountTypeService() {
		const account_types: Array<any> = [
			{
				name: 'Saving',
			},
			{
				name: 'Current',
			},
			{
				name: 'Cash Credit',
			},
			{
				name: 'KCC',
			},
			{
				name: 'Over Draft',
			},
		];

		return { data: account_types };
	}

	async GetAddressService(idx: string) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: [
				'id',
				'idx',
				'first_name',
				'middle_name',
				'last_name',
				'email',
				'mobile_number_ext',
				'mobile_number',
			],
		});

		const customerProfileData = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: [
				'identification_number',
				'address_type',
				'address1',
				'state',
				'land_mark',
			],
		});

		const customerCardData = await this.customerCardRepo.findOne({
			where: { customer_idx: customer.idx, is_obsolete: false },
			select: ['membership_type', 'membership_number', 'card_status'],
		});

		const interestRate = await this.interestRateDetailsRepo.findOne({
			where: { is_obsolete: false },
			select: ['interest_rate'],
		});

		if (!customerProfileData) {
			customer.identification_number = '';
			customer.address_type = '';
			customer.address1 = '';
			customer.land_mark = '';
		}
		if (!customerCardData) {
			customer.membership_type = '';
			customer.membership_number = '';
			customer.card_status = '';
		}

		if (!interestRate) {
			customer.interest_rate = '';
		}

		delete customer.id;

		return {
			data: {
				...customer,
				...customerProfileData,
				...customerCardData,
				...interestRate,
			},
		};
	}

	async UpdateCurrentAddress(idx: string, data) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: [
				'id',
				'idx',
				'first_name',
				'middle_name',
				'last_name',
				'email',
				'mobile_number_ext',
				'mobile_number',
			],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
		});

		if (!customerProfileData) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_PROFILE_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		const requiredStateCodeFromNameDB: any = await getCodeFromState(data.state);

		const requiredStateCodeFromName = requiredStateCodeFromNameDB.state_code;

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ ...data, state: requiredStateCodeFromName || "" },
		);

		return {
			message: 'Current Address updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async GetCurrentAddressService(idx: string) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id'],
		});

		const customerProfileData = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: [
				'address1',
				'land_mark',
				'pin_code',
				'state',
				// 'resident_status', //we are mapping in accomodation_type
				'accomodation_type',
				'years_at_current_state',
				'months_at_current_state',
				'duration_at_current_city',
				'month_duration_at_current_city',
				'address_proof',
			],
		});

		if (!customerProfileData) {
			// customer.address_type = '';
			customer.address1 = '';
			customer.state = '';
			customer.land_mark = '';
			customer.pin_code = '';
			// customer.resident_status = '';
			customer.accomodation_type = '';
			customer.years_at_current_state = '';
			customer.months_at_current_state = '';
			customer.duration_at_current_city = '';
			customer.month_duration_at_current_city = '';
			customer.address_proof = '';
			
		}

		delete customer.id;

		const mappedStateNameFromStateCode: any = await getStateFromCode(customerProfileData.state);
		return {
			data: {
				...customer,
				...customerProfileData,
				state: customerProfileData.state ? mappedStateNameFromStateCode.state_name : "",
				proof_base_url: `${process.env.MINIO_ROOT_URL}://${process.env.MINIO_ENDPOINT}/${process.env.ADDRESSPROOF_BUCKETNAME}/`,
			},
		};
	}

	async GetPersoanlInfo(idx: string) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id'],
		});

		const customerProfileData = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: [
				'loan_details',
				'preferred_branch',
				'permanent_address',
				'permanent_landmark',
				'permanent_pincode',
				'permanent_state',
				'permanent_residence_status',
				'permanent_address_proof',
			],
		});

		if (!customerProfileData) {
			customer.loan_details = '';
			customer.preferred_branch = '';
			customer.permanent_address = '';
			customer.permanent_landmark = '';
			customer.permanent_pincode = '';
			customer.permanent_state = '';
			customer.permanent_residence_status = '';
			customer.permanent_address_proof = '';
		}

		delete customer.id;

		const mappedStateNameFromStateCode: any = await getStateFromCode(customerProfileData.permanent_state);

		return {
			data: {
				...customer,
				...customerProfileData,
				state: customerProfileData.permanent_state ? mappedStateNameFromStateCode.state_name : "",
				proof_base_url: `${process.env.MINIO_ROOT_URL}://${process.env.MINIO_ENDPOINT}/${process.env.ADDRESSPROOF_BUCKETNAME}/`,
			},
		};
	}

	async UpdatePersoanlInfoService(idx: string, data) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: [
				'id',
				'idx',
				'first_name',
				'middle_name',
				'last_name',
				'email',
				'mobile_number_ext',
				'mobile_number',
			],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
		});

		if (!customerProfileData) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_PROFILE_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ ...data },
		);

		return {
			message: 'Preferred branch updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async GetWorkDetailsService(idx: string) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'first_name', 'middle_name', 'last_name'],
		});

		const customerProfileData = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: [
				'occupation_type',
				'nature_of_business',
				'industry',
				'total_income',
				'years_in_job',
				'months_in_job',
				'office_address',
				'office_landmark',
				'office_pincode',
				'office_state',
				'income_proof',
				'employer_name',
			],
		});

		if (!customerProfileData) {
			customer.occupation_type = '';
			customer.nature_of_business = '';
			customer.industry = '';
			customer.total_income = '';
			customer.years_in_job = '';
			customer.months_in_job = '';
			customer.office_address = '';
			customer.office_landmark = '';
			customer.office_pincode = '';
			customer.office_state = '';
			customer.income_proof = '';
			customer.employer_name = '';
		}

		if (!customer.total_income) {
			customer.total_income = 0;
		}

		delete customer.id;

		const mappedStateNameFromStateCode: any = await getStateFromCode(customerProfileData.office_state);

		return {
			data: {
				...customer,
				...customerProfileData,
				office_state: customerProfileData.office_state ? mappedStateNameFromStateCode.state_name : "",
				proof_base_url: `${process.env.MINIO_FILE_SERVE_URL}${process.env.ADDRESSPROOF_BUCKETNAME}/`,
			},
		};
	}

	async UpdateWorkDetailsService(idx: string, data) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: [
				'id',
				'idx',
				'first_name',
				'middle_name',
				'last_name',
				'email',
				'mobile_number_ext',
				'mobile_number',
			],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
		});

		if (!customerProfileData) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_PROFILE_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ ...data },
		);

		return {
			message: 'Income details updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async GetReferenceDetailsService(idx: string) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id'],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: [
				'reference_name',
				'reference_mobile_number',
				'reference_address',
				'reference_landmark',
				'reference_pincode',
				'reference_state',
				'reference_relationship',
				'reference2_name',
				'reference2_mobile_number',
				'reference2_address',
				'reference2_landmark',
				'reference2_pincode',
				'reference2_state',
				'reference2_relationship',
				'has_terms_aggreed',
			],
		});

		if (!customerProfileData) {
			customer.reference_name = '';
			customer.reference_mobile_number = '';
			customer.reference_address = '';
			customer.reference_landmark = '';
			customer.reference_pincode = '';
			customer.reference_state = '';
			customer.reference_relationship = '';
			customer.reference2_name = '';
			customer.reference2_mobile_number = '';
			customer.reference2_address = '';
			customer.reference2_landmark = '';
			customer.reference2_pincode = '';
			customer.reference2_state = '';
			customer.reference2_relationship = '';
		}

		delete customer.id;

		const mappedStateNameFromStateCode1: any = await getStateFromCode(customerProfileData.reference_state);
		const mappedStateNameFromStateCode2: any = await getStateFromCode(customerProfileData.reference2_state);

		return { 
			data: { ...customer, 
			...customerProfileData,
			reference_state: customerProfileData.reference_state ? mappedStateNameFromStateCode1.state_name : "",
			reference2_state: customerProfileData.reference2_state ? mappedStateNameFromStateCode2.state_name : "",
			} 
		};
	}

	async GetmandateInfoService(idx: string) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'idx'],
		});

		const customerMandateDta = await this.emandateRepo.findOne({
			where: { customer_idx: customer.idx, is_obsolete: false },
			select: ['account_number', 'account_type', 'full_name'],
		});

		if (!customerMandateDta) {
			customer.account_number = '';
			customer.account_type = '';
			customer.full_name = '';
		}
		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: ['ifsc', 'bank_name'],
		});

		if (!customerProfileData) {
			customer.ifsc = '';
			customer.bank_name = '';
		}

		delete customer.id;
		delete customer.idx;

		return {
			data: { ...customer, ...customerMandateDta, ...customerProfileData },
		};
	}

	async UpdateMandateInfoService(idx: string, data) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'idx'],
		});

		const customerMandateDta = await this.emandateRepo.findOne({
			where: { customer_idx: customer.idx, is_obsolete: false },
			select: ['account_number', 'account_type', 'full_name'],
		});

		if (!customerMandateDta) {
			return {
				message: 'Customer Emandate data not found',
				statusCode: HttpStatus.NOT_FOUND,
			};
		}

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: ['ifsc', 'bank_name'],
		});

		if (!customerProfileData) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_PROFILE_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		const updateEmandte = await this.emandateRepo.update(
			{ customer_idx: customer.idx, is_obsolete: false },
			{
				account_number: data.account_number,
				account_type: data.account_type,
			},
		);

		const updateCustomerProfile = await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ ifsc: data.ifsc, bank_name: data.bank_name },
		);

		if (updateEmandte && updateCustomerProfile) {
			return {
				message: 'Emandate information updated successfully',
				statusCode: HttpStatus.OK,
			};
		}
	}

	async GetStateCodes(search = '') {
		const query = getRepository(StateCode)
			.createQueryBuilder('stateCode')
			.where('stateCode.is_obsolete = :is_obsolete', {
				is_obsolete: false,
			});

		if (search !== '') {
			query.andWhere(
				new Brackets(qb => {
					qb.where(
						`stateCode.state_name ILIKE :search or stateCode.state_code ILIKE :search`,
						{
							search: `${search}%`,
						},
					);
				}),
			);
		}

		const [result, total] = await query.getManyAndCount();

		const host = await this.getHost();
		return paginate(1, 1, total, host, result);
	}

	async GetAeonBranchService(search = '') {
		const query = getRepository(AeonBranch)
			.createQueryBuilder('aeonBranch')
			.where('aeonBranch.is_obsolete = :is_obsolete', {
				is_obsolete: false,
			});

		if (search !== '') {
			query.andWhere(
				new Brackets(qb => {
					qb.where(`aeonBranch.name ILIKE :search`, {
						search: `${search}%`,
					});
				}),
			);
		}

		const [result, total] = await query.getManyAndCount();

		const host = await this.getHost();
		return paginate(1, 1, total, host, result);
	}

	async UpdateAddressProofService(idx: string, fileName) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'idx'],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
		});

		if (!customerProfileData) {
			const dataToSave = {
				customer: customer.id,
				address_proof: fileName,
			};
			await this.customerProfileRepo.save(dataToSave);

			return {
				message: 'Address updated sucessfully',
				statusCode: HttpStatus.CREATED,
			};
		}

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ address_proof: fileName },
		);

		return {
			message: 'Address updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async UpdatePermanentAddressProofService(idx: string, fileName) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'idx'],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
		});

		if (!customerProfileData) {
			const dataToSave = {
				customer: customer.id,
				permanent_address_proof: fileName,
			};
			await this.customerProfileRepo.save(dataToSave);

			return {
				message: 'Address updated sucessfully',
				statusCode: HttpStatus.CREATED,
			};
		}

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ permanent_address_proof: fileName },
		);

		return {
			message: 'Address updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async UpdateIncomeProof(idx: string, fileName) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'idx'],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
		});

		if (!customerProfileData) {
			const dataToSave = {
				customer: customer.id,
				income_proof: fileName,
				income_proof_updated: true,
			};
			await this.customerProfileRepo.save(dataToSave);

			return {
				message: 'Income proof updated sucessfully',
				statusCode: HttpStatus.CREATED,
			};
		}

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ income_proof: fileName, income_proof_updated: true },
		);

		return {
			message: 'Income proof updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async UpdateTermsAndConditionsService(idx: string, data) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: [
				'id',
				'idx',
				'first_name',
				'middle_name',
				'last_name',
				'email',
				'mobile_number_ext',
				'mobile_number',
			],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: ['has_terms_aggreed'],
		});

		if (!customerProfileData) {
			throw new HttpException(
				'Customer Profile data not found',
				HttpStatus.NOT_FOUND,
			);
		}

		await this.customerProfileRepo.update(
			{ customer: customer.id, is_obsolete: false },
			{ has_terms_aggreed: data.status === 'AGREE' ? true : false },
		);

		return {
			message: 'Terms and conditions updated sucessfully',
			statusCode: HttpStatus.OK,
		};
	}

	async validatePanNo(validatePanNo: ValidatePanNoDto) {
		const activeCustomerProfileExist = await this.customerRepo.findOne({
			where: {
				mobile_number: validatePanNo.mobile_number,
				is_obsolete: false,
			},
			select: ['is_mpin_set', 'mobile_number', 'is_panno_verified', 'panno'],
		});

		if (!activeCustomerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (activeCustomerProfileExist.is_panno_verified) {
			throw new HttpException(
				{
					message: 'operations.PANNO_ALREADY_VERIFIED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		if (validatePanNo.panno === activeCustomerProfileExist.panno) {
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.createQueryBuilder()
					.update(Customer)
					.where('mobile_number = :mobile_number', {
						mobile_number: activeCustomerProfileExist.mobile_number,
					})
					.andWhere('is_panno_verified = :is_panno_verified', {
						is_panno_verified: false,
					})
					.set({
						is_panno_verified: true,
					})
					.execute();
			});

			return {
				message: 'PAN Number verified successfully',
				status: HttpStatus.OK,
			};
		} else {
			throw new HttpException(
				{
					message: 'operations.OOPS_PANNO',
					sub: 'operations.INVALID_PANNO',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async validateInitialTermsService(
		validateInitialTerms: ValidateInitialTermsDto,
		idx: string,
	) {
		await getManager().transaction(async transactionalEntityManager => {
			await transactionalEntityManager
				.createQueryBuilder()
				.update(Customer)
				.where('idx = :idx', {
					idx,
				})
				.andWhere('is_obsolete = :is_obsolete', {
					is_obsolete: false,
				})
				.set({
					is_initial_terms_agreed:
						validateInitialTerms.status === 'AGREE' ? true : false,
				})
				.execute();
		});

		return {
			message: 'Terms and conditions updated successfully',
			status: HttpStatus.OK,
		};
	}

	async checkMPINset(idx: string) {
		const checkMpinStatus = await this.customerRepo.findOne({
			idx,
			is_obsolete: false,
		});

		if (checkMpinStatus) {
			const checkDeviceId = await this.customerDeviceRepo.findOne({
				where: {
					customer_id: checkMpinStatus.id,
					is_obsolete: false,
				},
			});
		}

		if (checkMpinStatus.is_mpin_set) {
			return 'True';
		}
		return 'False';
	}

	async checkPanNoVerified(idx: string) {
		const checkPanNoStatus = await this.customerRepo.findOne({
			idx,
			is_obsolete: false,
		});

		if (checkPanNoStatus.is_panno_verified) {
			return 'True';
		}
		return 'False';
	}

	async changeIsMpinSet(header) {
		const token = header.authorization.split(' ')[1];
		const payload = await parseJwt(token);
		await getManager().transaction(async transactionalEntityManager => {
			await transactionalEntityManager
				.createQueryBuilder()
				.update(Customer)
				.where('idx = :idx', {
					idx: payload.idx,
				})
				.set({
					is_mpin_set: true,
				})
				.execute();
		});
		throw new HttpException('MPIN set successfully', HttpStatus.OK);
	}

	async changeMyMobileNumberService(idx: string, data) {
		const customer: any = await this.customerRepo.findOne({
			idx,
			is_obsolete: false,
		});

		const customerTempInfo: any = await this.customerTempRepository.findOne({
			customer_id: customer.id,
			operation: 'UPDATE',
			status: 'PENDING',
			is_obsolete: false,
		});

		if (customerTempInfo) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.OPERATION_IN_PENDING',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		customer.mobile_number = data.mobile_number;
		customer.customer_id = customer.id.toString();

		cleanData(customer, ['modified_on', 'id', 'idx', 'created_on']);

		await this.customerTempRepository.save({
			status: Status.PENDING,
			operation: Operations.UPDATE,
			created_by: idx,
			...customer,
		});
		return { statusCode: 200, message: 'Update pending' };
	}

	async updateMyProfile(idx: string, data) {
		const customer = await this.customerRepo.findOne({
			idx,
			is_obsolete: false,
		});

		cleanData(customer, ['idx', 'modified_on', 'created_on']);
		const updatedCustomer = { ...customer, ...data };

		await this.customerTempRepository.save({
			status: Status.PENDING,
			operation: Operations.UPDATE,
			created_by: idx,
			...updatedCustomer,
			customer_id: customer.id.toString(),
		});
		return { statusCode: 200, message: 'Update pending' };
	}

	async QRCodeWithdrawlResponse(idx, amount) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['idx', 'mobile_number', 'first_name'],
		});

		if (customerProfileExist) {
			if (
				amount.amount === '0' ||
				amount.amount === '' ||
				parseInt(amount.amount, 10) < 0
			) {
				throw new HttpException(
					{
						message: 'operations.AMOUNT_MUST_BE_GREATER',
					},
					HttpStatus.BAD_REQUEST,
				);
			}
			if (!isObjectEmpty(amount)) {
				return {
					customerProfileExist,
					amount,
					status: HttpStatus.OK,
				};
			}
			return {
				customerProfileExist,
				status: HttpStatus.OK,
			};
		}
	}

	async checkDeviceId(token: string, deviceId: string) {
		if (deviceId === undefined) {
			throw new HttpException(
				{
					message: 'operations.DEVICE_ID_MISSING',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
		const device_id = deviceId.split(' ')[1];
		const { idx } = await parseJwt(token);
		const customerExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
		});
		console.log('customerExist: ', customerExist);
		if (!customerExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (!customerExist.is_active) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_BLOCKED',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		const protocols = await this.protocolRepository.findOne({
			is_obsolete: false,
		});

		if (customerExist.otp_locked_status) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_TEMPORARY_BLOCKED',
					args: { time: `${protocols.otp_lock_period_in_hours}` },
				},
				HttpStatus.FORBIDDEN,
			);
		}
		console.log('customerExist.id: ', customerExist.id);
		if (customerExist) {
			const checkDeviceID = await this.customerDeviceRepo.findOne({
				where: {
					customer_id: customerExist.id,
					is_obsolete: false,
				},
			});
			console.log('checkDeviceID: ', checkDeviceID);
			if (!checkDeviceID) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.CUSTOMER_RESET',
					},
					HttpStatus.FORBIDDEN,
				);
			}
			if (checkDeviceID.deviceid !== device_id) {
				return 'Device ID Mismatch';
			} else {
				return idx;
			}
		}
	}

	async checkDeviceIdAndUser(
		mobile_number_ext: string,
		mobile_number: string,
		deviceId: string,
	) {
		if (deviceId === undefined) {
			throw new HttpException(
				{
					message: 'operations.DEVICE_ID_MISSING',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
		const device_id = deviceId.split(' ')[1];

		const customerExist = await this.customerRepo.findOne({
			where: {
				mobile_number,
				is_obsolete: false,
			},
		});

		if (!customerExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (customerExist) {
			const checkDeviceID = await this.customerDeviceRepo.findOne({
				where: {
					customer_id: customerExist.id,
					is_obsolete: false,
				},
			});
			if (!checkDeviceID) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.CUSTOMER_RESET',
					},
					HttpStatus.FORBIDDEN,
				);
			}
			if (checkDeviceID.deviceid !== device_id) {
				return 'Device ID Mismatch';
			} else {
				return customerExist.idx;
			}
		}
	}

	async CustomerFromToken(token: string) {
		const { idx } = await parseJwt(token);
		return this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
		});
	}

	async GetRule(type: string) {
		return this.OperationRulesRepo.findOne({
			where: { operationType: type },
		});
	}

	async GetOperationLogByCondition(condition: any) {
		return this.OperationLogsRepo.find(condition);
	}

	async LogOperation(idx: string, code: string, type: string) {
		return this.OperationLogsRepo.save({
			customerIdx: idx,
			code,
			operationType: type,
		});
	}

	async UpdateCustomer(idx: string, partialEntity: any) {
		return this.customerRepo.update({ idx }, partialEntity);
	}

	async AuthenticateForMiddleware() {
		const response = await Axios.post(
			`${process.env.AUTHENTICATE_FOR_MIDDLEWARE}`,
			{
				consumer_code: process.env.CONSUMER_CODE,
				email: process.env.AUTH_EMAIL,
				phone_number: process.env.AUTH_PHONE_NUMBER,
				phone_number_ext: process.env.AUTH_PHONE_NUMBER_EXT,
				password: process.env.AUTH_PASSWORD,
			},
		);

		console.log(response, 'rerere');

		return response.data.key;
	}

	async getAllProductCreditService(customer_idx: string, query) {
		try {
			const getCustomerInfo = await this.customerRepo.findOne({
				idx: customer_idx,
				is_obsolete: false,
			});

			if (!getCustomerInfo) {
				throw new HttpException(
					{
						message: 'operations.CANNOT_PROCEED',
						sub: 'operations.CUSTOMER_NOT_FOUND',
					},
					HttpStatus.FORBIDDEN,
				);
			}

			const key = await this.AuthenticateForMiddleware();

			console.log(key, 'here ');

			Logger.log(key);
			const response = await Axios.get(
				`${process.env.GET_ALL_PRODUCT_CREDIT}`,
				{
					headers: {
						Authorization: `Token ${key}`,
					},
					params: {
						customer_idx,
						...query,
					},
				},
			);
			return response.data;
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data.response, e.data.response.status);
		}
	}

	async GetCustomerFile(transaction_idx: string) {
		try {
			const key = await this.AuthenticateForMiddleware();
			Logger.log(key);
			const response = await Axios.get(
				`${process.env.GET_CUSTOMER_FILE}${transaction_idx}`,
				{
					headers: {
						Authorization: `Token ${key}`,
					},
				},
			);
			return response.data;
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data.response, e.data.response.status);
		}
	}

	async getOneProductCreditService(idx) {
		try {
			const key = await this.AuthenticateForMiddleware();
			const response = await Axios.get(
				`${process.env.GET_ONE_PRODUCT_CREDIT}${idx}`,
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

	async GetEmiRepaymentDetails(customer_code: string) {
		try {
			const key = await this.AuthenticateForMiddleware();
			const response = await Axios.get(
				`${process.env.GET_EMI_PAYMENT_DETAILS}${customer_code}`,
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

	async EditProfile(customer_code: string) {
		try {
			const key = await this.AuthenticateForMiddleware();
			const response = await Axios.post(
				`${process.env.GET_EMI_PAYMENT_DETAILS}${customer_code}`,
				{},
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

	async checkCustomerCodeExist(customer_code) {
		return this.customerRepo.findOne({
			customer_code,
			is_obsolete: false,
		});
	}

	async randomNumber() {
		return Math.floor(Math.random() * 10000000000).toString();
	}

	async check_code() {
		const customer_code = await this.randomNumber();

		const customerCodeExist = await this.checkCustomerCodeExist(customer_code);

		if (customerCodeExist) {
			this.check_code();
		}

		if (!customerCodeExist) {
			return customer_code;
		}
	}

	async getCustomerCard(idx) {
		const customerInfo = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['customer_code'],
		});
		const customerCardInfo = await this.customerCardRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: [
				'valid_till',
				'membership_type',
				'membership_number',
				'reward_point',
				'total_points',
				'point_available_redemption',
				'registration_date',
				'is_membership_changed'
			],
		});

		if (!customerCardInfo.valid_till) {
			let newValidTill;
			if (customerCardInfo.registration_date) {
				newValidTill = moment(customerCardInfo.registration_date)
					.add(4, 'years')
					.format('YYYY-MM-DD');
			} else {
				newValidTill = moment(new Date()).add(4, 'years').format('YYYY-MM-DD');
			}

			//update new valid_till
			await this.customerCardRepo.update(
				{
					customer_idx: idx,
					is_obsolete: false,
				},
				{
					valid_till: newValidTill,
				},
			);
		}

		const customerCardInfoAgain = await this.customerCardRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: [
				'valid_till',
				'membership_type',
				'membership_number',
				'reward_point',
				'total_points',
				'point_available_redemption',
				'registration_date',
				'is_membership_changed'
			],
		});

		const dataToReturn = {
			customer_code: customerInfo.customer_code || '',
			valid_till: customerCardInfoAgain.valid_till,
			membership_type: customerCardInfoAgain.membership_type || '',
			membership_number: customerCardInfoAgain.membership_number || '',
			reward_point: customerCardInfoAgain.reward_point || 0,
			total_point: customerCardInfoAgain.total_points || 0,
			point_available_redemption:
				customerCardInfoAgain.point_available_redemption || 0,
			is_membership_changed:
				customerCardInfoAgain.is_membership_changed || false
		};

		return dataToReturn;
	}

	async updateMembershipFlag(idx, updateType: boolean){
		await this.customerCardRepo.update({
			customer_idx:  idx,
			is_obsolete: false
		},{
			is_membership_changed : updateType
		})

		throw new HttpException(
			{
				message: 'operations.MEMBERSHIP_FLAG_UPDATED',
			},
			HttpStatus.OK,
		);
	}

	async getRlRepayment(customer_code: string) {
		try {
			const key = await this.AuthenticateForMiddleware();
			const response = await Axios.get(
				`${process.env.GET_RL_REPAYMENT_DETAILS}${customer_code}`,
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

	async CustomerNotificationService(
		idx: any,
		page: number,
		limit: number,
		offset: number,
	) {
		try {
			const response = await Axios.post(
				`${process.env.GET_CUSTOMER_NOTIFICATIONS}${idx}`,
				{
					page,
					limit,
					offset,
				},
			);

			if (response.status === 200 || response.status === 201) {
				return response.data;
			}
		} catch (error) {
			throw new HttpException(
				error.response.data.message,
				error.response.data.statusCode,
			);
		}
	}

	async GetSoaNocService(customer_idx: any, limit: number, offset: number) {
		try {
			const key = await this.AuthenticateForMiddleware();

			console.log(key, 'here is key');

			const response = await Axios.get(
				`${
					process.env.GET_SOA_NOC
				}?customer_idx=${customer_idx}&limit=${limit}&offset=${
					offset ? offset : ''
				}`,
				{
					headers: {
						Authorization: `Token ${key}`,
					},
				},
			);

			if (response.status === 200 || response.status === 201) {
				return {
					data: response.data.results,
				};
			}
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data.response, e.data.response.status);
		}
	}

	async GetInterestRateService() {
		try {
			const response = await Axios.get(`${process.env.GET_INTEREST_RATE}`);

			if (response.status === 200 || response.status === 201) {
				return response.data;
			}
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data.response, e.data.response.status);
		}
	}

	async ForgetMpinService(idx: any) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: [
				'id',
				'mobile_number',
				'mobile_number_ext',
				'is_mpin_set',
				'first_name',
			],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (!customerProfileExist.is_mpin_set) {
			throw new HttpException(
				{
					message: 'operations.MPIN_NOT_SET_YET',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();
		const otpEncripted = await hashString(otpGenerated);

		const customer = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: customerProfileExist.id,
				is_obsolete: false,
			},
		});

		if (customer) {
			await getManager()
				.createQueryBuilder()
				.update(CustomerDevice)
				.where('customer_id = :customer_id', {
					customer_id: customerProfileExist.id,
				})
				.set({
					otp: otpEncripted,
					otp_status: false,
					total_attempt: '0',
					otp_created_at: new Date(),
					otp_type: 'RESET',
				})
				.execute();
		} else {
			await getManager()
				.createQueryBuilder()
				.insert()
				.into(CustomerDevice)
				.values([
					{
						customer_id: BigInt(customerProfileExist.id),
						otp: otpEncripted,
						otp_created_at: new Date(),
						otp_type: 'RESET',
					},
				])
				.execute();
		}

		try {
			const getTemplateByActionAlias = await Axios.get(
				`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}send_otp`,
			);

			const requiredTemplate = getTemplateByActionAlias.data.action_message;
			const requiredMessageToSend = requiredTemplate.replace(
				'<OTP>',
				`${otpGenerated}`,
			);
			const requiredMessageToSendFinal = requiredMessageToSend.replace(
				'<USER>',
				`${customerProfileExist.first_name}`,
			);

			const response: any = await Axios.post(
				`${process.env.SEND_MEMBER_NOTIFICATION}`,
				{
					action_alias: 'send_otp',
					customers: [
						{
							idx,
							message: `${requiredMessageToSendFinal}`,
						},
					],
				},
			);

			if (response.status === 200 || response.status === 201) {
				return {
					statusCode: 200,
					message: 'Please verify your reset process through OTP',
				};
			}
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data.message, e.response.status);
		}
	}

	async VerifyForgetMpinOtpService(idx: string, data: VerifyForgetMpinOtpDto) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['id', 'is_mpin_set'],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (!customerProfileExist.is_mpin_set) {
			throw new HttpException(
				{
					message: 'operations.MPIN_NOT_SET_YET',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const customerDeviceInfo = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: customerProfileExist.id,
				is_obsolete: false,
			},
			select: ['otp', 'otp_status', 'otp_type', 'otp_created_at'],
		});

		if (!customerDeviceInfo) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_DETAIL_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (customerDeviceInfo.otp_type !== 'RESET') {
			throw new HttpException(
				{
					message: 'operations.NOT_VALID_OTP_TYPE',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		if (customerDeviceInfo.otp_status) {
			throw new HttpException(
				{
					message: 'operations.OTP_ALREADY_USED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		const isOtpValid = await argon.verify(customerDeviceInfo.otp, data.otp);

		if (!isOtpValid) {
			throw new HttpException(
				{
					message: 'operations.INVALID_OTP',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		const token = await hashString(idx);

		await this.customerDeviceRepo.update(
			{
				customer_id: BigInt(customerProfileExist.id),
				is_obsolete: false,
			},
			{
				token,
				otp_status: true,
			},
		);
		return {
			statusCode: 200,
			message: 'OTP verified Successfully',
			token,
		};
	}

	async SetNewMpinAfterForgetService(
		idx: any,
		data: SetMpinAfterForgetDto,
		header: Headers,
	) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['id', 'is_mpin_set'],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (!customerProfileExist.is_mpin_set) {
			throw new HttpException(
				{
					message: 'operations.MPIN_NOT_SET_YET',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		try {
			const response = await Axios.post(
				`${process.env.SET_MPIN_CUSTOMER_URL}`,
				{
					mpin: data.mpin,
					confirm_mpin: data.confirm_mpin,
					idx,
				},
			);
			if (response.data.message === 'success') {
				return this.changeIsMpinSet(header);
			}
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data.message, e.response.status);
		}
	}

	async AuthCustomerService(idx: any) {
		const data: any = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: [
				'idx',
				'first_name',
				'middle_name',
				'last_name',
				'mobile_number_ext',
				'mobile_number',
				'is_active',
				'is_obsolete',
				'customer_code',
				'is_transaction_locked',
			],
		});

		data.user_type = 'CUSTOMER';

		return data;
	}

	async getAllSecurityQuestionService(idx: any) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['id', 'is_security_set'],
		});

		if (!customerProfileExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		if (customerProfileExist.is_security_set) {
			const questionArray = await this.getCustomersQuestions(
				customerProfileExist.id,
			);
			return { data: questionArray };
		}

		const questionArray = [];
		const result = await this.securityQuestionRepo.find({
			where: {
				created_by: 'Superadmin',
				is_obsolete: false,
			},
			select: ['id', 'questions'],
			order: {
				id: 'ASC',
			},
		});

		result.forEach(val => {
			questionArray.push(val.questions);
		});
		return { data: questionArray };
	}

	async setSecurityQuestion(setSecurityQuestion, idx) {
		const { ...customerProfileExist } = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['id', 'idx', 'is_security_set', 'is_mpin_set'],
		});

		if (!customerProfileExist.is_mpin_set) {
			throw new HttpException(
				{
					message: 'operations.MPIN_NOT_SET_YET',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		let data = [];

		data = setSecurityQuestion.map((el: { question: any; answer: any }) => {
			return {
				customer_id: customerProfileExist.id,
				question: el.question,
				answer: el.answer,
			};
		});

		if (customerProfileExist.is_security_set === false) {
			await this.answersRepo.save(data);
			await getManager().transaction(async transactionalEntityManager => {
				await transactionalEntityManager
					.createQueryBuilder()
					.update(Customer)
					.where('id = :id', {
						id: customerProfileExist.id,
					})
					.set({
						is_security_set: true,
					})
					.execute();
			});
			return {
				message: 'Answers to security questions have been set',
				is_security_set: true,
				status: HttpStatus.OK,
			};
		} else if (customerProfileExist.is_security_set === true) {
			for (let i = 0; i < data.length; i++) {
				await getManager().transaction(async transactionalEntityManager => {
					await transactionalEntityManager
						.createQueryBuilder()
						.update(Answers)
						.where('customer_id = :customer_id', {
							customer_id: customerProfileExist.id,
						})
						.andWhere('question = :question', {
							question: data[i].question, // matching question number to update data
						})
						.set({
							answer: data[i].answer,
						})
						.execute();
				});
			}
			return {
				message: 'Security answers updated successfully',
				is_security_set: true,
				status: HttpStatus.OK,
			};
		}
	}

	async getCustomersQuestions(customer_id: number) {
		const data = await this.answersRepo.find({
			where: {
				customer_id,
				is_obsolete: false,
			},
			select: ['question'],
			order: {
				id: 'ASC',
			},
		});

		if (!data) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_SECURITY_QUESTION_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		const dataToReturn = data.map(el => {
			return el.question;
		});

		return dataToReturn;
	}

	async verifyAllSecurityQuestionService(idx: string, answersFromCustomer) {
		const customerProfileExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['id', 'idx', 'is_security_set', 'is_mpin_set'],
		});

		if (!customerProfileExist.is_security_set) {
			throw new HttpException(
				{
					message: 'operations.SECURITY_QUESTION_NOT_ANSWERED',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const ansVerified0 = await this.checkAnswers(
			customerProfileExist.id,
			answersFromCustomer[0].question,
			answersFromCustomer[0].answer,
		);
		const ansVerified1 = await this.checkAnswers(
			customerProfileExist.id,
			answersFromCustomer[1].question,
			answersFromCustomer[1].answer,
		);
		const ansVerified2 = await this.checkAnswers(
			customerProfileExist.id,
			answersFromCustomer[2].question,
			answersFromCustomer[2].answer,
		);
		const ansVerified3 = await this.checkAnswers(
			customerProfileExist.id,
			answersFromCustomer[3].question,
			answersFromCustomer[3].answer,
		);
		const ansVerified4 = await this.checkAnswers(
			customerProfileExist.id,
			answersFromCustomer[4].question,
			answersFromCustomer[4].answer,
		);

		if (
			ansVerified0 &&
			ansVerified1 &&
			ansVerified2 &&
			ansVerified3 &&
			ansVerified4
		) {
			return { statusCode: 200, message: 'Verified successfully' };
		} else {
			throw new HttpException(
				{
					message: 'operations.NOT_VERIFIED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async checkAnswers(id: number, ques: any, ans: string) {
		const dbAnswer = await this.answersRepo.findOne({
			where: {
				customer_id: id,
				question: ques,
				is_obsolete: false,
			},
			select: ['answer'],
			order: {
				id: 'ASC',
			},
		});

		if (dbAnswer.answer === ans) {
			return true;
		} else {
			return false;
		}
	}

	async encryptInfo(idx: string) {
		console.log('requesting ');
		const customer: any = await this.customerRepo
			.createQueryBuilder('customer')
			.leftJoinAndMapOne(
				'customer.card',
				CustomerCard,
				'card',
				'card.customer_idx = customer.idx',
			)
			.where('Customer.idx = :idx', { idx })
			.getOne();

		const value = {
			name: customer.middle_name
				? `${customer.first_name} ${customer.middle_name} ${customer.last_name}`
				: `${customer.first_name} ${customer.last_name}`,
			idx: customer.idx,
			membership_number: customer.card ? customer.card.membership_number : '',
		};

		const encrypted = encryptCrypto(JSON.stringify(value));
		console.log(encrypted);
		return { token: encrypted };
	}

	async decryptInfo(ciphertext: string) {
		return decryptCrypto(ciphertext);
	}

	async checkMpinAndSecuritySet(idx: string) {
		if (!validator.isUUID(idx, 'all')) {
			throw new HttpException('Invalid Idx', HttpStatus.BAD_REQUEST);
		}

		const customerExist = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
		});

		if (!customerExist) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		// if (customerExist.is_mpin_reset) {
		// 	throw new HttpException(
		// 		{
		// 			message: 'operations.OOPS',
		// 			sub: 'operations.RESET_BY_ADMIN',
		// 		},
		// 		HttpStatus.FORBIDDEN,
		// 	);
		// }
		if (!customerExist.is_mpin_set) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.RESET_BY_ADMIN',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (!customerExist.is_security_set) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.SECURITY_QUESTION_NOT_ANSWERED',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		return customerExist;
	}

	async CheckTransactionLockedSevice(idx: string) {
		if (!validator.isUUID(idx, 'all')) {
			throw new HttpException('Invalid Idx', HttpStatus.BAD_REQUEST);
		}

		const customerModuleData = await this.customerRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: [
				'is_security_set',
				'is_mpin_set',
				'is_password_set',
				'is_transaction_locked',
			],
		});

		if (!customerModuleData) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (customerModuleData.is_transaction_locked) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CUSTOMER_BLOCKED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async CheckCardStatus(idx: string) {
		if (!validator.isUUID(idx, 'all')) {
			throw new HttpException('Invalid Idx', HttpStatus.BAD_REQUEST);
		}

		const customerCardInfo = await this.customerCardRepo.findOne({
			where: {
				customer_idx: idx,
			},
			select: ['is_active','card_status'],
		});

		if (customerCardInfo && customerCardInfo.card_status.toLowerCase() !== "active") {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CARD_EXPIRED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
		if (customerCardInfo && !customerCardInfo.is_active) {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.CARD_EXPIRED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async LoyaltyAuthService() {
		const formData = formUrlEncoded({
			grant_type: 'client_credentials',
		});
		const basicAuthBase64 = Buffer.from(
			`${config.LOYALITY_CLIENTID}:${config.LOYALITY_SECRETID}`,
		).toString('base64');

		const loyalityConfig: any = {
			method: 'post',
			url: `${process.env.LOYALITY_AUTH_URL}`,
			headers: {
				Authorization: `Basic ${basicAuthBase64}`,
			},
			data: formData,
		};

		const response = await axios(loyalityConfig)
			.then(function (resp) {
				return resp.data;
			})
			.catch(function (error) {
				throw new HttpException(
					error.response.data.message,
					error.response.data.status,
				);
			});

		return response;
	}

	async PointInquiryService(idx: any) {
		const customer: any = await this.customerRepo.findOne({
			where: { idx, is_obsolete: false },
			select: ['id', 'idx'],
		});

		const customerProfileData: any = await this.customerProfileRepo.findOne({
			where: { customer: customer.id, is_obsolete: false },
			select: ['customer_info_file_number'],
		});

		if (!customerProfileData) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_PROFILE_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		// const customerCardInfo = await this.customerCardRepo.findOne({
		// 	customer_idx: customer.idx,
		// 	is_obsolete: false,
		// });

		// if (!customerCardInfo) {
		// 	throw new HttpException(
		// 		'Customer Card information not found',
		// 		HttpStatus.NOT_FOUND,
		// 	);
		// }

		const counterInfo = await this.counterRepo.findOne({
			where: {
				is_obsolete: false,
			},
			select: ['loan_id_counter'],
		});

		let requiredCounter = counterInfo ? counterInfo.loan_id_counter : '0000001';

		const { access_token } = await this.LoyaltyAuthService();
		const timeNow = moment(new Date()).format('DD/MM/YYYY HH:MM:SS:SSS');

		const response: any = await axios.post(
			`${process.env.LOYALITY_INQUIRY}`,
			{
				customerNumber: `${customerProfileData.customer_info_file_number}`,
				processDateTime: `${timeNow}`,
				processSerialNo: `${requiredCounter}`,
			},
			{
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			},
		);

		console.log('response', response, 'response');

		// {
		// 	"processDateTime": "11/01/2021 10:48:43:059",
		// 	"processSerialNo": "1234567",
		// 	"responseStatus": "0",
		// 	"responseDateTime": "28/01/2021 09:42:26:799",
		// 	"messageId": "0",
		// 	"messageContents": "Success",
		// 	"customerDetail": {
		// 		"customerNumber": "CUST89777756000001",
		// 		"customerName": "Robin Ray",
		// 		"emailId": "robinray@gmail.com",
		// 		"mobileNo": "7454888867",
		// 		"membershipId": "8977201100000094",
		// 		"membershipStatus": "Cancelled",
		// 		"membership": "Diamond",
		// 		"totalPoints": 0,
		// 		"pointElapsed": 1993,
		// 		"pointRedeemed": 1000,
		// 		"pointAvailableRedemption": 0
		// 	}
		// }

		if (response.customerDetail) {
			await this.customerCardRepo.update(
				{ customer_idx: customer.idx, is_obsolete: false },
				{
					total_points: response.customerDetail.totalPoints + '',
					points_elapsed: response.customerDetail.pointElapsed + '',
					point_redemption: response.customerDetail.pointRedeemed + '',
					point_available_redemption:
						response.customerDetail.pointAvailableRedemption + '',
					update_date: new Date().toISOString(),
					membership_type: response.customerDetail.membership,
					is_active:
						response.customerDetail.membership.toLowerCase() === 'active' ||
						response.customerDetail.membership.toLowerCase() === 'a'
							? true
							: false,
				},
			);

			await this.customerPointsHistoryRepo.save({
				customer_idx: customer.idx,
				total_points: response.customerDetail.totalPoints + '',
				points_elapsed: response.customerDetail.pointElapsed + '',
				point_redemption: response.customerDetail.pointRedeemed + '',
				point_available_redemption:
					response.customerDetail.pointAvailableRedemption + '',
			});

			await this.counterRepo.update(
				{ is_obsolete: false },
				{ loan_id_counter: Number(requiredCounter) + 1 },
			);

			return response;
		}

		throw new HttpException(
			response.data.messageContents,
			HttpStatus.BAD_REQUEST,
		);
	}

	async BenefitsService() {
		const benefitsList: any = await this.benefitsRepository.find({
			where: {
				is_obsolete: false,
			},
			select: ['membership', 'benefits'],
			order: {
				id: 'ASC',
			},
		});
		return { data: benefitsList };
	}
}
