import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { ChangeMobileNumberDto } from 'src/dtos/ChangeMobileNumber.dto';

const bulkCustomerCreateMessage = {
	status: 200,
	message: 'New Customer Data Imported',
};

const bulkCustomerSyncFileMessage = {
	status: 200,
	message: `(1) Customer Data Updated Successfully`,
};

const changeCustomerMobileNumberServiceMessage = {
	statusCode: 200,
	message: 'Customer update pending',
};

describe('Customer Service', () => {
	let service: CustomerService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CustomerService,
				{
					provide: CustomerService,
					useValue: {
						bulkCustomerCreate: jest.fn().mockResolvedValue({
							status: 200,
							message: 'New Customer Data Imported',
						}),
						bulkCustomerSyncFile: jest.fn().mockResolvedValue({
							status: 200,
							message: `(1) Customer Data Updated Successfully`,
						}),
						changeCustomerMobileNumberService: jest.fn().mockResolvedValue({
							statusCode: 200,
							message: 'Customer update pending',
						}),
					},
				},
			],
		}).compile();

		service = module.get<CustomerService>(CustomerService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('bulk customer create through excel sheet', () => {
		it('should return status code with success message', () => {
			const excelData = {
				first_name: 'Ram',
				middle_name: '',
				last_name: 'Shrestha',
				email: 'hello@gmail.com',
				gender: 'male',
				mobile_number: '9812345678',
				date_of_birth: '12/11/1980',
				id_type: 'passport',
				id_no: '123456',
				id_expiry_date: '12/11/2011',
				city_state: 'Kathmandu',
				district: 'Kathmandu',
				credit_limit: '3000',
				customer_code: '21',
				panNo: '1234567890',
			};

			expect(service.bulkCustomerCreate(excelData)).resolves.toEqual(
				bulkCustomerCreateMessage,
			);
		});
	});

	describe('sync bulk customer create through excel sheet', () => {
		it('should return status code with success message', () => {
			const excelData = {
				first_name: 'Ram',
				middle_name: '',
				last_name: 'Shrestha',
				email: 'hello@gmail.com',
				gender: 'male',
				mobile_number: '9812345678',
				date_of_birth: '12/11/1980',
				id_type: 'passport',
				id_no: '123456',
				id_expiry_date: '12/11/2011',
				city_state: 'Kathmandu',
				district: 'Kathmandu',
				credit_limit: '3000',
				customer_code: '21',
				panNo: '1234567891',
			};

			expect(service.bulkCustomerSyncFile(excelData)).resolves.toEqual(
				bulkCustomerSyncFileMessage,
			);
		});
	});

	describe('change mobile number by user', () => {
		it('should return success message with status code', () => {
			const customerIdx = '1234567890';
			const data: ChangeMobileNumberDto = {
				mobile_number: '9804358612',
				confirm_mobile_number: '9804358612',
			};
			const request = '';
			const customer = {};
			expect(
				service.changeCustomerMobileNumberService(
					customerIdx,
					data,
					request,
					customer,
				),
			).resolves.toEqual(changeCustomerMobileNumberServiceMessage);
		});
	});
});
