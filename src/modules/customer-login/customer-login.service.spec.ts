import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLoginService } from './customer-login.service';
import { CustomerLoginDto } from '../../dtos/CustomerLogin.dto';
import { CustomerLoginValidateDTO } from '../../dtos/CutsomerLoginValidate.dto';
import { ValidatePanNoDto } from '../../dtos/ValidatePanNo.dto';
import { ChangeMobileNumberByCustomerDto } from '../../dtos/ChangeMobileNumberByCustomer.dto';
import { UpdateMyProfileDto } from 'src/dtos/UpdateMyProfile.dto';

const getOtpSuccessMessage = {
	statusCode: 200,
	message: 'OTP sent',
};

const validateOtpSuccessMessage = {
	message: 'Successfully signed in',
	accesstoken:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGVfbnVtYmVyIjoiOTgwNDM1ODYxMiIsImlkeCI6IjgyZTZhOWE2LTI4OWItMTFlYS1iZTg2LTAyNDJhYzExMDAwMyIsImlhdCI6MTU4MjUzMjU1NywiZXhwIjoxNTgyNTY4NTU3fQ.4JTqLX8LvG_0yOxAwp5MTFCgSZrj0y-hHqEWhePRCqs',
	status: 200,
	mpin_set: false,
	first_name: 'Narayan',
	idx: '82e6a9a6-289b-11ea-be86-0242ac110003',
	last_name: 'Shrestha',
};

const validatePanNoSuccessMessage = {
	message: 'PAN Number verified successfully',
	status: 200,
};

const changeMyMobileNumberServiceMessage = {
	statusCode: 200,
	message: 'Update pending',
};

const updateMyProfileSuccessMessage = {
	statusCode: 200,
	message: 'Update pending',
};

describe('CustomerLoginService', () => {
	let service: CustomerLoginService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CustomerLoginService,
				{
					provide: CustomerLoginService,
					useValue: {
						getOtp: jest.fn().mockResolvedValue({
							statusCode: 200,
							message: 'OTP sent',
						}),
						validateOtp: jest.fn().mockResolvedValue({
							message: 'Successfully signed in',
							accesstoken:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGVfbnVtYmVyIjoiOTgwNDM1ODYxMiIsImlkeCI6IjgyZTZhOWE2LTI4OWItMTFlYS1iZTg2LTAyNDJhYzExMDAwMyIsImlhdCI6MTU4MjUzMjU1NywiZXhwIjoxNTgyNTY4NTU3fQ.4JTqLX8LvG_0yOxAwp5MTFCgSZrj0y-hHqEWhePRCqs',
							status: 200,
							mpin_set: false,
							first_name: 'Narayan',
							idx: '82e6a9a6-289b-11ea-be86-0242ac110003',
							last_name: 'Shrestha',
						}),
						validatePanNo: jest.fn().mockResolvedValue({
							message: 'PAN Number verified successfully',
							status: 200,
						}),
						changeMyMobileNumberService: jest.fn().mockResolvedValue({
							statusCode: 200,
							message: 'Update pending',
						}),
						updateMyProfile: jest.fn().mockResolvedValue({
							statusCode: 200,
							message: 'Update pending',
						}),
					},
				},
			],
		}).compile();

		service = module.get<CustomerLoginService>(CustomerLoginService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('customer-login/getotp', () => {
		it('should return a status code with success message', () => {
			const newLoginDto: CustomerLoginDto = {
				phone_ext: '+977',
				mobile_number: '9804358612',
				deviceid: '12',
			};
			expect(service.getOtp(newLoginDto)).resolves.toEqual(
				getOtpSuccessMessage,
			);
		});
	});

	describe('customer-login/validateotp', () => {
		it('should return a status code with success message', () => {
			const newLoginDto: CustomerLoginValidateDTO = {
				otp: '123456',
				mobile_number: '9804358612',
				phone_ext: '+977',
			};
			const deviceId = `Bearer 12`;
			expect(service.validateOtp(newLoginDto, deviceId)).resolves.toEqual(
				validateOtpSuccessMessage,
			);
		});
	});

	describe('customer-login/validatepanno', () => {
		it('should return success message with status code', () => {
			const newValidatePanNoDto: ValidatePanNoDto = {
				mobile_number: '9812345678',
				panno: '1234567890',
				phone_ext: '91',
			};

			expect(service.validatePanNo(newValidatePanNoDto)).resolves.toEqual(
				validatePanNoSuccessMessage,
			);
		});
	});

	describe('customer-login/changemobilenumber', () => {
		it('should return success message with status code', () => {
			const idx = '12782345';
			const data: ChangeMobileNumberByCustomerDto = {
				mobile_number: '9804358612',
				confirm_mobile_number: '9804358612',
				mpin: '1234',
			};

			expect(service.changeMyMobileNumberService(idx, data)).resolves.toEqual(
				changeMyMobileNumberServiceMessage,
			);
		});
	});

	describe('customer-login/update-customer', () => {
		it('should return success message with status code', () => {
			const idx = '12782345';
			const data: UpdateMyProfileDto = {
				first_name: 'New firstname',
			};

			expect(service.updateMyProfile(idx, data)).resolves.toEqual(
				updateMyProfileSuccessMessage,
			);
		});
	});
});
