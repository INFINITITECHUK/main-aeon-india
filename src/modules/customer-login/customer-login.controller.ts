/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ValidDate } from '@common/ValidDate.validator';
import config from '@config/index';
import { AmountDto } from '@dtos/Amount.dto';
import { ApproveRejectDto } from '@dtos/ApproveReject.dto';
import { ChangeMobileNumberByCustomerDto } from '@dtos/ChangeMobileNumberByCustomer.dto';
import { ChangeMpinDto } from '@dtos/ChangeMpin.dto';
import { CipherDecryptDto } from '@dtos/Cipher.dto';
import { CreateNewPLPaymentDto } from '@dtos/CreateNewPLPayment.dto';
import { CreateNewRLPaymentDto } from '@dtos/CreateNewRLPayment.dto';
import { CreateNewTransaction } from '@dtos/CreateNewTransaction.dto';
import { CustomerLoginDto } from '@dtos/CustomerLogin.dto';
import { CustomerLoginValidateDTO } from '@dtos/CutsomerLoginValidate.dto';
import { EnterMpinDto } from '@dtos/EnterMpin.dto';
import { LoginWithPasswordDto } from '@dtos/LoginWithPassword.dto';
import { QRAmount } from '@dtos/QRamount.dto';
import { SetMpinDto } from '@dtos/SetMpin.dto';
import { SetMpinAfterForgetDto } from '@dtos/SetMpinAfterForget.dto';
import { SetSecurityQuestionDto } from '@dtos/SetSecurityQuestion.dto';
import { UpdateAddressProofDto } from '@dtos/UpdateAddressProof.dto';
import { UpdateCurrentAddressDto } from '@dtos/UpdateCurrentAddressDto.dto';
import { UpdateMandateDto } from '@dtos/UpdateMandateDto.dto';
import { UpdateMyProfileDto } from '@dtos/UpdateMyProfile.dto';
import { UpdatePersonalInfoDto } from '@dtos/UpdatePersonalInfoDto.dto';
import { UpdateTermsAndConditionsDto } from '@dtos/UpdateTermsAndConditionsDto.dto';
import { UpdateWorkDetailsDto } from '@dtos/UpdateWorkDetailsDto.dto';
import { UploadFilesDTO } from '@dtos/UploadFiles.dto';
import { ValidatePanNoDto } from '@dtos/ValidatePanNo.dto';
import { MembershipUpdateFlag } from '@dtos/MembershipUpdateFlag.dto';
import { VerifyForgetMpinOtpDto } from '@dtos/VerifyForgetMpinOtp.dto';
import { ActivityLog } from '@entities/ActivityLog';
import { Customer } from '@entities/customer.entity';
import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Get,
	Headers,
	HttpException,
	HttpStatus,
	Inject,
	Logger,
	Param,
	Post,
	Put,
	Query,
	Request,
	Res,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import {
	ImageFileFilter,
	ImageAndPdfFileFilter,
} from '@utils/file-upload.utils';
import {
	Axios,
	checkForFailedMpin,
	fileName,
	LogOperation,
	validateUUIDwithMessage,
	cleanData,
} from '@utils/helpers';
import { IsNotEmpty, Matches, Validate } from 'class-validator';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { getConnection, getRepository, Repository } from 'typeorm';
import { CustomerLoginService } from './customer-login.service';
import { CreditUpdateApiService } from '@modules/customer-login/credit-update.api.service';
import { CustomerRlApplicationApiService } from '@modules/customer-login/customer-rl-application.api.service';
import { RLApplicationDto } from '@dtos/RLApplication.dto';
import { EmandateStatusSetDto } from '@dtos/EmandateStatusSet.dto';
import { ValidateInitialTermsDto } from './../../dtos/ValidateInitialTerms.dto';
import { WithdrawlDto, WithdrawlInfoDto } from '@dtos/Withdrawl.dto';
import { CustomerService } from '../customer/customer.service';
import moment = require('moment');
import { CustomerRlService } from '@modules/customer-login/customer-rl.service';
const uuid = require('uuid').v4;

class BilledReportYear {
	@IsNotEmpty({ message: 'Year is required' })
	year: string;

	@IsNotEmpty({ message: 'Month is required' })
	month: string;
}

// tslint:disable-next-line: max-classes-per-file
class DateValidation {
	@IsNotEmpty({ message: 'Date is required' })
	@Matches(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/, {
		message: 'Date must be of format yyyy-mm-dd',
	})
	@Validate(ValidDate, {
		message: 'Value is not a valid date!!',
	})
	date: string;
}

