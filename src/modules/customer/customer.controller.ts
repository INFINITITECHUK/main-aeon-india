import { blockunblock } from '@common/constants/blockunblock.enum';
import { ApproveRejectDto } from '@dtos/ApproveReject.dto';
import { BlockUnblockDto } from '@dtos/BlockUnblock.dto';
import { ChangeMobileNumberDto } from '@dtos/ChangeMobileNumber.dto';
import { LockStatusDto } from '@dtos/LockStatus.dto';
import { UpdateCustomerDto } from '@dtos/UpdateCustomer.Dto';
import { Customer } from '@entities/customer.entity';
import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	Query,
	Request,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	docFileFilter,
	editFileName,
	editFileNameTest,
} from '../../utils/file-upload.utils';
import { FinnOneDBColumnMapping } from '../../oentities/customerViews.entity';
import { LoyaltyDBColumnMapping } from '../../oentities/loyaltyCustomer.entity';
import { Module } from 'module';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';
// } from '@utils/file-upload.utils';
import { readExcel, validateUUID } from '@utils/helpers';
import { query } from 'express';
import { diskStorage } from 'multer';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { Not } from 'typeorm';
import validator from 'validator';
import { ClientService, CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
	constructor(
		private readonly customerService: CustomerService,
		private readonly clientService: ClientService,
		@Inject(MINIO_CONNECTION) private readonly minioClient,
	) {}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('/')
	async getAllCustomers(
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Query('order_by') order_by = '',
		@Query('search') search = '',
		@Query('status') status = '',
	) {
		const offset = limit * (page - 1);
		return this.customerService.getAllCustomers(
			page,
			offset,
			limit,
			search,
			status,
			order_by,
		);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('/pending')
	async getAllPendingCustomers(
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Query('request_type') request_type = '',
		@Query('search') search = '',
	) {
		const offset = limit * (page - 1);

		return this.customerService.getAllPendingCustomers(
			page,
			offset,
			limit,
			request_type,
			search,
		);
	}

	@Post('upload')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: './files',
				filename: editFileName,
			}),
			fileFilter: docFileFilter,
		}),
	)
	async uploadFile(@UploadedFile() file: any, @Request() req) {
		if (req.fileValidationError === 'Forbidden extension') {
			return { status: HttpStatus.BAD_REQUEST, message: 'Forbidden extension' };
		}
		const excelData = await readExcel(process.cwd() + '/files/test.xlsx');
		return this.customerService.bulkCustomerCreate(excelData);
	}

	@Put('sync')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: './files',
				filename: editFileNameTest,
			}),
			fileFilter: docFileFilter,
		}),
	)
	async syncFile(@UploadedFile() file: any, @Request() req: any) {
		if (req.fileValidationError === 'Forbidden extension') {
			return { status: HttpStatus.BAD_REQUEST, message: 'Forbidden extension' };
		}
		const excelData = await readExcel(process.cwd() + '/files/syncTest.xlsx');
		return this.customerService.bulkCustomerSyncFile(excelData);
	}

	@Post('/changemobilenumber/:idx')
	async changeCustomerMobileNumber(
		@Request() request: Request,
		@Param('idx') customerIdx: string,
		@Body() data: ChangeMobileNumberDto,
	) {
		validateUUID(customerIdx);

		const customer = await this.customerService.getAllCustomerByIdx(
			customerIdx,
		);
		if (!customer) {
			throw new HttpException(
				'Customer with Idx not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return this.customerService.changeCustomerMobileNumberService(
			customerIdx,
			data,
			request,
			customer,
		);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('/:idx')
	async getCustomerByIdx(@Param('idx') idx: string): Promise<Customer> {
		validateUUID(idx);
		return this.customerService.getAllCustomerByIdx(idx);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('pending/:idx')
	async getPendingCustomerByIdx(@Param('idx') idx: string): Promise<any> {
		validateUUID(idx);
		const customer = await this.customerService.getPendingCustomerByIdx(idx);
		if (!customer) {
			throw new HttpException(
				'Customer with Idx not found',
				HttpStatus.NOT_FOUND,
			);
		}

		return customer;
	}

	@Delete('/:idx')
	async deleteCustomerByIdx(@Param('idx') idx: string): Promise<IResponse> {
		validateUUID(idx);
		const customer = await this.customerService.getAllCustomerByIdx(idx);
		if (!customer) {
			throw new HttpException(
				'Customer with Idx not found',
				HttpStatus.NOT_FOUND,
			);
		}

		const requestExists = await this.customerService.getPendingCustomerByCondition(
			{
				customer_id: customer.id,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (requestExists) {
			throw new HttpException(
				'Request for customer already exists',
				HttpStatus.CONFLICT,
			);
		}

		return this.customerService.deleteCustomer(idx);
	}

	@Put('/:idx')
	async updateCustomer(
		@Param('idx') idx: string,
		@Body() customerInfo: UpdateCustomerDto,
	): Promise<IResponse> {
		validateUUID(idx);
		const customer = await this.customerService.checkCustomer(idx);

		if (!customer) {
			throw new HttpException(
				'Customer with Idx not found',
				HttpStatus.NOT_FOUND,
			);
		}

		if (process.env.is_superadmin !== 'true') {
			const requestExists = await this.customerService.getPendingCustomerByCondition(
				{
					customer_id: customer.id,
					status: 'PENDING',
					is_obsolete: false,
				},
			);

			if (requestExists) {
				throw new HttpException(
					'Request for customer already exists',
					HttpStatus.CONFLICT,
				);
			}
		}

		if (customerInfo && customerInfo.is_transaction_locked) {
			if (
				customerInfo.is_transaction_locked !== customer.is_transaction_locked
			) {
				throw new HttpException(
					'Transaction lock property cannot be altered.',
					HttpStatus.CONFLICT,
				);
			}
		}

		const checkCustomerWithNumber = await this.customerService.GetActiveCustomersByCondition(
			{
				mobile_number: customerInfo.mobile_number,
				idx: Not(idx),
				is_obsolete: false,
			},
		);

		if (checkCustomerWithNumber) {
			throw new HttpException(
				'Customer with mobile number already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithEmail = await this.customerService.GetActiveCustomersByCondition(
			{
				email: customerInfo.email,
				idx: Not(idx),
				is_obsolete: false,
			},
		);

		if (checkCustomerWithEmail) {
			throw new HttpException(
				'Customer with email already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithIdPassport = await this.customerService.GetActiveCustomersByCondition(
			{
				id_no: customerInfo.id_no,
				idx: Not(idx),
				is_obsolete: false,
			},
		);

		if (checkCustomerWithIdPassport) {
			throw new HttpException(
				'Customer with id/passport number already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithAccountNumber = await this.customerService.GetActiveCustomersEmandateByCondition(
			{
				customer_idx: Not(idx),
				account_number: customerInfo.account_number,
				is_obsolete: false,
			},
		);

		if (checkCustomerWithAccountNumber) {
			throw new HttpException(
				'Customer with id/passport number already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithNumberTemp = await this.customerService.getPendingCustomerByCondition(
			{
				status: 'PENDING',
				mobile_number: customerInfo.mobile_number,
				is_obsolete: false,
			},
		);

		if (checkCustomerWithNumberTemp) {
			throw new HttpException(
				'Request with mobile number already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithEmailTemp = await this.customerService.getPendingCustomerByCondition(
			{
				email: customerInfo.email,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (checkCustomerWithEmailTemp) {
			throw new HttpException(
				'Request with email already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithIdPassportTemp = await this.customerService.getPendingCustomerByCondition(
			{
				id_no: customerInfo.id_no,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (checkCustomerWithIdPassportTemp) {
			throw new HttpException(
				'Request with id/passport number already exists',
				HttpStatus.CONFLICT,
			);
		}

		const checkCustomerWithAccountNumberinTemp = await this.customerService.GetActiveCustomersEmandateTempByCondition(
			{
				account_number: customerInfo.account_number,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (checkCustomerWithAccountNumberinTemp) {
			throw new HttpException(
				'Request with account number already exists',
				HttpStatus.CONFLICT,
			);
		}

		return this.customerService.updateCustomer(customerInfo, idx);
	}

	@Put('verify/:idx')
	async changeCustomerUpdateStatus(
		@Body() approveReject: ApproveRejectDto,
		@Param('idx') idx: string,
	) {
		validateUUID(idx);

		console.log(process.env.idx, 'here id idx');
		console.log(process.env.is_superadmin, 'here is issuperadmin');

		const customerTemp = await this.customerService.getPendingCustomerByCondition(
			{ idx },
		);

		if (
			customerTemp.status === 'APPROVED' ||
			customerTemp.status === 'REJECTED'
		) {
			throw new HttpException(
				'Request already processed.',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (!customerTemp) {
			throw new HttpException(
				'No customer verification with the given idx',
				HttpStatus.NOT_FOUND,
			);
		}

		if (
			customerTemp.created_by === process.env.idx &&
			process.env.is_superadmin !== 'true'
		) {
			throw new HttpException(
				'Cannot verify own request',
				HttpStatus.BAD_REQUEST,
			);
		}

		approveReject.idx = idx;

		return this.customerService.verifyCustomer(approveReject);
	}

	@Put('block-unblock/:idx')
	async BlockUnblockCustomer(
		@Param('idx') idx: string,
		@Body() { operation }: BlockUnblockDto,
	) {
		validateUUID(idx);

		const customer = await this.customerService.GetActiveCustomersByCondition({
			idx,
			is_obsolete: false,
		});

		if (!customer) {
			throw new HttpException(
				'No customer with the given idx',
				HttpStatus.NOT_FOUND,
			);
		}

		if (!customer.is_active && operation === blockunblock.BLOCK) {
			throw new HttpException(
				'Customer already blocked',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (customer.is_active && operation === blockunblock.UNBLOCK) {
			throw new HttpException(
				'Customer already unblocked',
				HttpStatus.BAD_REQUEST,
			);
		}

		const requestExists = await this.customerService.getPendingCustomerByCondition(
			{
				customer_id: customer.id,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (requestExists) {
			throw new HttpException(
				'Request for customer already exists',
				HttpStatus.CONFLICT,
			);
		}

		return this.customerService.BlockUnblockCustomer(idx, operation, customer);
	}

	@Put('reset-mpin/:idx')
	async ResetCustomerMpin(@Param('idx') idx: string) {
		validateUUID(idx);
		const customer = await this.customerService.GetActiveCustomersByCondition({
			idx,
			is_obsolete: false,
		});

		const requestExists = await this.customerService.getPendingCustomerByCondition(
			{
				customer_id: customer.id,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (requestExists) {
			throw new HttpException(
				'Request for customer already exists',
				HttpStatus.CONFLICT,
			);
		}

		if (!customer) {
			throw new HttpException(
				'No customer with the given idx',
				HttpStatus.NOT_FOUND,
			);
		}
		if (!customer.is_mpin_set) {
			throw new HttpException(
				'Customer m-PIN is not set',
				HttpStatus.BAD_REQUEST,
			);
		}

		return this.customerService.ResetCustomerMpin(idx, customer);
	}

	@Put('reset-device/:idx')
	async ResetDeviceId(@Param('idx') idx: string) {
		validateUUID(idx);

		const customer = await this.customerService.GetActiveCustomersByCondition({
			idx,
			is_obsolete: false,
		});

		if (!customer) {
			throw new HttpException(
				'No customer with the given idx',
				HttpStatus.NOT_FOUND,
			);
		}

		const requestExists = await this.customerService.getPendingCustomerByCondition(
			{
				customer_id: customer.id,
				status: 'PENDING',
				is_obsolete: false,
			},
		);

		if (requestExists) {
			throw new HttpException(
				'Request for customer already exists',
				HttpStatus.CONFLICT,
			);
		}

		return this.customerService.resetDeviceId(customer.mobile_number, customer);
	}

	@Post('customer-data')
	async GetCustomerNames(@Body('customerArray') data: Array<string>) {
		return this.customerService.GetCustomerNamesService(data);
	}

	@Put('lockunlock-transaction/:customer_idx')
	async LockTransaction(
		@Param('customer_idx') customer_idx: string,
		@Body() lockStatus: LockStatusDto,
	) {
		if (!validator.isUUID(customer_idx, 'all')) {
			throw new HttpException('Invalid Idx', HttpStatus.BAD_REQUEST);
		}

		return this.customerService.LockTransactionService(
			customer_idx,
			lockStatus,
		);
	}

	@Post('/bulkFetchUpdateCustomersFromAeon')
	async bulkFetchUpdateCustomersFromAeon(
		@Body() dto: any,
		// @Body('customer') customersCreate: any,
		// @Body('customerCard') customerCardsCreate: any,
		// @Body('customerProfile') customerProfilesCreate: any,
		// @Body('customerU') customersUpdate: any,
		// @Body('customerCardU') customerCardsUpdate: any,
		// @Body('customerProfileU') customerProfilesUpdate: any,
	): Promise<any> {
		if (!dto) {
			return { statusCode: 404, response: 'error' };
		}
		let customerToCreate = [];
		let customerCardsToCreate = [];
		let customerProfilesToCreate = [];
		let customerToUpdate = [];
		let customerCardsToUpdate = [];
		let customerProfilesToUpdate = [];
		let cutomerSuperSet = {};
		let customerNumberSuperset = {};
		let customerBulkQueryInput = [];
		let customerBulkQueryInputFinnone = [];
		let customerNumberBulkQueryInput = [];
		let customerNumberBulkQueryInputApplication = [];
		let pgGlobalObject = {};
		let customerIDArrForCustomerCardCreate = [];
		let customersCreate = dto.customer;
		let customerCardsCreate = dto.customerCard;
		let customerProfilesCreate = dto.customerProfile;
		let customersUpdate = dto.customerU;
		let customerCardsUpdate = dto.customerCardU;
		let customerProfilesUpdate = dto.customerProfileU;
		let qFinnOneresultMerged = [];
		let idVisited = {};
		for (let [key, value] of Object.entries(customersCreate)) {
			cutomerSuperSet[key] = 'true';
		}
		for (let [key, value] of Object.entries(customerCardsCreate)) {
			cutomerSuperSet[key] = value;
		}
		// for(let [key,value] of Object.entries(customerProfilesCreate)){ // change to number
		// 	cutomerSuperSet[key] = 'true';
		// }
		for (let [key, value] of Object.entries(customersUpdate)) {
			cutomerSuperSet[key] = 'true';
		}
		for (let [key, value] of Object.entries(customerCardsUpdate)) {
			cutomerSuperSet[key] = 'true';
		}
		// for(let [key,value] of Object.entries(customerProfilesUpdate)){ // change to number
		// 	cutomerSuperSet[key] = 'true';
		// }

		for (let [key, value] of Object.entries(cutomerSuperSet)) {
			customerBulkQueryInput.push({ CUSTOMER_NUMBER: key });
		}

		const loyalityQueryResult = await this.clientService.checkBulkLoyaltyCustomer(
			customerBulkQueryInput,
		);
		const loyQueryResult = await this.clientService.checkBulkLoyCustomer(
			customerBulkQueryInput,
		);
		if (loyalityQueryResult.length === 0 || loyQueryResult.length === 0) {
			return { statusCode: 404, response: null };
		}
		loyalityQueryResult.forEach(loyDtl => {
			loyQueryResult.forEach(loy => {
				if (loyDtl['CUSTOMER_NUMBER'] === loy['CUSTOMER_NUMBER']) {
					loyDtl['CUSTOMER_NAME'] = loy['CUSTOMER_NAME'];
					loyDtl['EMAIL'] = loy['EMAIL'];
					loyDtl['MEMBERSHIP_ID'] = loy['MEMBERSHIP_ID'];
					loyDtl['CURRENT_MEMBERSHIP_STATUS'] =
						loy['CURRENT_MEMBERSHIP_STATUS'];
					loyDtl['CARD_STATUS'] = loy['CARD_STATUS'];
					loyDtl['MOBILE_NO'] = loy['MOBILE_NO'];
					loyDtl['TOTAL_POINTS'] = loy['TOTAL_POINTS'];
					loyDtl['POINT_ELAPSED'] = loy['POINT_ELAPSED'];
					loyDtl['POINT_REDEMPTION'] = loy['POINT_REDEMPTION'];
				}
			});
		});
		if (loyalityQueryResult) {
			loyalityQueryResult.forEach(element => {
				customerBulkQueryInputFinnone.push({
					CUSTOMER_CIF: element.CUSTOMER_NUMBER,
				});
				pgGlobalObject[element.CUSTOMER_NUMBER] = {
					customer: {},
					customerCard: {},
					customerProfile: {},
					customerNumber: '',
				};
				//Mapping
				let o = this.clientService.createLoyalityMappedObject(element);
				pgGlobalObject[element.CUSTOMER_NUMBER].customer = o.customerObj;
				pgGlobalObject[element.CUSTOMER_NUMBER].customerCard =
					o.customerCardObj;
				pgGlobalObject[element.CUSTOMER_NUMBER].customerProfile =
					o.customerProfileObj;
			});
		}

		// const finnOneBulkCustomerQueryResult = await this.clientService.checkFinnOneBulkCustomer(
		// 	customerBulkQueryInputFinnone,
		// );
		// if (finnOneBulkCustomerQueryResult) {
		// 	finnOneBulkCustomerQueryResult.forEach(element => {
		// 		if (!idVisited[element.CUSTOMER_CIF]) {
		// 			idVisited[element.CUSTOMER_CIF] = 'True';
		// 			qFinnOneresultMerged.push(element);
		// 		} else {
		// 			qFinnOneresultMerged.forEach(elm => {
		// 				if (elm.CUSTOMER_CIF === element.CUSTOMER_CIF) {
		// 					elm.CUSTOMER_NAME = elm.CUSTOMER_NAME
		// 						? elm.CUSTOMER_NAME
		// 						: element.CUSTOMER_NAME;
		// 					elm.Salutation = elm.Salutation
		// 						? elm.Salutation
		// 						: element.Salutation;
		// 					elm.CUSTOMER_TYPE = elm.CUSTOMER_TYPE
		// 						? elm.CUSTOMER_TYPE
		// 						: element.CUSTOMER_TYPE;
		// 					elm.GENDER = elm.GENDER ? elm.GENDER : element.GENDER;
		// 					elm.MARITAL_STATUS = elm.MARITAL_STATUS
		// 						? elm.MARITAL_STATUS
		// 						: element.MARITAL_STATUS;
		// 					elm.INDUSTRY = elm.INDUSTRY ? elm.INDUSTRY : element.INDUSTRY;
		// 					elm.PROFESSION = elm.PROFESSION
		// 						? elm.PROFESSION
		// 						: element.PROFESSION;
		// 					elm.CUSTOMER_CONSTITUTION = elm.CUSTOMER_CONSTITUTION
		// 						? elm.CUSTOMER_CONSTITUTION
		// 						: element.CUSTOMER_CONSTITUTION;
		// 					elm.Primary_Phone_Number = elm.Primary_Phone_Number
		// 						? elm.Primary_Phone_Number
		// 						: element.Primary_Phone_Number;
		// 					elm.Primary_Mobile_Number = elm.Primary_Mobile_Number
		// 						? elm.Primary_Mobile_Number
		// 						: element.Primary_Mobile_Number;
		// 					elm.Primary_Email_Id = elm.Primary_Email_Id
		// 						? elm.Primary_Email_Id
		// 						: element.Primary_Email_Id;
		// 					elm.customerProfile = elm.customerProfile
		// 						? elm.customerProfile
		// 						: element.customerProfile;
		// 					elm.DOB = elm.DOB ? elm.DOB : element.DOB;
		// 					elm.Category = elm.Category ? elm.Category : element.Category;
		// 					elm.Segment = elm.Segment ? elm.Segment : element.Segment;
		// 				}
		// 			});
		// 		}
		// 	});
		// 	qFinnOneresultMerged.forEach(element => {
		// 		//Creating Customer Number Set
		// 		customerNumberSuperset[element.CUSTOMER_CIF] = element.CUSTOMER_CIF;
		// 		//Mapping
		// 		let o = this.clientService.createCustomerMappedObject(
		// 			element,
		// 			pgGlobalObject[element.CUSTOMER_CIF],
		// 		);
		// 		pgGlobalObject[element.CUSTOMER_CIF].customerNumber =
		// 			element.CUSTOMER_CIF;
		// 		pgGlobalObject[element.CUSTOMER_CIF].customer = o.customerObj;
		// 		pgGlobalObject[element.CUSTOMER_CIF].customerCard = o.customerCardObj;
		// 		pgGlobalObject[element.CUSTOMER_CIF].customerProfile =
		// 			o.customerProfileObj;
		// 	});
		// 	//Preparing Customer Number Array
		// 	for (let [key, value] of Object.entries(customerNumberSuperset)) {
		// 		customerNumberBulkQueryInput.push({ CUSTOMER_NUMBER: key });
		// 		customerNumberBulkQueryInputApplication.push({ Neo_CIF_ID: key });
		// 	}
		// } else {
		// 	return {
		// 		statusCode: 404,
		// 		response: 'No Corresponding Finnone Data Found',
		// 	};
		// }

		const finnOneBulkCustomerPhoneQueryResult = await this.clientService.checkFinnOneBulkCustomerPhoneDetails(
			customerNumberBulkQueryInput,
		);
		if (Array.isArray(finnOneBulkCustomerPhoneQueryResult)) {
			finnOneBulkCustomerPhoneQueryResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		} else {
			let o = this.clientService.createMappedObject(
				finnOneBulkCustomerPhoneQueryResult,
				pgGlobalObject[
					customerNumberSuperset[
						finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
					]
				],
			);
			pgGlobalObject[
				customerNumberSuperset[
					finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
				]
			].customer = o.customerObj;
			pgGlobalObject[
				customerNumberSuperset[
					finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
				]
			].customerCard = o.customerCardObj;
			pgGlobalObject[
				customerNumberSuperset[
					finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
				]
			].customerProfile = o.customerProfileObj;
		}

		const finnOneBulkIdentificationDetailsResult = await this.clientService.checkCustomerBulkIdentificationDetails(
			customerNumberBulkQueryInput,
		);
		if (finnOneBulkIdentificationDetailsResult) {
			finnOneBulkIdentificationDetailsResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}

		const finnOneBulkIEmailDetailsResult = await this.clientService.checkCustomerBulkEmailID(
			customerNumberBulkQueryInput,
		);
		if (finnOneBulkIEmailDetailsResult) {
			finnOneBulkIEmailDetailsResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}

		const finnOneBulkAddressDetailsResult = await this.clientService.checkCustomerBulkAddressDetails(
			customerNumberBulkQueryInput,
		);
		if (finnOneBulkAddressDetailsResult) {
			finnOneBulkAddressDetailsResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}
		//Application Information and References logic
		const finnOneBulkApplicationDetailsResult = await this.clientService.checkCustomerBulkApplicationDetails(
			customerNumberBulkQueryInputApplication,
		);

		let applicationDetailsResultSet = {};
		finnOneBulkApplicationDetailsResult.forEach(appDetail => {
			if (!applicationDetailsResultSet[appDetail.Neo_CIF_ID]) {
				applicationDetailsResultSet[appDetail.Neo_CIF_ID] = {};
			}
			if (
				applicationDetailsResultSet[appDetail.Neo_CIF_ID]
					.APPLICATION_RECIEVED_DATE
			) {
				if (
					applicationDetailsResultSet[appDetail.Neo_CIF_ID]
						.APPLICATION_RECIEVED_DATE < appDetail.APPLICATION_RECIEVED_DATE
				) {
					applicationDetailsResultSet[appDetail.Neo_CIF_ID] = appDetail;
				}
			} else {
				applicationDetailsResultSet[appDetail.Neo_CIF_ID] = appDetail;
			}
		});
		let applicationNumberBulkQueryInput = [];
		let appNumberToCIFMap = {};
		for (let [key, value] of Object.entries(applicationDetailsResultSet)) {
			applicationNumberBulkQueryInput.push({
				APPLICATION_NUMBER: value['APPLICATION_NUMBER'],
			});
			appNumberToCIFMap[value['APPLICATION_NUMBER']] = key;
		}

		const finnOneBulkReferencesResult = await this.clientService.checkCustomerBulkReferences(
			applicationNumberBulkQueryInput,
		);
		if (finnOneBulkReferencesResult) {
			finnOneBulkReferencesResult.forEach(element => {
				if (element['Flat_Plot_Number']) {
					element['Flat_Plot_Number'] = element['Address_Line_2']
						? element['Flat_Plot_Number'] + element['Address_Line_2']
						: element['Flat_Plot_Number'];
				}
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[appNumberToCIFMap[element.APPLICATION_NUMBER]],
				);
				pgGlobalObject[appNumberToCIFMap[element.APPLICATION_NUMBER]].customer =
					o.customerObj;
				pgGlobalObject[
					appNumberToCIFMap[element.APPLICATION_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					appNumberToCIFMap[element.APPLICATION_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}
		//Application Information and References logic ends

		for (let [key, value] of Object.entries(pgGlobalObject)) {
			if (customersCreate.hasOwnProperty(key)) {
				customerToCreate.push(value['customer']);
			}
			if (customersUpdate.hasOwnProperty(key)) {
				customerToUpdate.push(value['customer']);
			}
			if (customerProfilesCreate.hasOwnProperty(value['customerNumber'])) {
				customerProfilesToCreate.push(value['customerProfile']);
			}
			if (customerProfilesUpdate.hasOwnProperty(value['customerNumber'])) {
				//CUSTOMER_CIF is being checked here
				customerProfilesToUpdate.push(value['customerProfile']);
			}
			if (customerCardsCreate.hasOwnProperty(key)) {
				value['customerCard']['customer_idx'] = customerCardsCreate[key]['Idx'];
				customerCardsToCreate.push(value['customerCard']);
				customerIDArrForCustomerCardCreate.push(key);
			}
			if (customerCardsUpdate.hasOwnProperty(key)) {
				customerCardsToUpdate.push(value['customerCard']);
			}
		}

		let responseObject = {};
		responseObject[
			'customerCreateJob'
		] = await this.customerService.bulkCustomerCreate(customerToCreate);

		//Fetch new IDX
		for (let idx = 0; idx < customerCardsToCreate.length; idx++) {
			if (!customerCardsToCreate[idx]['customer_idx']) {
				let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
					customerIDArrForCustomerCardCreate[idx],
				);
				if (idxOfCustomer) {
					customerCardsToCreate[idx]['customer_idx'] = idxOfCustomer;
				}
			}
		}

		responseObject[
			'customerUpdateJob'
		] = await this.customerService.bulkCustomerSyncFile(customerToUpdate);

		responseObject[
			'customerProfileCreateJob'
		] = await this.customerService.bulkCustomerProfileCreate(
			customerProfilesToCreate,
		);
		responseObject[
			'customerProfileUpdateJob'
		] = await this.customerService.bulkCustomerProfileSyncFile(
			customerProfilesToUpdate,
		);

		responseObject[
			'customerCardCreateJob'
		] = await this.customerService.bulkCustomerCardCreate(
			customerCardsToCreate,
			customerIDArrForCustomerCardCreate,
		);

		responseObject[
			'customerCardUpdateJob'
		] = await this.customerService.bulkCustomerCardSyncFile(
			customerCardsToUpdate,
		);
		return { statusCode: 200, response: responseObject };
	}

	@Get('/getCustomerIDsFromLoyalityAoen/:id')
	async getCustomerIDsFromLoyalityAoen(
		@Param('id') mode: string,
	): Promise<any> {
		let qresult: any;
		let qresultLoy: any;
		if (mode === '1') {
			qresult = await this.clientService.fetchAllLoyaltyCustomer();
			qresultLoy = await this.clientService.fetchAllLoyCustomer();
		} else {
			qresult = await this.clientService.fetchAllLoyaltyCustomerByRegistrationDate();
			qresultLoy = await this.clientService.fetchAllLoyCustomerByRegistrationDate();
		}

		if (qresult.length === 0 || qresultLoy.length === 0) {
			return { statusCode: 404, response: null };
		}

		//Query for finnone
		console.log(qresult);
		let customerIDCreate = {};
		let customerCardCreate = {};
		let customerProfileCreate = {};
		let customerIDUpdate = {};
		let customerCardUpdate = {};
		let customerProfileUpdate = {};
		let responseObj = {};
		let customerBulkQueryInputF = [];
		let loyaltyResultObject = {};
		let qRemapResultLoyalty = [];
		for (let j = 0; j < qresult.length; j++) {
			let customer = qresult[j];
			loyaltyResultObject[customer.CUSTOMER_NUMBER] = customer;
			customerBulkQueryInputF.push({ CUSTOMER_CIF: customer.CUSTOMER_NUMBER });
		}
		const qFinnOneresult = [];
		// await this.clientService.checkFinnOneBulkCustomer(
		// 	customerBulkQueryInputF,
		// );
		console.log('Finnone result');
		console.log(qFinnOneresult);
		//Remap qresult from Loyalty
		qFinnOneresult.forEach(element => {
			if (element.CUSTOMER_CIF in loyaltyResultObject) {
				let resultObj = loyaltyResultObject[element.CUSTOMER_CIF];
				resultObj['CUSTOMER_CIF'] = element.CUSTOMER_CIF;
				qRemapResultLoyalty.push(resultObj);
			}
		});
		for (let i = 0; i < qRemapResultLoyalty.length; i++) {
			let customer = qRemapResultLoyalty[i];
			const cus = await this.customerService.getCustomerByCIF(
				customer.CUSTOMER_NUMBER,
			);
			if (cus['customer'] === 'false') {
				customerIDCreate[customer.CUSTOMER_NUMBER] = cus['customer'];
			} else if (cus['customer'] === 'true') {
				customerIDUpdate[customer.CUSTOMER_NUMBER] = cus['customer'];
			}

			if (cus['customerCard'] === 'true') {
				customerCardUpdate[customer.CUSTOMER_NUMBER] = cus['customerCard'];
			} else if (cus['customerCard'] === 'false') {
				customerCardCreate[customer.CUSTOMER_NUMBER] = {
					present: cus['customerCard'],
					Idx: cus['customerIdx'],
				};
			}

			if (cus['customerProfile'] === 'true') {
				customerProfileUpdate[customer.CUSTOMER_NUMBER] =
					cus['customerProfile']; //FillFinnone Customer Number here
			} else if (cus['customerProfile'] === 'false') {
				customerProfileCreate[customer.CUSTOMER_NUMBER] =
					cus['customerProfile']; //FillFinnone Customer Number here
			}
			responseObj = {
				customerTableCreate: customerIDCreate,
				customerTableUpdate: customerIDUpdate,
				customerCardTableCreate: customerCardCreate,
				customerCardTableUpdate: customerCardUpdate,
				customerProfileTableCreate: customerProfileCreate,
				customerProfileTableUpdate: customerProfileUpdate,
			};
			console.log(JSON.stringify(responseObj));
		}
		return {
			statusCode: 200,
			response: JSON.stringify(responseObj),
		};
	}

	@Get('/updatecustomerfromloyalityaoen/:id')
	async updateCustomerFromLoyalityAoen(
		@Param('id') customerId: number,
	): Promise<any> {
		let responseObject = {};
		const qresult = await this.clientService.checkLoyaltyCustomer(customerId);
		if (qresult) {
			let customer = {};
			let customerProfile = {};
			let customerCard = {};
			for (const [okey, ovalue] of Object.entries(qresult)) {
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
			const qresultf = {};
			// await this.clientService.checkFinnOneCustomer(
			// 	customer['customer_code'],
			// );

			for (const [okey, ovalue] of Object.entries(qresultf[0])) {
				let matchFound = false;
				for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
					if (!matchFound && okey === key) {
						matchFound = true;
						switch (value['entity'][0]) {
							case 'Customer':
								customer[value['column'][0]] = ovalue;
								if (key === 'CUSTOMER_NAME') {
									let nameValue = '' + ovalue;
									let nameSplit = nameValue.split(' ');
									if (nameSplit.length === 3) {
										customer['first_name'] = nameSplit[0];
										customer['middle_name'] = nameSplit[1];
										customer['last_name'] = nameSplit[2];
									} else if (nameSplit.length === 2) {
										customer['first_name'] = nameSplit[0];
										customer['last_name'] = nameSplit[1];
									} else {
										customer['first_name'] = nameSplit[0];
									}
								}
								break;
							case 'CustomerProfile':
								customerProfile[value['column'][0]] = ovalue;
						}
					}
					if (matchFound) {
						break;
					}
				}
			}

			const q1result = await this.clientService.checkFinnOneCustomerPhoneDetails(
				customerProfile['customer_info_file_number'],
			);

			for (const [okey, ovalue] of Object.entries(q1result)) {
				let matchFound = false;
				for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
					if (!matchFound && okey === key) {
						matchFound = true;
						switch (value['entity'][0]) {
							case 'Customer':
								customer[value['column'][0]] = ovalue;
								break;
							case 'CustomerProfile':
								customerProfile[value['column'][0]] = ovalue;
						}
					}
					if (matchFound) {
						break;
					}
				}
			}

			const q2result = await this.clientService.checkCustomerIdentificationDetails(
				customerProfile['customer_info_file_number'],
			);

			for (const [okey, ovalue] of Object.entries(q2result[0])) {
				let matchFound = false;
				for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
					if (!matchFound && okey === key) {
						matchFound = true;
						switch (value['entity'][0]) {
							case 'Customer':
								customer[value['column'][0]] = ovalue;
								break;
							case 'CustomerProfile':
								customerProfile[value['column'][0]] = ovalue;
						}
					}
					if (matchFound) {
						break;
					}
				}
			}
			const q3result = await this.clientService.checkCustomerEmailID(
				customerProfile['customer_info_file_number'],
			);

			for (const [okey, ovalue] of Object.entries(q3result[0])) {
				let matchFound = false;
				for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
					if (!matchFound && okey === key) {
						matchFound = true;
						switch (value['entity'][0]) {
							case 'Customer':
								customer[value['column'][0]] = ovalue;
								break;
							case 'CustomerProfile':
								customerProfile[value['column'][0]] = ovalue;
						}
					}
					if (matchFound) {
						break;
					}
				}
			}

			const q4result = await this.clientService.checkCustomerAddressDetails(
				customerProfile['customer_info_file_number'],
			);

			for (const [okey, ovalue] of Object.entries(q4result[0])) {
				let matchFound = false;
				for (const [key, value] of Object.entries(FinnOneDBColumnMapping)) {
					if (!matchFound && okey === key) {
						matchFound = true;
						switch (value['entity'][0]) {
							case 'Customer':
								customer[value['column'][0]] = ovalue;
								break;
							case 'CustomerProfile':
								customerProfile[value['column'][0]] = ovalue;
						}
					}
					if (matchFound) {
						break;
					}
				}
			}
			let identificationDetails = await this.customerService.customerCardDetailIdentification(
				qresult,
			);
			if (identificationDetails['customer_to_create'].length > 0) {
				let tempObjectDataArray = [];
				tempObjectDataArray.push(customer);
				responseObject[
					'customerCreateJob'
				] = await this.customerService.bulkCustomerCreate(tempObjectDataArray);
			} else {
				let tempObjectDataArray = [];
				tempObjectDataArray.push(customer);
				responseObject[
					'customerUpdateJob'
				] = await this.customerService.bulkCustomerSyncFile(
					tempObjectDataArray,
				);
			}
			//Fill customer_idx in customerCard
			//TODO:
			let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
				customer['customer_code'],
			);
			if (idxOfCustomer) {
				customerCard['customer_idx'] = idxOfCustomer;
			}
			if (identificationDetails['customer_card_to_create'].length > 0) {
				let tempObjectDataArray = [];
				tempObjectDataArray.push(customerCard);
				responseObject[
					'customerCardCreateJob'
				] = await this.customerService.bulkCustomerCardCreate(
					tempObjectDataArray,
					[customer['customer_code']],
				);
			} else {
				let tempObjectDataArray = [];
				tempObjectDataArray.push(customerCard);
				responseObject[
					'customerCardUpdateJob'
				] = await this.customerService.bulkCustomerCardSyncFile(
					tempObjectDataArray,
				);
			}

			const checkProfile = await this.customerService.checkCustomerProfileByCIF(
				customerProfile['customer_info_file_number'],
			);
			if (!checkProfile) {
				let tempObjectDataArray = [];
				tempObjectDataArray.push(customerProfile);
				responseObject[
					'customerProfileCreateJob'
				] = await this.customerService.bulkCustomerProfileCreate(
					tempObjectDataArray,
				);
			} else {
				let tempObjectDataArray = [];
				tempObjectDataArray.push(customerProfile);
				responseObject[
					'customerProfileUpdateJob'
				] = await this.customerService.bulkCustomerProfileSyncFile(
					tempObjectDataArray,
				);
			}
		} else {
			throw new HttpException('Invalid Id', HttpStatus.BAD_REQUEST);
		}
	}

	@Get('points-history/:customer_idx')
	async LastMonthPointsHistory(
		@Param('customer_idx') customer_idx: string,
		@Query('date') date: string,
	) {
		if (!validator.isUUID(customer_idx, 'all')) {
			throw new HttpException('Invalid Idx', HttpStatus.BAD_REQUEST);
		}
		if (!date) {
			throw new HttpException('Query date is required', HttpStatus.BAD_REQUEST);
		}

		return this.customerService.GetCustomerLastMonthPointsService(
			customer_idx,
			date,
		);
	}

	@Get('/initiateBulkCustomersUpdate/:id')
	async initiateBulkCustomersUpdate(@Param('id') mode: string): Promise<any> {
		let qresult: any;
		let qresultLoy: any;
		if (mode === '1') {
			qresult = await this.clientService.fetchAllLoyaltyCustomer();
			qresultLoy = await this.clientService.fetchAllLoyCustomer();
		} else {
			qresult = await this.clientService.fetchAllLoyaltyCustomerByRegistrationDate();
			qresultLoy = await this.clientService.fetchAllLoyCustomerByRegistrationDate();
		}

		if (qresult.length === 0 || qresultLoy.length === 0) {
			return { statusCode: 404, response: null };
		}

		//Query for finnone
		console.log(qresult);
		let customerIDCreate = {};
		let customerCardCreate = {};
		let customerProfileCreate = {};
		let eMandateCreate = {};
		let eMandateUpdate = {};
		let customerIDUpdate = {};
		let customerCardUpdate = {};
		let customerProfileUpdate = {};
		let responseObj = {};
		let customerBulkQueryInputF = [];
		let loyaltyResultObject = {};
		let qRemapResultLoyalty = [];

		for (let j = 0; j < qresult.length; j++) {
			let customer = qresult[j];
			loyaltyResultObject[customer.CUSTOMER_NUMBER] = customer;
			customerBulkQueryInputF.push({ Neo_CIF_ID: customer.CUSTOMER_NUMBER });
		}
		const qFinnOneresult = await this.clientService.checkFinnOneBulkCustomerNeo(
			customerBulkQueryInputF,
		);
		console.log('Finnone result');
		console.log(qFinnOneresult);
		//Remap qresult from Loyalty
		qFinnOneresult.forEach(element => {
			if (element.Neo_CIF_ID in loyaltyResultObject) {
				let resultObj = loyaltyResultObject[element.Neo_CIF_ID];
				resultObj['CUSTOMER_CIF'] = element.Neo_CIF_ID;
				qRemapResultLoyalty.push(resultObj);
			}
		});
		for (let i = 0; i < qRemapResultLoyalty.length; i++) {
			let customer = qRemapResultLoyalty[i];
			console.log('Initial check for Create/Update scenario');
			console.log(customer.CUSTOMER_NUMBER);
			const cus = await this.customerService.getCustomerByCIF(
				customer.CUSTOMER_NUMBER,
			);
			console.log('Check result for customer number');
			console.log(cus);
			if (cus['customer'] === 'false') {
				customerIDCreate[customer.CUSTOMER_NUMBER] = cus['customer'];
			} else if (cus['customer'] === 'true') {
				customerIDUpdate[customer.CUSTOMER_NUMBER] = cus['customer'];
			}

			if (cus['customerCard'] === 'true') {
				customerCardUpdate[customer.CUSTOMER_NUMBER] = cus['customerCard'];
			} else if (cus['customerCard'] === 'false') {
				customerCardCreate[customer.CUSTOMER_NUMBER] = {
					present: cus['customerCard'],
					Idx: cus['customerIdx'],
				};
			}

			if (cus['customerProfile'] === 'true') {
				customerProfileUpdate[customer.CUSTOMER_NUMBER] =
					cus['customerProfile']; //FillFinnone Customer Number here
			} else if (cus['customerProfile'] === 'false') {
				customerProfileCreate[customer.CUSTOMER_NUMBER] =
					cus['customerProfile']; //FillFinnone Customer Number here
			}

			if (cus['emandate'] === 'true') {
				eMandateUpdate[customer.CUSTOMER_NUMBER] = cus['emandate']; //FillFinnone Customer Number here
			} else if (cus['emandate'] === 'false') {
				eMandateCreate[customer.CUSTOMER_NUMBER] = cus['emandate']; //FillFinnone Customer Number here
			}
		}
		// responseObj = {
		// 	customerTableCreate: customerIDCreate,
		// 	customerTableUpdate: customerIDUpdate,
		// 	customerCardTableCreate: customerCardCreate,
		// 	customerCardTableUpdate: customerCardUpdate,
		// 	customerProfileTableCreate: customerProfileCreate,
		// 	customerProfileTableUpdate: customerProfileUpdate,
		// };
		// console.log(JSON.stringify(responseObj));

		//Update start
		let customerToCreate = [];
		let customerCardsToCreate = [];
		let customerProfilesToCreate = [];
		let emandateToCreate = [];
		let emandateToUpdate = [];
		let customerToUpdate = [];
		let customerCardsToUpdate = [];
		let customerProfilesToUpdate = [];
		let cutomerSuperSet = {};
		let customerNumberSuperset = {};
		let customerBulkQueryInput = [];
		let customerBulkQueryInputFinnone = [];
		let customerBulkQueryInputFinnoneNeo = [];
		let trimCustomerNumberInputFinnone = [];
		let customerNumberBulkQueryInput = [];
		let cifAndIfscMap = {};
		let customerNumberBulkQueryInputApplication = [];
		let pgGlobalObject = {};
		let customerIDArrForCustomerCardCreate = [];
		let customerIDArrForCustomerCardUpdate = [];
		let customerCreatedIDxArray = [];
		let customerIDArrForEMandateCreate = [];
		let customerIDArrForEMandateUpdate = [];
		let customersCreate = customerIDCreate;
		let customerCardsCreate = customerCardCreate;
		let customerProfilesCreate = customerProfileCreate;
		let customersUpdate = customerIDUpdate;
		let customerCardsUpdate = customerCardUpdate;
		let customerProfilesUpdate = customerProfileUpdate;
		let eMandateUpdateDct = eMandateUpdate;
		let eMandateCreateDct = eMandateCreate;

		// let qFinnOneresultMerged = [];
		let idVisited = {};
		for (let [key, value] of Object.entries(customersCreate)) {
			cutomerSuperSet[key] = 'true';
		}
		for (let [key, value] of Object.entries(customerCardsCreate)) {
			cutomerSuperSet[key] = value;
		}
		// for(let [key,value] of Object.entries(customerProfilesCreate)){ // change to number
		// 	cutomerSuperSet[key] = 'true';
		// }
		for (let [key, value] of Object.entries(customersUpdate)) {
			cutomerSuperSet[key] = 'true';
		}
		for (let [key, value] of Object.entries(customerCardsUpdate)) {
			cutomerSuperSet[key] = 'true';
		}

		// for(let [key,value] of Object.entries(customerProfilesUpdate)){ // change to number
		// 	cutomerSuperSet[key] = 'true';
		// }

		for (let [key, value] of Object.entries(cutomerSuperSet)) {
			customerBulkQueryInput.push({ CUSTOMER_NUMBER: key });
			customerNumberBulkQueryInputApplication.push({ Neo_CIF_ID: key });
		}

		let loyalityQueryResult = await this.clientService.checkBulkLoyaltyCustomer(
			customerBulkQueryInput,
		);
		let loyQueryResult = await this.clientService.checkBulkLoyCustomer(
			customerBulkQueryInput,
		);
		if (loyalityQueryResult.length === 0 || loyQueryResult.length === 0) {
			return { statusCode: 404, response: null };
		}

		loyalityQueryResult.forEach(loyDtl => {
			loyQueryResult.forEach(loy => {
				if (loyDtl['CUSTOMER_NUMBER'] === loy['CUSTOMER_NUMBER']) {
					loyDtl['CUSTOMER_NAME'] = loy['CUSTOMER_NAME'];
					loyDtl['EMAIL'] = loy['EMAIL'];
					loyDtl['MEMBERSHIP_ID'] = loy['MEMBERSHIP_ID'];
					loyDtl['CURRENT_MEMBERSHIP_STATUS'] =
						loy['CURRENT_MEMBERSHIP_STATUS'];
					loyDtl['CARD_STATUS'] = loy['CARD_STATUS'];
					loyDtl['MOBILE_NO'] = loy['MOBILE_NO'];
					loyDtl['TOTAL_POINTS'] = loy['TOTAL_POINTS'];
					loyDtl['POINT_ELAPSED'] = loy['POINT_ELAPSED'];
					loyDtl['POINT_REDEMPTION'] = loy['POINT_REDEMPTION'];
				}
			});
		});

		if (loyalityQueryResult) {
			loyalityQueryResult.forEach(element => {
				customerBulkQueryInputFinnone.push({
					CUSTOMER_CIF: element.CUSTOMER_NUMBER,
				});
				customerBulkQueryInputFinnoneNeo.push({
					Neo_CIF_ID: element.CUSTOMER_NUMBER,
				});
				pgGlobalObject[element.CUSTOMER_NUMBER] = {
					customer: {},
					customerCard: {},
					customerProfile: {},
					eMandate: {},
					customerNumber: element.CUSTOMER_NUMBER,
				};
				//Mapping
				let o = this.clientService.createLoyalityMappedObject(element);
				pgGlobalObject[element.CUSTOMER_NUMBER].customer = o.customerObj;
				pgGlobalObject[element.CUSTOMER_NUMBER].customerCard =
					o.customerCardObj;
				pgGlobalObject[element.CUSTOMER_NUMBER].customerProfile =
					o.customerProfileObj;
			});
		}

		let subCustomerNumberSuperSet = {};
		let subCustomerNumberSuperSetInput = [];
		const finnOneBulkCustomerQueryResultNeo = await this.clientService.checkFinnOneBulkCustomerNeo(
			customerBulkQueryInputFinnoneNeo,
		);
		if (finnOneBulkCustomerQueryResultNeo) {
			finnOneBulkCustomerQueryResultNeo.forEach(element => {
				//Creating Customer Number Set
				customerNumberSuperset[element.Neo_CIF_ID] = element.Neo_CIF_ID;
				subCustomerNumberSuperSet[element.CUSTOMER_NUMBER] = element.Neo_CIF_ID;

				element['Identification_Type']='PAN';
				//Mapping
				let o = this.clientService.createCustomerMappedObject(
					element,
					pgGlobalObject[element.Neo_CIF_ID],
				);
				pgGlobalObject[element.Neo_CIF_ID].customerNumber =
					element.Neo_CIF_ID;
				pgGlobalObject[element.Neo_CIF_ID].customer = o.customerObj;
				pgGlobalObject[element.Neo_CIF_ID].customerCard = o.customerCardObj;
				pgGlobalObject[element.Neo_CIF_ID].customerProfile =
					o.customerProfileObj;
				pgGlobalObject[element.Neo_CIF_ID].eMandate = o.eMandateObj;
			});
			//Preparing Customer Number Array
			for (let [key, value] of Object.entries(customerNumberSuperset)) {
				customerNumberBulkQueryInput.push({ CUSTOMER_NUMBER: key });
			}
			//Preparing Customer Number from customer Array
			for (let [key, value] of Object.entries(subCustomerNumberSuperSet)) {
				subCustomerNumberSuperSetInput.push({ CUSTOMER_NUMBER: key });
			}
		} else {
			return {
				statusCode: 404,
				response: 'No Corresponding Finnone Data Found',
			};
		}

		const finnOneBulkCustomerPhoneQueryResult = await this.clientService.checkFinnOneBulkCustomerPhoneDetails(
			customerNumberBulkQueryInput,
		);
		if (Array.isArray(finnOneBulkCustomerPhoneQueryResult)) {
			finnOneBulkCustomerPhoneQueryResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		} else {
			let o = this.clientService.createMappedObject(
				finnOneBulkCustomerPhoneQueryResult,
				pgGlobalObject[
					customerNumberSuperset[
						finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
					]
				],
			);
			pgGlobalObject[
				customerNumberSuperset[
					finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
				]
			].customer = o.customerObj;
			pgGlobalObject[
				customerNumberSuperset[
					finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
				]
			].customerCard = o.customerCardObj;
			pgGlobalObject[
				customerNumberSuperset[
					finnOneBulkCustomerPhoneQueryResult.CUSTOMER_NUMBER
				]
			].customerProfile = o.customerProfileObj;
		}

		const finnOneBulkIdentificationDetailsResult = await this.clientService.checkCustomerBulkIdentificationDetails(
			customerNumberBulkQueryInput,
		);
		if (finnOneBulkIdentificationDetailsResult) {
			finnOneBulkIdentificationDetailsResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}

		const finnOneBulkIEmailDetailsResult = await this.clientService.checkCustomerBulkEmailID(
			customerNumberBulkQueryInput,
		);
		if (finnOneBulkIEmailDetailsResult) {
			finnOneBulkIEmailDetailsResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}

		const finnOneBulkAddressDetailsResult = await this.clientService.checkCustomerBulkAddressDetails(
			customerNumberBulkQueryInput,
		);
		if (finnOneBulkAddressDetailsResult) {
			finnOneBulkAddressDetailsResult.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberSuperset[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberSuperset[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}
		//Application Information and References logic
		const finnOneBulkApplicationDetailsResult = await this.clientService.checkCustomerBulkApplicationDetails(
			customerNumberBulkQueryInputApplication,
		);

		let applicationDetailsResultSet = {};
		finnOneBulkApplicationDetailsResult.forEach(appDetail => {
			if (!applicationDetailsResultSet[appDetail.Neo_CIF_ID]) {
				applicationDetailsResultSet[appDetail.Neo_CIF_ID] = {};
			}
			if (
				applicationDetailsResultSet[appDetail.Neo_CIF_ID]
					.APPLICATION_RECIEVED_DATE
			) {
				if (
					applicationDetailsResultSet[appDetail.Neo_CIF_ID]
						.APPLICATION_RECIEVED_DATE < appDetail.APPLICATION_RECIEVED_DATE
				) {
					applicationDetailsResultSet[appDetail.Neo_CIF_ID] = appDetail;
				}
			} else {
				applicationDetailsResultSet[appDetail.Neo_CIF_ID] = appDetail;
			}
		});
		let applicationNumberBulkQueryInput = [];
		let appNumberToCIFMap = {};
		for (let [key, value] of Object.entries(applicationDetailsResultSet)) {
			applicationNumberBulkQueryInput.push({
				APPLICATION_NUMBER: value['APPLICATION_NUMBER'],
			});
			appNumberToCIFMap[value['APPLICATION_NUMBER']] = key;
		}

		const finnOneBulkReferencesResult = await this.clientService.checkCustomerBulkReferences(
			applicationNumberBulkQueryInput,
		);

		let referencesForApplicationNumber={};
		if (finnOneBulkReferencesResult) {
			finnOneBulkReferencesResult.forEach(element => {
				if (!referencesForApplicationNumber[appNumberToCIFMap[element.APPLICATION_NUMBER]]) {
					referencesForApplicationNumber[appNumberToCIFMap[element.APPLICATION_NUMBER]] = true;
					if (element['Flat_Plot_Number']) {
						element['Flat_Plot_Number'] = element['Address_Line_2']
							? element['Flat_Plot_Number'] + element['Address_Line_2']
							: element['Flat_Plot_Number'];
					}
					let o = this.clientService.createMappedObject(
						element,
						pgGlobalObject[appNumberToCIFMap[element.APPLICATION_NUMBER]],
					);
					pgGlobalObject[appNumberToCIFMap[element.APPLICATION_NUMBER]].customer =
						o.customerObj;
					pgGlobalObject[
						appNumberToCIFMap[element.APPLICATION_NUMBER]
					].customerCard = o.customerCardObj;
					pgGlobalObject[
						appNumberToCIFMap[element.APPLICATION_NUMBER]
					].customerProfile = o.customerProfileObj;
				} else {
					if (element['Flat_Plot_Number']) {
						element['Flat_Plot_Number'] = element['Address_Line_2']
							? element['Flat_Plot_Number'] + element['Address_Line_2']
							: element['Flat_Plot_Number'];
					}
					let o = this.clientService.createReferenceMappedObject(
						element,
						pgGlobalObject[appNumberToCIFMap[element.APPLICATION_NUMBER]],
					);
					pgGlobalObject[appNumberToCIFMap[element.APPLICATION_NUMBER]].customer =
						o.customerObj;
					pgGlobalObject[
						appNumberToCIFMap[element.APPLICATION_NUMBER]
					].customerCard = o.customerCardObj;
					pgGlobalObject[
						appNumberToCIFMap[element.APPLICATION_NUMBER]
					].customerProfile = o.customerProfileObj;
				}
			});
		}
		//Application Information and References logic ends

		//Bank Details Mapping
		const finnOneBulkBankDetails = await this.clientService.checkCustomerBulkInstrumentDetails(
			customerNumberBulkQueryInputApplication,
		);

		if (finnOneBulkBankDetails) {
			finnOneBulkBankDetails.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[element.Neo_CIF_ID],
				);
				pgGlobalObject[element.Neo_CIF_ID].customer = o.customerObj;
				pgGlobalObject[element.Neo_CIF_ID].customerCard = o.customerCardObj;
				pgGlobalObject[element.Neo_CIF_ID].customerProfile =
					o.customerProfileObj;
			});
		}

		const finnOneBulkCommunicationDetailResult= await this.clientService.checkFinnOneBulkCommunicationDetails(
			subCustomerNumberSuperSetInput,
		);
		if (finnOneBulkCommunicationDetailResult) {
			finnOneBulkCommunicationDetailResult.forEach(element => {
				//Mapping
				let o = this.clientService.createCustomerMappedObject(
					element,
					pgGlobalObject[subCustomerNumberSuperSet[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[subCustomerNumberSuperSet[element.CUSTOMER_NUMBER]].customerNumber =
					element.Neo_CIF_ID;
				pgGlobalObject[subCustomerNumberSuperSet[element.CUSTOMER_NUMBER]].customer = o.customerObj;
				pgGlobalObject[subCustomerNumberSuperSet[element.CUSTOMER_NUMBER]].customerCard = o.customerCardObj;
				pgGlobalObject[subCustomerNumberSuperSet[element.CUSTOMER_NUMBER]].customerProfile =
					o.customerProfileObj;
				pgGlobalObject[subCustomerNumberSuperSet[element.CUSTOMER_NUMBER]].eMandate = o.eMandateObj;
			});
		}

		//Address Details Mapping with Customer_Number and Customer_CIF
		const responseObjectFromCustomerMap = await this.clientService.fetchCustomerNumberAndCIFMap(
			customerNumberBulkQueryInputApplication,
		);
		const customerNumberAndCIFMap = responseObjectFromCustomerMap['result'];
		const customerViewResponse = responseObjectFromCustomerMap['customerResponse'];
		//For Address Details, Employment and Income Details
		for (let [key, value] of Object.entries(customerNumberAndCIFMap)) {
			trimCustomerNumberInputFinnone.push({ CUSTOMER_NUMBER: key });
		}
		const addressDetailTrim = await this.clientService.checkAddressDetailsBulk(
			trimCustomerNumberInputFinnone,
		);
		if (addressDetailTrim) {
			addressDetailTrim.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberAndCIFMap[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}

		const incomeDetailsTrim = await this.clientService.checkIncomeDetailsBulk(
			trimCustomerNumberInputFinnone,
		);
		if (incomeDetailsTrim) {
			incomeDetailsTrim.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberAndCIFMap[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}

		const employmentDetailTrimBulk = await this.clientService.checkEmploymentDetailsBulk(
			trimCustomerNumberInputFinnone,
		);
		if (employmentDetailTrimBulk) {
			let employmentDetailTrim = [];
			for(let i=0;i<employmentDetailTrimBulk.length;i++) {
				if (employmentDetailTrimBulk[i]['MAJOR_OCCUPATION']=== 'Yes') {
					let employTempObj = employmentDetailTrimBulk[i];
					if (employTempObj['OCCUPATION_TYPE'] === 'Self Employed Non Professional') {
						employTempObj['YEARS_IN_BUSINESS'] = employTempObj['YEARS_IN_OCCUPATION'];
						delete employTempObj.YEARS_IN_OCCUPATION;
						delete employTempObj.ORGANIZATION_NAME;
						employmentDetailTrim.push(employTempObj);
					} else if (employTempObj['OCCUPATION_TYPE'] === 'Self Employed Professional') {
						customerViewResponse.forEach(customerElm => {
							if (customerElm['CUSTOMER_NUMBER'] === employmentDetailTrimBulk[i]['CUSTOMER_NUMBER']) {
								employTempObj['Nature_of_Profession'] = customerElm['Nature_of_Profession'];
								employTempObj['Registration_Number'] = customerElm['Registration_Number'];
							}
						});
						employTempObj['Work_Experience'] = employTempObj['YEARS_IN_OCCUPATION'];
						delete employTempObj.YEARS_IN_OCCUPATION;
						employmentDetailTrim.push(employTempObj);
					} else {
						delete employTempObj.ORGANIZATION_NAME;
						employmentDetailTrim.push(employTempObj);
					}
					
				}
			}
			employmentDetailTrim.forEach(element => {
				let o = this.clientService.createMappedObject(
					element,
					pgGlobalObject[customerNumberAndCIFMap[element.CUSTOMER_NUMBER]],
				);
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customer = o.customerObj;
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customerCard = o.customerCardObj;
				pgGlobalObject[
					customerNumberAndCIFMap[element.CUSTOMER_NUMBER]
				].customerProfile = o.customerProfileObj;
			});
		}
		//For Address Details, Employment and Income Details - ends
		console.log('Global Prepared Object');
		console.log(pgGlobalObject);
		for (let [key, value] of Object.entries(pgGlobalObject)) {
			if (customersCreate.hasOwnProperty(key)) {
				customerToCreate.push(value['customer']);
			}
			if (customersUpdate.hasOwnProperty(key)) {
				customerToUpdate.push(value['customer']);
			}
			if (customerProfilesCreate.hasOwnProperty(key)) {
				// const custoerAutoId = await this.customerService.getCustomerIdByCIF(
				// 	value['customerNumber'],
				// );
				// value['customerProfile']['customer'] = custoerAutoId;
				console.log('Inside customer profile create scenario');
				console.log(value['customerProfile']);
				customerProfilesToCreate.push(value['customerProfile']);
			}
			if (customerProfilesUpdate.hasOwnProperty(key)) {
				//CUSTOMER_CIF is being checked here
				// const custoerAutoId = await this.customerService.getCustomerIdByCIF(
				// 	value['customerNumber'],
				// );
				// value['customerProfile']['customer'] = custoerAutoId;
				customerProfilesToUpdate.push(value['customerProfile']);
				console.log('Inside customer profile update scenario');
				console.log(value['customerProfile']);
			}
			if (customerCardsCreate.hasOwnProperty(key)) {
				value['customerCard']['customer_idx'] = customerCardsCreate[key]['Idx'];
				customerCardsToCreate.push(value['customerCard']);
				customerIDArrForCustomerCardCreate.push(key);
			}
			if (customerCardsUpdate.hasOwnProperty(key)) {
				customerCardsToUpdate.push(value['customerCard']);
				customerIDArrForCustomerCardUpdate.push(key);
			}
			if (eMandateCreateDct.hasOwnProperty(key)) {
				emandateToCreate.push(value['eMandate']);
				customerIDArrForEMandateCreate.push(key);
			}
			if (eMandateUpdateDct.hasOwnProperty(key)) {
				emandateToUpdate.push(value['eMandate']);
				customerIDArrForEMandateUpdate.push(key);
			}
		}

		console.log('Customer to create');
		console.log(customerToCreate);
		let responseObject = {};
		responseObject[
			'customerCreateJob'
		] = await this.customerService.bulkCustomerCreate(customerToCreate);

		//Fetch Idx Array to update CreditModule and CustomerWallet
		for (let i = 0; i < customerToCreate.length; i++) {
			let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
				customerToCreate[i]['loyalty_customer_number'],
			);
			console.log("IDX FOR ")
			console.log(customerToCreate[i]['loyalty_customer_number'])
			console.log(idxOfCustomer);
			if (idxOfCustomer) {
				customerCreatedIDxArray.push(idxOfCustomer);
			}
		}
		for (let i = 0; i < customerToUpdate.length; i++) {
			let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
				customerToUpdate[i]['loyalty_customer_number'],
			);
			console.log("IDX FOR ");
			console.log(customerToUpdate[i]['loyalty_customer_number'])
			console.log(idxOfCustomer);
			if (idxOfCustomer) {
				customerCreatedIDxArray.push(idxOfCustomer);
			}
		}
		console.log('Customer Created IDX Array');
		console.log(customerCreatedIDxArray);
		//Fetch old IDX
		let customerCardObjectHandler = customerCardsToUpdate.slice();
		customerCardsToUpdate = [];
		for (let idx = 0; idx < customerCardObjectHandler.length; idx++) {
			let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
				customerIDArrForCustomerCardUpdate[idx],
			);
			if (idxOfCustomer) {
				customerCardObjectHandler[idx]['customer_idx'] = idxOfCustomer;
				customerCardsToUpdate.push(customerCardObjectHandler[idx]);
			} else {
				console.log('idx not found for customer' + customerIDArrForCustomerCardUpdate[idx]);
			}
		}
		//Fetch new IDX
		customerCardObjectHandler = customerCardsToCreate.slice();
		customerCardsToCreate = [];
		for (let idx = 0; idx < customerCardObjectHandler.length; idx++) {
			if (!customerCardObjectHandler[idx]['customer_idx']) {
				let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
					customerIDArrForCustomerCardCreate[idx],
				);
				if (idxOfCustomer) {
					customerCardObjectHandler[idx]['customer_idx'] = idxOfCustomer;
					customerCardsToCreate.push(customerCardObjectHandler[idx]);
				} else {
					console.log('idx not found for customer' + customerIDArrForCustomerCardCreate[idx]);
				}
			} else {
				customerCardsToCreate.push(customerCardObjectHandler[idx]);
			}
		}

		//CIF and Ifsc Mapping
		//Match all other ID for Profile
		let customerProfileObjectHandler = customerProfilesToCreate.slice();
		customerProfilesToCreate = [];
		for (let i = 0; i < customerProfileObjectHandler.length; i++) {
			let custoerAutoId = await this.customerService.getCustomerIdByCIF(
				customerProfileObjectHandler[i]['customer_info_file_number']
			);
			if (custoerAutoId !== -1) {
				customerProfileObjectHandler[i]['customer'] = custoerAutoId;
				customerProfilesToCreate.push(customerProfileObjectHandler[i]);
			} else {
				console.log("Customer AutoId not found for CIFN Customer profile to create");
				console.log(customerProfileObjectHandler[i]['customer_info_file_number']);
				console.log(custoerAutoId);
			}
		}
		customerProfileObjectHandler = customerProfilesToUpdate.slice();
		customerProfilesToUpdate = [];
		for (let i = 0; i < customerProfileObjectHandler.length; i++) {
			let custoerAutoId = await this.customerService.getCustomerIdByCIF(
				customerProfileObjectHandler[i]['customer_info_file_number']
			);
			if (custoerAutoId !== -1) {
				customerProfileObjectHandler[i]['customer'] = custoerAutoId;
				customerProfilesToUpdate.push(customerProfileObjectHandler[i]);
			} else {
				console.log("Customer AutoId not found for CIFN customer profile to update");
				console.log(customerProfileObjectHandler[i]['customer_info_file_number']);
				console.log(custoerAutoId);
			}
		}
		console.log('Customer Profile Object');
		console.log(customerProfilesToCreate);
		console.log(customerProfilesToUpdate);
		//Additional Mappings
		customerProfilesToCreate.forEach(element => {
			cifAndIfscMap[element['customer_info_file_number']] = element['ifsc'];
			// if (element['address_type'] === 'Residential Address') {
			// 	element['address1'] =
			// 		element['address_line1'] +
			// 		element['address_line2'] +
			// 		element['address_line3'] +
			// 		element['address_line4'];
			// 	element['land_mark'] = element['land_mark'];
			// 	element['pin_code'] = element['zip_code'];
			// } else if (element['address_type'] === 'Permanent Address') {
			// 	element['permanent_address'] =
			// 		element['address_line1'] +
			// 		element['address_line2'] +
			// 		element['address_line3'] +
			// 		element['address_line4'];
			// 	element['permanent_landmark'] = element['land_mark'];
			// 	element['permanent_pincode'] = element['zip_code'];
			// 	element['permanent_state'] = element['state'];
			// 	element['permanent_residence_status'] = element['accomodation_type'];
			// 	element['accomodation_type'] = '';
			// } else if (element['address_type'] === 'Office/ Business Address') {
			// 	element['office_address'] = element['full_address'];
			// 	element['office_landmark'] = element['land_mark'];
			// 	element['office_pincode'] = element['zip_code'];
			// 	element['office_state'] = element['state'];
			// 	element['office_residence_status'] = element['accomodation_type'];
			// 	element['accomodation_type'] = '';
			// }
		});

		customerProfilesToUpdate.forEach(elm => {
			cifAndIfscMap[elm['customer_info_file_number']] = elm['ifsc'];
		});
		console.log('CIF and IFSC Map');
		console.log(cifAndIfscMap);

		//Fetch old IDX for EMandate
		for (let idx = 0; idx < customerIDArrForEMandateUpdate.length; idx++) {
			let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
				customerIDArrForEMandateUpdate[idx],
			);

			let idxBranch = await this.customerService.getBranchIdx(
				cifAndIfscMap[customerIDArrForEMandateUpdate[idx]],
			);
			if (idxOfCustomer) {
				emandateToUpdate[idx]['customer_idx'] = idxOfCustomer;
			}
			if (idxBranch) {
				emandateToUpdate[idx]['branch_idx'] = idxBranch;
			}
		}
		//Fetch new IDX for EMandate
		for (let idx = 0; idx < customerIDArrForEMandateCreate.length; idx++) {
			let idxOfCustomer = await this.customerService.getCustomerIdxByCIF(
				customerIDArrForEMandateCreate[idx],
			);

			let idxBranch = await this.customerService.getBranchIdx(
				cifAndIfscMap[customerIDArrForEMandateCreate[idx]],
			);

			if (idxOfCustomer) {
				emandateToCreate[idx]['customer_idx'] = idxOfCustomer;
			}

			if (idxBranch) {
				emandateToCreate[idx]['branch_idx'] = idxBranch;
			}
		}

		console.log('Customer to Update');
		console.log(customerToUpdate);
		responseObject[
			'customerUpdateJob'
		] = await this.customerService.bulkCustomerSyncFile(customerToUpdate);

		console.log('Customer Profile to create');
		console.log(customerProfilesToCreate);
		responseObject[
			'customerProfileCreateJob'
		] = await this.customerService.bulkCustomerProfileCreate(
			customerProfilesToCreate,
		);
		console.log('Customer Profile to update');
		console.log(customerProfilesToUpdate);
		responseObject[
			'customerProfileUpdateJob'
		] = await this.customerService.bulkCustomerProfileSyncFile(
			customerProfilesToUpdate,
		);
		console.log('Customer Card to create');
		console.log(customerCardsToCreate);
		responseObject[
			'customerCardCreateJob'
		] = await this.customerService.bulkCustomerCardCreate(
			customerCardsToCreate,
			customerIDArrForCustomerCardCreate,
		);
		console.log('Customer Card to update');
		console.log(customerCardsToUpdate);
		responseObject[
			'customerCardUpdateJob'
		] = await this.customerService.bulkCustomerCardSyncFile(
			customerCardsToUpdate,
		);
		console.log('CreditModule to create');
		console.log(customerCreatedIDxArray);
		responseObject[
			'CreditModuleCreateJob'
		] = await this.customerService.bulkCreditModuleCreate(
			customerCreatedIDxArray,
		);

		console.log('Customer Wallet to create');
		console.log(customerCreatedIDxArray);
		responseObject[
			'CustomerWalletCreateJob'
		] = await this.customerService.bulkCustomerWalletCreate(
			customerCreatedIDxArray,
		);

		console.log('Emandate to create');
		console.log(emandateToCreate);
		try {
			responseObject[
				'emandateCreateJob'
			] = await this.customerService.bulkEMandateCreate(emandateToCreate);
		}
		catch(e) {
			console.log(e);
		}
		console.log('Emandate to update');
		console.log(emandateToUpdate);
		try {
			responseObject[
				'emandateUpdateJob'
			] = await this.customerService.bulkEMandateSyncFile(emandateToUpdate);
		}
		catch(e) {
			console.log(e);
		}
		return { statusCode: 200, response: responseObject };
	}
}