@Controller('customer-login')
export class CustomerLoginController {
	constructor(
		private readonly customerLoginService: CustomerLoginService,
		private readonly customerRlApplicationApiService: CustomerRlApplicationApiService,
		private readonly creditUpdateApiService: CreditUpdateApiService,
		@Inject(MINIO_CONNECTION) private readonly minioClient,
		@InjectRepository(ActivityLog)
		private readonly activityLogRepo: Repository<ActivityLog>,
		@InjectRepository(Customer)
		private readonly customerRepo: Repository<Customer>,
		private readonly customerService: CustomerService,
		private readonly customerRLService: CustomerRlService,
	) {}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('getotp')
	async getOtp(@Body() customerLogin: CustomerLoginDto) {
		return this.customerLoginService.getOtp(customerLogin);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('login')
	async loginWithPassword(
		@Body() loginWithPasswordData: LoginWithPasswordDto,
		@Headers() Device: { device: string },
	) {
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceIdAndUser(
			loginWithPasswordData.phone_ext,
			loginWithPasswordData.mobile_number,
			Device.device,
		);

		const [
			payload,
			customerProfileExist,
		]: any = await this.customerLoginService.loginWithPasswordService(
			getIdxAndCheckDeviceId,
			loginWithPasswordData,
			Device.device,
		);

		return {
			message: 'Successfully signed in',
			accesstoken: await this.customerLoginService.JwtSign(payload),
			status: HttpStatus.OK,
			mpin_set: customerProfileExist.is_mpin_set,
			first_name: customerProfileExist.first_name,
			idx: customerProfileExist.idx,
			last_name: customerProfileExist.last_name,
			is_panno_verified: customerProfileExist.is_panno_verified,
			is_initial_terms_agreed: customerProfileExist.is_initial_terms_agreed,
			is_security_set: customerProfileExist.is_security_set,
			is_password_set: customerProfileExist.is_password_set,
			is_mpin_reset: customerProfileExist.is_mpin_reset,
		};
	}

	@Get('get-rl-application-status')
	async getRLApplicationStatus(
		@Headers('authorization') auth: any,
		@Headers() Device: any,
	) {
		if (!auth) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = auth.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerRlApplicationApiService.getRLApplicationStatus(
			getIdxAndCheckDeviceId,
		);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('emandate-set-status')
	async emandateStatusSet(
		@Headers('authorization') auth: any,
		@Headers() Device: any,
		@Body() emandateStatusSetDto: EmandateStatusSetDto,
	) {
		if (!auth) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = auth.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerRlApplicationApiService.emandateStatusSet(
			emandateStatusSetDto,
			getIdxAndCheckDeviceId,
		);
	}

	@Get('balance')
	async GetBalance(
		@Headers('authorization') auth: any,
		@Headers() Device: any,
	) {
		if (!auth) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = auth.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		try {
			const response = await Axios.post(`${process.env.GET_CUSTOMER_BALANCE}`, {
				idx: getIdxAndCheckDeviceId,
			});

			if (response.status === 200 || response.status === 201) {
				return response.data;
			}
		} catch (e) {
			Logger.log(e.response.data);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('edit-profile')
	async EditPut(@Headers('authorization') auth: any, @Headers() Device: any) {
		if (!auth) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = auth.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const customer = await this.customerLoginService.getMyProfile(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.EditProfile(customer.customer_code);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('reward-info')
	async info(@Headers('authorization') auth: any, @Headers() Device: any) {
		if (!auth) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = auth.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.rewardInfo(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('emi-repayment-details')
	async GetEMIPaymentDetails(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const customer = await this.customerLoginService.getMyProfile(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetEmiRepaymentDetails(
			customer.customer_code,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('rl-repayment-details')
	async GetRlPaymentDetails(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const customer = await this.customerLoginService.getMyProfile(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.getRlRepayment(customer.customer_code);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('validateotp')
	async validateOtpAndLogin(
		@Body() validateCustomerLogin: CustomerLoginValidateDTO,
		@Headers() Device: { device: string },
	) {
		const [
			payload,
			customerProfileExist,
		]: any = await this.customerLoginService.validateOtp(
			validateCustomerLogin,
			Device.device,
		);

		return {
			message: 'Successfully signed in',
			accesstoken: await this.customerLoginService.JwtSign(payload),
			status: HttpStatus.OK,
			mpin_set: customerProfileExist.is_mpin_set,
			first_name: customerProfileExist.first_name,
			idx: customerProfileExist.idx,
			last_name: customerProfileExist.last_name,
			is_panno_verified: customerProfileExist.is_panno_verified,
			is_initial_terms_agreed: customerProfileExist.is_initial_terms_agreed,
			is_security_set: customerProfileExist.is_security_set,
			is_mpin_reset: customerProfileExist.is_mpin_reset,
		};
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('validatepanno')
	async validatePanNo(
		@Body() validatePanNo: ValidatePanNoDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		return this.customerLoginService.validatePanNo(validatePanNo);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('change-initial-terms')
	async changeInitialTerms(
		@Body() validateInitialTerms: ValidateInitialTermsDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		return this.customerLoginService.validateInitialTermsService(
			validateInitialTerms,
			getIdxAndCheckDeviceId,
		);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('change-mpin')
	async ChangeMpin(
		@Body() data: ChangeMpinDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const customer = await getConnection().getRepository(Customer).findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		// const customerLog = {
		// 	user: `${customer.first_name}${
		// 		customer.middle_name ? customer.middle_name : ' '
		// 	}${customer.last_name}`,
		// 	action: 'change mpin',
		// 	action_message: 'Customer requested to change mpin',
		// 	date_time: `${new Date().toISOString()}`,
		// };

		// await this.customerLoginService.logCustomer(customerLog);

		if (!customer.is_mpin_set) {
			throw new HttpException(
				{
					message: 'operations.MPIN_NOT_SET_YET',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (data.newPin !== data.confirmPin) {
			throw new HttpException(
				{
					message: 'operations.OOPS_MPIN',
					sub: 'operations.INVALID_CONFIRM_MPIN',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		if (data.newPin === data.currentPin) {
			throw new HttpException(
				{
					message: 'operations.NEW_CURRENT_DIFFERENT_MPIN',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			const response = await Axios.post(`${process.env.CHANGE_MPIN_URL}`, {
				currentPin: data.currentPin,
				newPin: data.newPin,
				confirmPin: data.confirmPin,
				idx: getIdxAndCheckDeviceId,
			});
			if (response.status === 200 || response.status === 201) {
				await LogOperation(customer, Device.device, 'CHANGE_MPIN');

				await this.customerRepo.update(
					{ is_obsolete: false, idx: getIdxAndCheckDeviceId },
					{
						// is_mpin_reset: false,
						is_mpin_set: true,
					},
				);

				return response.data;
			}
		} catch (e) {
			Logger.log(e.response.data);

			if (e.response) {
				if (e.response.status === HttpStatus.UNAUTHORIZED) {
					await checkForFailedMpin(
						customer,
						Device.device,
						'',
						'MOBILE',
						'CHANGE_MPIN',
					);
				}

				throw new HttpException(e.response.data, e.response.status);
			}

			throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('withdrawl-info')
	async withrawInfo(
		@Body() dto: WithdrawlInfoDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		try {
			const response = await Axios.post(
				`${process.env.CUSTOMER_WITHDRAWL_INFO}`,
				{
					amount: dto.amount,
					idx: getIdxAndCheckDeviceId,
				},
			);
			return response.data;
		} catch (e) {
			Logger.log(e.response.data);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('setMpin')
	async setMPIN(
		@Body() pin: SetMpinDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (pin.mpin !== pin.confirm_mpin) {
			throw new HttpException(
				{
					message: 'operations.OOPS_MPIN',
					sub: 'operations.INVALID_CONFIRM_MPIN',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		const checkIsMPINsetAndDeviceId = await this.customerLoginService.checkMPINset(
			getIdxAndCheckDeviceId,
		);
		const checkPanNoVerified = await this.customerLoginService.checkPanNoVerified(
			getIdxAndCheckDeviceId,
		);
		if (checkPanNoVerified === 'False') {
			throw new HttpException(
				{
					message: 'operations.PANNO_NOT_VERIFIED_YET',
				},
				HttpStatus.BAD_REQUEST,
			);
		}
		if (checkIsMPINsetAndDeviceId === 'True') {
			throw new HttpException(
				{
					message: 'operations.MPIN_ALREADY_SET',
				},
				HttpStatus.BAD_REQUEST,
			);
		} else {
			try {
				const response = await Axios.post(
					`${process.env.SET_MPIN_CUSTOMER_URL}`,
					{
						mpin: pin.mpin,
						confirm_mpin: pin.confirm_mpin,
						idx: getIdxAndCheckDeviceId,
					},
				);
				if (response.data.message === 'success') {
					return this.customerLoginService.changeIsMpinSet(request.headers);
				}
			} catch (e) {
				Logger.log(e.response.data);
				throw new HttpException(e.response.data, e.response.status);
			}
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('entermpin')
	async enterMPIN(
		@Body() pin: EnterMpinDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		const checkIsMPINsetAndDeviceId = await this.customerLoginService.checkMPINset(
			getIdxAndCheckDeviceId,
		);

		if (checkIsMPINsetAndDeviceId === 'False') {
			throw new HttpException(
				{
					message: 'operations.MPIN_NOT_SET_YET',
				},
				HttpStatus.FORBIDDEN,
			);
		} else {
			try {
				const response = await Axios.post(`${process.env.CHECK_MPIN}`, {
					mpin: pin.mpin,
					idx: getIdxAndCheckDeviceId,
				});

				if (response.data === false) {
					const customer = await getConnection()
						.getRepository(Customer)
						.findOne({
							idx: getIdxAndCheckDeviceId,
							is_obsolete: false,
						});

					await checkForFailedMpin(
						customer,
						Device.device,
						'',
						'MOBILE',
						'ENTER_MPIN',
					);

					//not verified
					throw new HttpException(
						{
							message: 'operations.INVALID_MPIN_ENTERED',
						},
						HttpStatus.BAD_REQUEST,
					);
				}
				if (response.data === true) {
					const customer = await this.customerRepo.findOne({
						idx: getIdxAndCheckDeviceId,
						is_obsolete: false,
					});

					const findCustomerLog = await this.activityLogRepo.findOne({
						user_id: customer,
						is_obsolete: false,
					});

					if (findCustomerLog) {
						await this.activityLogRepo.update(
							{
								user_id: customer,
								is_obsolete: false,
							},
							{ is_obsolete: true },
						);
					}
					throw new HttpException('Success', HttpStatus.OK);
				}
			} catch (e) {
				throw new HttpException(e.response, e.status);
			}
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('changemobilenumber')
	async changeMobileNumber(
		@Body() data: ChangeMobileNumberByCustomerDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		const customer = await getConnection().getRepository(Customer).findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const response = await Axios.post(`${process.env.CHECK_MPIN}`, {
			mpin: data.mpin,
			idx: getIdxAndCheckDeviceId,
		});

		if (response.data === false) {
			await checkForFailedMpin(
				customer,
				Device.device,
				'',
				'MOBILE',
				'ENTER_MPIN',
			);

			// not verified
			throw new HttpException(
				{
					message: 'operations.INVALID_MPIN_ENTERED',
				},
				HttpStatus.BAD_REQUEST,
			);
		}

		return this.customerLoginService.changeMyMobileNumberService(
			getIdxAndCheckDeviceId,
			data,
		);
	}

	@Put('update-customer')
	@UseInterceptors(
		FileFieldsInterceptor([{ name: 'profile_picture', maxCount: 1 }], {
			limits: {
				fileSize: 500 * 1024,
			},
			fileFilter: ImageFileFilter,
		}),
	)
	@UseGuards(AuthGuard('jwt'))
	async UpdateCustomer(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@UploadedFiles() files,
		@Body() data: UpdateMyProfileDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const fileNames: Array<string> = [];

		if (files) {
			for (const [key, value] of Object.entries(files)) {
				// @ts-ignore
				const currentFile = value.pop();
				const currentFileName = fileName(currentFile.originalname);

				await this.minioClient.putObject(
					config.bucketName,
					currentFileName,
					currentFile.buffer,
				);
				fileNames.push(currentFileName);
			}
			const uploaded_profile_pic = fileNames[0];

			data.profile_picture = uploaded_profile_pic;
		}

		return this.customerLoginService.updateMyProfile(
			getIdxAndCheckDeviceId,
			data,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('load-credit')
	async loadCustomerCredit(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const response = await Axios.post(`${process.env.LOAD_CREDIT_URL}`, {
			idx: getIdxAndCheckDeviceId,
		});

		if (response.status === 200 || response.status === 201) {
			return {
				balance: response.data.balance,
				status: HttpStatus.OK,
			};
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('qr')
	async getQR(
		@Request() request: Request,
		@Body() amount: QRAmount,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		Logger.log('Header: ', header);
		Logger.log('amount: ' + amount);
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		Logger.log('getIdxAndCheckDeviceId: ', getIdxAndCheckDeviceId);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		const customer = await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);
		//checks if transaction is locked or not
		await this.customerLoginService.CheckTransactionLockedSevice(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.QRCodeWithdrawlResponse(
			getIdxAndCheckDeviceId,
			amount,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('cashWithdrawl')
	async cashWithdrawl(
		@Request() request: Request,
		@Body() data: WithdrawlDto,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		const customer = await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		//check if customer has the limit
		if (parseFloat(customer.available_limit) < parseFloat(data.amount)){
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.NOT_ENOUGH_BALANCE',
				},
				HttpStatus.FORBIDDEN,
			);
		}


		//checks if transaction is locked or not
		await this.customerLoginService.CheckTransactionLockedSevice(
			getIdxAndCheckDeviceId,
		);

		//checks if card status is locked or not
		await this.customerLoginService.CheckCardStatus(getIdxAndCheckDeviceId);

		// return this.customerLoginService.QRcodeResponse(
		// 	getIdxAndCheckDeviceId,
		// 	amount,
		// );
		try {
			const response = await Axios.post(
				`${process.env.CUSTOMER_WITHDRAWL_TRANSACTION}`,
				{
					customer_idx: customer.idx,
					amount: data.amount,
					idx: getIdxAndCheckDeviceId,
				},
			);

			Logger.log(response.data);
			if (response.status === 200 || response.status === 201) {
				await LogOperation(customer, Device.device, 'TRANSACTION');

				this.creditUpdateApiService.cashWithdrawl(data.amount, customer);

				const { total_sanctioned_limit, total_received_amount } = customer;

				const total_disburse_amount =
					response.data.transaction_details.totalDisburseAmount;

				// const availableLimit =
				// 	Number(total_sanctioned_limit) +
				// 	Number(total_received_amount) -
				// 	Number(total_disburse_amount);

				await this.customerRepo.update(
					{
						idx: customer.idx,
						is_obsolete: false,
					},
					{
						total_disburse_amount,
						available_limit: `${
							parseFloat(customer.available_limit) - parseFloat(data.amount)
						}`,
						limit_update_date: new Date().toISOString(),
						modified_on: new Date().toISOString(),
					},
				);

				//send notification here
				const getTemplateByActionAliasCustomer = await Axios.get(
					`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}amount_debited`,
				);

				const requiredTemplateCustomer =
					getTemplateByActionAliasCustomer.data.action_message;
				const requiredMessageToSendForCustomer = requiredTemplateCustomer.replace(
					'<Amount>',
					`${data.amount}`,
				);

				const customerResponse: any = await Axios.post(
					`${process.env.SEND_MEMBER_NOTIFICATION}`,
					{
						action_alias: 'amount_debited',
						customers: [
							{
								idx: getIdxAndCheckDeviceId,
								message: `${requiredMessageToSendForCustomer}`,
							},
						],
					},
				);

				return response.data;
			}
		} catch (e) {
			Logger.log(e.response);
			console.log(e);
			if (e.response) {
				if (e.response.status === HttpStatus.UNAUTHORIZED) {
					await checkForFailedMpin(
						customer,
						Device.device,
						'',
						'MOBILE',
						'TRANSACTION',
					);
				}
				throw new HttpException(e.response.data, e.response.status);
			}
			throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// @UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('transaction')
	async transaction(
		@Body() newTransaction: CreateNewTransaction,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		console.log('getIdxAndCheckDeviceId: ', getIdxAndCheckDeviceId);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const customer = await getConnection().getRepository(Customer).findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		console.log('customer: ', customer);
		if (!customer.is_active) {
			throw new HttpException(
				{
					message: 'operations.OOPS',
					sub: 'operations.CUSTOMER_BLOCKED',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		validateUUIDwithMessage(newTransaction.merchant_idx, 'merchant idx');

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		// checks if transaction is locked or not
		await this.customerLoginService.CheckTransactionLockedSevice(
			getIdxAndCheckDeviceId,
		);

		//checks if card status is locked or not
		await this.customerLoginService.CheckCardStatus(getIdxAndCheckDeviceId);

		try {
			const response = await Axios.post(
				`${process.env.CUSTOMER_TRANSACTION_CREATE}`,
				{
					new_transaction: newTransaction,
					initiator: 'Customer',
					idx: getIdxAndCheckDeviceId,
				},
			);

			Logger.log(response.data);
			Logger.log(response.status);
			if (response.status === 200 || response.status === 201) {
				await LogOperation(customer, Device.device, 'TRANSACTION');

				this.creditUpdateApiService.qrUpdate(
					newTransaction.borrowed_amount,
					customer,
					newTransaction.merchant_idx,
				);

				const { total_sanctioned_limit, total_received_amount } = customer;

				const total_disburse_amount =
					response.data.transaction_details.totalDisburseAmount;

				const availableLimit =
					Number(total_sanctioned_limit) +
					Number(total_received_amount) -
					Number(total_disburse_amount);

				await getRepository(Customer).update(
					{ idx: getIdxAndCheckDeviceId },
					{
						total_disburse_amount,
						available_limit: String(availableLimit),
						limit_update_date: new Date().toISOString(),
					},
				);

				//send notification here

				const getTemplateByActionAliasForMerchant = await Axios.get(
					`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}send_merchant_payment_merchant`,
				);

				const requiredTemplateForMerchant =
					getTemplateByActionAliasForMerchant.data.action_message;
				const requiredMessageToSendForMerchant = requiredTemplateForMerchant.replace(
					'<Amount>',
					`${newTransaction.borrowed_amount}`,
				);

				const getTemplateByActionAliasCustomer = await Axios.get(
					`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}send_merchant_payment_customer`,
				);

				const requiredTemplateCustomer =
					getTemplateByActionAliasCustomer.data.action_message;
				const requiredMessageToSendForCustomer = requiredTemplateCustomer.replace(
					'<Amount>',
					`${newTransaction.borrowed_amount}`,
				);

				const merchantResponse: any = await Axios.post(
					`${process.env.SEND_MEMBER_NOTIFICATION}`,
					{
						action_alias: 'send_merchant_payment_merchant',
						merchants: [
							{
								idx: newTransaction.merchant_idx,
								message: `${requiredMessageToSendForMerchant}`,
							},
						],
					},
				);
				const customerResponse: any = await Axios.post(
					`${process.env.SEND_MEMBER_NOTIFICATION}`,
					{
						action_alias: 'send_merchant_payment_customer',
						customers: [
							{
								idx: getIdxAndCheckDeviceId,
								message: `${requiredMessageToSendForCustomer}`,
							},
						],
					},
				);

				return response.data;
			}
		} catch (e) {
			console.log('e: ', e);
			if (e.code == 'ECONNREFUSED') {
				throw new HttpException(e.code, HttpStatus.SERVICE_UNAVAILABLE);
			} else if (e.response) {
				if (e.response.status === HttpStatus.UNAUTHORIZED) {
					await checkForFailedMpin(
						customer,
						Device.device,
						'',
						'MOBILE',
						'TRANSACTION',
					);
				} else if (e.response == 'Not Found') {
					throw new HttpException(
						e.status.data,
						HttpStatus.INTERNAL_SERVER_ERROR,
					);
				} else
					throw new HttpException(e.response.data.message, e.response.status);
			}
			throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('payment')
	async payment(@Body() newPayment: any, @Request() request: Request) {
		const response = await Axios.post(`${process.env.CUSTOMER_PAYMENT}`, {
			new_payment: newPayment,
			initiator: 'Customer',
			header: request.headers,
		});
		if (response.data === 'PA less than MA') {
			return new HttpException(
				'Paid amount less than minimum due amount',
				HttpStatus.BAD_REQUEST,
			);
		}
		if (response.data === 'New Payment Complete') {
			return new HttpException('Payment complete', HttpStatus.OK);
		}
		if (response.data === 'Merchant Profile Not Found') {
			return new HttpException(
				'Merchant Profile Not Found',
				HttpStatus.NOT_FOUND,
			);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('rl-repayment')
	async RLPayPayment(
		@Body() newPayment: CreateNewRLPaymentDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const customer = await this.customerLoginService.getMyProfile(
			getIdxAndCheckDeviceId,
		);
		Logger.log(customer);

		const total_amount = newPayment.payment.reduce((prev, cur) => {
			return prev + cur.amount;
		}, 0);

		try {
			const response = await Axios.post(`${process.env.RL_PAYMENT}`, {
				new_payment: newPayment,
				initiator: 'Customer',
				email: customer.email,
				mobile_number: customer.mobile_number,
				mobile_number_ext: customer.mobile_number_ext,
				customer_code: customer.customer_code,
				txn_amount: total_amount,
				txn_currency: 'INR',
				customer_idx: getIdxAndCheckDeviceId,
				transaction_medium: 'mobile',
			});

			Logger.log(response.data);
			if (response.status === 200 || response.status === 201) {
				return response.data;
			}
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('current-minimum')
	async GetCurentMinimum(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);
		try {
			const response = await Axios.get(
				`${process.env.GET_CURRENT_MINIMUM}${getIdxAndCheckDeviceId}`,
			);

			Logger.log(response.data);
			if (response.status === 200 || response.status === 201) {
				return response.data;
			}
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('pl-repayment')
	async PLPayPayment(
		@Body() newPayment: CreateNewPLPaymentDto,
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const customer = await this.customerLoginService.getMyProfile(
			getIdxAndCheckDeviceId,
		);
		Logger.log(customer);

		const total_amount = newPayment.payment.reduce((prev, cur) => {
			return prev + cur.amount;
		}, 0);

		try {
			const response = await Axios.post(`${process.env.PL_PAYMENT}`, {
				new_payment: newPayment,
				initiator: 'Customer',
				email: customer.email,
				mobile_number: customer.mobile_number,
				mobile_number_ext: customer.mobile_number_ext,
				customer_code: customer.customer_code,
				txn_amount: total_amount,
				txn_currency: 'INR',
				customer_idx: getIdxAndCheckDeviceId,
				transaction_medium: 'mobile',
			});

			Logger.log(response.data);
			if (response.status === 200 || response.status === 201) {
				return response.data;
			}
		} catch (e) {
			Logger.log(e.response.data);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@UsePipes(
		new ValidationPipe({
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	)
	@Get('billed-report')
	async GetBilledReport(
		@Query() test: BilledReportYear,
		@Request() request: Request,
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const offset = limit * (page - 1);
		const responseData = await Axios.post(`${process.env.BILLED_AMOUNT}`, {
			test,
			limit,
			offset,
			page,
			idx: getIdxAndCheckDeviceId,
		});
		if (responseData.data === 'False') {
			return new HttpException('NO BILLED REPORT FOUND', HttpStatus.NOT_FOUND);
		}
		return responseData.data;
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('unbilled-report')
	@UsePipes(
		new ValidationPipe({
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	)
	async UnbilledReport(
		@Query() date: DateValidation,
		@Request() request: Request,
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const offset = limit * (page - 1);
		const responseData = await Axios.post(`${process.env.UNBILLED_AMOUNT}`, {
			date,
			limit,
			offset,
			page,
			idx: getIdxAndCheckDeviceId,
		});
		return responseData.data;
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('customer-transaction')
	@UsePipes(
		new ValidationPipe({
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	)
	async getAllCustomerTransactions(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Query('loan_id') loan_id: string = null,
		@Query('date') date = new Date(),
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		page = page || 1;
		limit = limit || 10;
		const offset = limit * (page - 1);

		try {
			// const response = await Axios.post(
			// 	`${process.env.CUSTOMER_TRANSACTIONS}`,
			// 	{
			// 		date,
			// 		limit,
			// 		offset,
			// 		page,
			// 		idx: getIdxAndCheckDeviceId,
			// 		loan_id,
			// 	},
			// );
			const response = await Axios.get(
				`${process.env.CUSTOMER_TRANSACTIONS_FROM_CRON}${getIdxAndCheckDeviceId}/${date}`,
			);
			if (response.status === 200 || response.status === 201) {
				const dataReceived = response.data;

				//sorting in descending to date as data is not sorted from api call
				dataReceived.transactions.sort((a, b)=> {
					return new Date(b.transaction_date).valueOf() -
					  new Date(a.transaction_date).valueOf()
					
				});

				let resultWewant: any[];
				let resultWewant1: any[];

				if (dataReceived.transaction === 0) {
					resultWewant1 = [];
				} else {
					const allMerchantArray = dataReceived.transactions.map(el => {
						return el.merchant_idx;
					});

					const uniqueAllMerchantArray = [...new Set(allMerchantArray)];

					resultWewant = await this.mapMerchantData(
						dataReceived.transactions,
						uniqueAllMerchantArray,
						true,
					);

					const allCustomerArray = resultWewant.map(el => {
						return el.customer_idx;
					});

					const uniqueAllCustomerArray = [...new Set(allCustomerArray)];

					resultWewant1 = await this.mapCustomerData(
						dataReceived.transactions,
						uniqueAllCustomerArray,
					);

					resultWewant1.forEach(data => {
						cleanData(data, [
							'id',
							'customer_idx',
							'merchant_idx',
							'createdOn',
							'is_obsolete',
							'modified_on',
						]);
					});
				}

				return { transactions: resultWewant1 };
			}
		} catch (e) {
			Logger.log(e.response.data);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('forget-mpin')
	async ForgetMpin(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		return this.customerLoginService.ForgetMpinService(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('resend-forget-mpin')
	async ResendForgetMpin(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		return this.customerLoginService.ForgetMpinService(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('verify-forget-mpin-otp')
	async VerifyForgetMpinOtp(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body() data: VerifyForgetMpinOtpDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		return this.customerLoginService.VerifyForgetMpinOtpService(
			getIdxAndCheckDeviceId,
			data,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('set-new-mpin')
	async SetNewMpinAfterForget(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body() data: SetMpinAfterForgetDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (data.mpin !== data.confirm_mpin) {
			throw new HttpException(
				'Confirm m-PIN donot match',
				HttpStatus.BAD_REQUEST,
			);
		}

		return this.customerLoginService.SetNewMpinAfterForgetService(
			getIdxAndCheckDeviceId,
			data,
			request.headers,
		);
	}

	@Post('reset-mpin-confirm')
	async ValidateOtpAndResetMpin(
		@Body() validateCustomerLogin: CustomerLoginValidateDTO,
		@Headers() Device: { device: string },
	) {
		const isOtpValid = await this.customerLoginService.validateOtp(
			validateCustomerLogin,
			Device.device,
		);

		if (isOtpValid.length > 0) {
			await this.customerLoginService.UpdateCustomer(isOtpValid[0].idx, {
				is_mpin_set: null,
			});
			return { statusCode: 200, message: 'Otp validated' };
		}
	}

	@Post('rl-apply')
	async ApplyForPl(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body('requested_loan_amount') requested_loan_amount: string,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		//checks if transaction is locked or not
		await this.customerLoginService.CheckTransactionLockedSevice(
			getIdxAndCheckDeviceId,
		);

		const response = await Axios.post(`${process.env.RL_APPLY}`, {
			idx: getIdxAndCheckDeviceId,
			requested_loan_amount,
		});

		if (response.status !== 201) {
			throw new HttpException(response.data.response, response.status);
		}

		return response.data;
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('product-credits')
	async getAllProductCredit(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Query() query,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.getAllProductCreditService(
			getIdxAndCheckDeviceId,
			query,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('credit-limit')
	async GetCustomerCreditLimit(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		try {
			const response = await Axios.post(
				`${process.env.GET_CUSTOMER_CREDIT_LIMIT}`,
				{
					customer_idx: getIdxAndCheckDeviceId,
				},
			);
			return response.data;
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('credit-limit-data')
	async GetCustomerCreditLimitData(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		const customer = await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);
		try {
			const response = await Axios.post(`${process.env.GET_CREDIT_LIMIT}`, {
				customer_idx: getIdxAndCheckDeviceId,
			})
				.catch(e => {
					return e.response
				});
			console.log(customer)
			return response.data;
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('get-rl-lan-no')
	async getRLLanNo(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		const customer = await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);
		return await this.customerRLService.getCustomerRLandLanStatus(customer)
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('profile')
	async Profile(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		// checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.getMyProfile(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('address-proof')
	@UseInterceptors(
		FileFieldsInterceptor([{ name: 'addressfile', maxCount: 1 }], {
			limits: {
				fileSize: 500 * 1024,
			},
			fileFilter: ImageAndPdfFileFilter,
		}),
	)
	async UpdateAddressProof(
		@UploadedFiles() files: UpdateAddressProofDto,
		@Request() request: Request,
		@Headers() Device: any,
		@Request() req,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		if (!files) {
			throw new HttpException('Document is missing', HttpStatus.BAD_REQUEST);
		}

		if (!files.addressfile) {
			throw new HttpException(
				'Address Proof is missing',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (req.fileValidationError === 'Forbidden extension') {
			throw new HttpException('Forbidden extension', HttpStatus.BAD_REQUEST);
		}

		const fileNames: Array<string> = [];

		Object.entries(files).forEach(([key, value]) => {
			// @ts-ignore
			const currentFile = value.pop();
			const currentFileName = fileName(currentFile.originalname);
			this.minioClient.putObject(
				`${process.env.ADDRESSPROOF_BUCKETNAME}`,
				currentFileName,
				currentFile.buffer,
				error => {
					if (error) {
						throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
					}
				},
			);

			fileNames.push(currentFileName);
		});

		console.log(fileNames, 'here is filename');
		return this.customerLoginService.UpdateAddressProofService(
			getIdxAndCheckDeviceId,
			fileNames[0],
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('permanent-address-proof')
	@UseInterceptors(
		FileFieldsInterceptor([{ name: 'addressfile', maxCount: 1 }], {
			limits: {
				fileSize: 500 * 1024,
			},
			fileFilter: ImageAndPdfFileFilter,
		}),
	)
	async UpdatePermanentAddressProof(
		@UploadedFiles() files: UpdateAddressProofDto,
		@Request() request: Request,
		@Headers() Device: any,
		@Request() req,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		if (!files) {
			throw new HttpException('Document is missing', HttpStatus.BAD_REQUEST);
		}

		if (!files.addressfile) {
			throw new HttpException(
				'Address Proof is missing',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (req.fileValidationError === 'Forbidden extension') {
			throw new HttpException('Forbidden extension', HttpStatus.BAD_REQUEST);
		}

		const fileNames: Array<string> = [];

		Object.entries(files).forEach(([key, value]) => {
			// @ts-ignore
			const currentFile = value.pop();
			const currentFileName = fileName(currentFile.originalname);
			this.minioClient.putObject(
				`${process.env.ADDRESSPROOF_BUCKETNAME}`,
				currentFileName,
				currentFile.buffer,
				error => {
					if (error) {
						throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
					}
				},
			);

			fileNames.push(currentFileName);
		});

		console.log(fileNames, 'here is filename');
		return this.customerLoginService.UpdatePermanentAddressProofService(
			getIdxAndCheckDeviceId,
			fileNames[0],
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('income-proof')
	@UseInterceptors(
		FileFieldsInterceptor([{ name: 'addressfile', maxCount: 1 }], {
			limits: {
				fileSize: 500 * 1024,
			},
			fileFilter: ImageAndPdfFileFilter,
		}),
	)
	async UpdateIncomeProof(
		@UploadedFiles() files: UpdateAddressProofDto,
		@Request() request: Request,
		@Headers() Device: any,
		@Request() req,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		if (!files) {
			throw new HttpException('Document is missing', HttpStatus.BAD_REQUEST);
		}

		if (!files.addressfile) {
			throw new HttpException(
				'Address Proof is missing',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (req.fileValidationError === 'Forbidden extension') {
			throw new HttpException('Forbidden extension', HttpStatus.BAD_REQUEST);
		}

		const fileNames: Array<string> = [];

		Object.entries(files).forEach(([key, value]) => {
			// @ts-ignore
			const currentFile = value.pop();
			const currentFileName = fileName(currentFile.originalname);
			this.minioClient.putObject(
				`${process.env.ADDRESSPROOF_BUCKETNAME}`,
				currentFileName,
				currentFile.buffer,
				error => {
					if (error) {
						throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
					}
				},
			);

			fileNames.push(currentFileName);
		});

		console.log(fileNames, 'here is filename');
		return this.customerLoginService.UpdateIncomeProof(
			getIdxAndCheckDeviceId,
			fileNames[0],
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('residence-status')
	async GetResidenceStatus(
		@Request() request: Request,
		@Headers() Device: any,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		// console.log(getIdxAndCheckDeviceId);

		return this.customerLoginService.GetResidenceStatusService();
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('account-type')
	async GetAccountType(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetAccountTypeService();
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('address')
	async GetAddress(@Request() request: Request, @Headers() Device: any) {
		console.log('here is');

		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		// console.log(getIdxAndCheckDeviceId);

		return this.customerLoginService.GetAddressService(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('current-address')
	async GetCurrentAddress(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetCurrentAddressService(
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('current-address')
	async UpdateCurrentAddress(
		@Request() request: Request,
		@Headers() Device: any,
		@Body() current_address: UpdateCurrentAddressDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.UpdateCurrentAddress(
			getIdxAndCheckDeviceId,
			current_address,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('personal-information')
	async GetPersoanlInfo(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetPersoanlInfo(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('personal-information')
	async UpdatePersoanlInfo(
		@Request() request: Request,
		@Headers() Device: any,
		@Body() current_address: UpdatePersonalInfoDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.UpdatePersoanlInfoService(
			getIdxAndCheckDeviceId,
			current_address,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('work-details')
	async GetWorkDetails(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetWorkDetailsService(
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('work-details')
	async UpdateWorkDetails(
		@Request() request: Request,
		@Headers() Device: any,
		@Body() current_address: UpdateWorkDetailsDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.UpdateWorkDetailsService(
			getIdxAndCheckDeviceId,
			current_address,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('reference-details')
	async GetReferenceDetails(
		@Request() request: Request,
		@Headers() Device: any,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetReferenceDetailsService(
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('terms-and-conditions')
	async UpdateTermsAndConditions(
		@Request() request: Request,
		@Headers() Device: any,
		@Body() termsAndCondtion: UpdateTermsAndConditionsDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.UpdateTermsAndConditionsService(
			getIdxAndCheckDeviceId,
			termsAndCondtion,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('mandate')
	async GetmandateInfo(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetmandateInfoService(
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Put('mandate')
	async UpdateMandateInfo(
		@Request() request: Request,
		@Headers() Device: any,
		@Body() data: UpdateMandateDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (data.confirm_account_number !== data.account_number) {
			throw new HttpException(
				'Confirm Account number donot match',
				HttpStatus.BAD_REQUEST,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.UpdateMandateInfoService(
			getIdxAndCheckDeviceId,
			data,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('state-codes')
	async GetStateCodes(
		@Request() request: Request,
		@Headers() Device: any,
		@Query('search') search = '',
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetStateCodes(search);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('aeon-branch')
	async GetAeonBranch(
		@Request() request: Request,
		@Headers() Device: any,
		@Query('search') search = '',
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.GetAeonBranchService(search);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('customer-files/:transaction_idx')
	async GetCustomerFile(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Param('transaction_idx') transaction_idx: string,
		@Res() res,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
		}

		return this.customerLoginService.GetCustomerFile(transaction_idx);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('product-credits/:idx')
	async getOneProductCredit(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Param('idx') idx: string,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
		}

		return this.customerLoginService.getOneProductCreditService(idx);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('customer-card')
	async getCustomerCard(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		return this.customerLoginService.getCustomerCard(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('membership-flag')
	async updateMembershipFlag(@Request() request: Request, @Headers() Device: any, @Body() data: MembershipUpdateFlag,) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}
		return this.customerLoginService.updateMembershipFlag(getIdxAndCheckDeviceId,data.updateTo);
	}

	@Post('pl-apply')
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'id_card_front', maxCount: 1 },
				{ name: 'id_card_back', maxCount: 1 },
				{ name: 'verification_doc', maxCount: 1 },
			],
			{
				limits: {
					fileSize: 500 * 1024,
				},
				fileFilter: ImageFileFilter,
			},
		),
	)
	async plApply(
		@UploadedFiles() files: UploadFilesDTO,
		@Request() req,
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body() data: AmountDto,
	) {
		// check credentials

		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		const customer = await this.customerLoginService.getMyProfile(
			getIdxAndCheckDeviceId,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		if (!files.id_card_front) {
			throw new HttpException(
				'ID card front is missing',
				HttpStatus.BAD_REQUEST,
			);
		}
		if (!files.id_card_back) {
			throw new HttpException(
				'ID card back is missing',
				HttpStatus.BAD_REQUEST,
			);
		}
		if (!files.verification_doc) {
			throw new HttpException(
				'Verification document is missing',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (req.fileValidationError === 'Forbidden extension') {
			throw new HttpException('Forbidden extension', HttpStatus.BAD_REQUEST);
		}

		const fileNames: Array<string> = [];

		Object.entries(files).forEach(([key, value]) => {
			// @ts-ignore
			const currentFile = value.pop();
			const currentFileName = fileName(currentFile.originalname);
			this.minioClient.putObject(
				'loanbucket',
				currentFileName,
				currentFile.buffer,
				error => {
					if (error) {
						throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
					}
				},
			);

			fileNames.push(currentFileName);
		});

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		try {
			const response = await Axios.post(`${process.env.PROCESS_PL}`, {
				idx: getIdxAndCheckDeviceId,
				id_card_front:
					`${process.env.MINIO_ROOT_URL}://${process.env.MINIO_ENDPOINT}/` +
					fileNames[0],
				id_card_back:
					`${process.env.MINIO_ROOT_URL}://${process.env.MINIO_ENDPOINT}/` +
					fileNames[1],
				verification_doc:
					`${process.env.MINIO_ROOT_URL}://${process.env.MINIO_ENDPOINT}/` +
					fileNames[2],
				requested_amount: data.requested_amount,
				customer_code: customer.customer_code,
			});

			if (response.status === 200 || response.status === 201) {
				return { statusCode: 200, message: 'Submitted for review' };
			}
		} catch (e) {
			Logger.log(e.data.message);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('pl-approval/:idx')
	async PlResponse(@Body() data: ApproveRejectDto, @Param('idx') loan_idx) {
		validateUUIDwithMessage(loan_idx, 'loan idx');
		try {
			const response = await Axios.post(`${process.env.PL_APPROVE}`, {
				loanid: loan_idx,
				status: data.status,
			});

			if (response.status === 200 || response.status === 201) {
				return { statusCode: 200, message: response.data.message };
			}
		} catch (e) {
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Post('emi-response/:order_id')
	async EmiResponse(
		@Body() data: ApproveRejectDto,
		@Param('order_id') order_id: string,
	) {
		validateUUIDwithMessage(order_id, 'order idx');
		try {
			const response = await Axios.post(`${process.env.EMI_RESPONSE}`, {
				order_id,
				status: data.status,
			});

			if (response.status === 200 || response.status === 201) {
				return { statusCode: 200, message: response.data.message };
			}
		} catch (e) {
			Logger.log(e);
			throw new HttpException(e.response.data, e.response.status);
		}
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('customer-notification')
	async CustomerNotification(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Query('page') page = 1,
		@Query('limit') limit = 10,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const offset = limit * (page - 1);
		return this.customerLoginService.CustomerNotificationService(
			getIdxAndCheckDeviceId,
			page,
			limit,
			offset,
		);
	}

	@Get('soa-noc')
	async GetSoaNoc(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Query('limit') limit = 10,
		@Query('offset') offset: number,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		return this.customerLoginService.GetSoaNocService(
			getIdxAndCheckDeviceId,
			limit,
			offset,
		);
	}

	@Get('get-interest-rate')
	async GetInterestRate(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}

		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		return this.customerLoginService.GetInterestRateService();
	}

	@Get('auth')
	async AuthCustomer(@Request() request: Request, @Headers() Device: any) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}

		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		return this.customerLoginService.AuthCustomerService(
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('getAllSecurityQuestion')
	async getAllSecurityQuestion(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		return this.customerLoginService.getAllSecurityQuestionService(
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('setSecurityQuestion')
	async setSecurityQuestion(
		@Request() request: Request,
		@Body() bodyData: SetSecurityQuestionDto,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (bodyData.data.length !== 5) {
			throw new HttpException(
				'All five questions must be answered',
				HttpStatus.BAD_REQUEST,
			);
		}

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		// const customerLog = {
		// 	user: `${getCustomerInfo.first_name}${
		// 		getCustomerInfo.middle_name ? getCustomerInfo.middle_name : ' '
		// 	}${getCustomerInfo.last_name}`,
		// 	action: 'set security questions',
		// 	action_message: 'Customer requested for set security questions',
		// 	date_time: `${new Date().toISOString()}`,
		// };

		// await this.customerLoginService.logCustomer(customerLog);

		return this.customerLoginService.setSecurityQuestion(
			bodyData.data,
			getIdxAndCheckDeviceId,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('verifyAllSecurityQuestion')
	async verifyAllSecurityQuestion(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body() bodyData: SetSecurityQuestionDto,
	) {
		const header: any = request.headers;
		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		if (bodyData.data.length !== 5) {
			throw new HttpException(
				'All five questions must be answered',
				HttpStatus.BAD_REQUEST,
			);
		}

		const getCustomerInfo = await this.customerRepo.findOne({
			idx: getIdxAndCheckDeviceId,
			is_obsolete: false,
		});

		if (!getCustomerInfo) {
			throw new HttpException(
				{
					message: 'operations.CUSTOMER_NOT_FOUND',
				},
				HttpStatus.NOT_FOUND,
			);
		}

		// const customerLog = {
		// 	user: `${getCustomerInfo.first_name}${
		// 		getCustomerInfo.middle_name ? getCustomerInfo.middle_name : ' '
		// 	}${getCustomerInfo.last_name}`,
		// 	action: 'verify security questions',
		// 	action_message: 'Customer requested for verify security questions',
		// 	date_time: `${new Date().toISOString()}`,
		// };

		// await this.customerLoginService.logCustomer(customerLog);

		return this.customerLoginService.verifyAllSecurityQuestionService(
			getIdxAndCheckDeviceId,
			bodyData.data,
		);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('encrypted-info')
	async encryptInfo(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		return this.customerLoginService.encryptInfo(getIdxAndCheckDeviceId);
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Post('decrypted-info')
	async decryptInfo(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body() CipherDecrypt: CipherDecryptDto,
	) {
		const header: any = request.headers;
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}
		console.log('decrypted-info is here');

		return this.customerLoginService.decryptInfo(CipherDecrypt.token);
	}

	@Get('loyalty-auth')
	async LoyaltyAuth() {
		return this.customerLoginService.LoyaltyAuthService();
	}

	@Get('point-inquiry')
	async PointInquiry(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.PointInquiryService(
			getIdxAndCheckDeviceId,
		);
	}

	@Post('applyRLTest')
	async applyRLTest(@Body() body: RLApplicationDto) {
		return await this.customerRlApplicationApiService.applyRL(
			'2b802ead-8f90-4389-a5b3-70462ac7ed43',
			body,
		);
		// return {
		// 	code : 200,
		// 	message: "Customers have been notified on membership upgrade/degrade."
		// }
	}

	@Post('rl-application')
	async rlApply(
		@Request() request: Request,
		@Headers() Device: { device: string },
		@Body() applicationDto: RLApplicationDto,
	) {
		const header: any = request.headers;
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		// if (getIdxAndCheckDeviceId === 'Device does not exist') {
		// 	throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		// }
		//
		// if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
		// 	throw new HttpException(
		// 	{
		// 		message: 'operations.CANNOT_PROCEED',
		// 		sub: 'operations.DEVICE_ID_MISMATCH',
		// 	},
		// 	HttpStatus.FORBIDDEN,
		// );
		// }

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return await this.customerRlApplicationApiService.applyRL(
			getIdxAndCheckDeviceId,
			applicationDto,
		);
	}

	@Get('benefits')
	async Benefits(
		@Request() request: Request,
		@Headers() Device: { device: string },
	) {
		const header: any = request.headers;
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException(
				{
					message: 'operations.CANNOT_PROCEED',
					sub: 'operations.DEVICE_ID_MISMATCH',
				},
				HttpStatus.FORBIDDEN,
			);
		}

		//checks if mpin and security que set or not
		await this.customerLoginService.checkMpinAndSecuritySet(
			getIdxAndCheckDeviceId,
		);

		return this.customerLoginService.BenefitsService();
	}

	async mapMerchantData(result, uniqueAllMerchantArray, withRefundID = false) {
		let resultMerchant;

		try {
			const response = await Axios.post(process.env.GET_MERCHANTS_NAME, {
				merchantArray: uniqueAllMerchantArray,
			});

			if (response.status === 200 || response.status === 201) {
				resultMerchant = response.data;
			}
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data.message, e.response.status);
		}

		if (withRefundID) {
			result.forEach(el => {
				el.merchant = resultMerchant[el.merchant_idx] || null;
				el.ref_refund_id = this.generateTransactionID(
					el.loan_id,
					el.transaction_date,
				);
				el.refund_id = this.generateRefundID(el.loan_id, el.transaction_date);
			});
		} else {
			result.forEach(el => {
				el.merchant = resultMerchant[el.merchant_idx] || null;
				el.ref_refund_id = this.generateTransactionID(
					el.loan_id,
					el.transaction_date,
				);
			});
		}
		return result;
	}

	async mapCustomerData(result, uniqueAllCustomerArray) {
		let resultCustomer;
		const response = await this.customerService.GetCustomerNamesService(
			uniqueAllCustomerArray,
		);

		resultCustomer = response;

		result.forEach(el => {
			el.customer = resultCustomer[el.customer_idx] || null;
		});
		return result;
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

	generateRefundID(loan_id: string, some_date) {
		const first = loan_id ? loan_id.substring(0, 6) : 'null';
		const some_date_string1 = moment(some_date).format('YYYY/MM/DD');
		const data1 = some_date_string1.split('/')[0];
		const data2 = some_date_string1.split('/')[1];
		const data3 = some_date_string1.split('/')[2];
		const hourMin = moment(some_date).format('HH/mm/ss');
		const data4 = hourMin.split('/')[0];
		const data5 = hourMin.split('/')[1];
		const data6 = hourMin.split('/')[2];

		return `${first}/${data1}${data2}${data3}/${data4}${data5}${data6}`;
	}
}
