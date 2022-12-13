import {
	IsAlphanumeric,
	IsEmail,
	IsIn,
	IsNotEmpty,
	IsNumberString,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import { IsOptional } from '../common/others/customOptional';

export class CreateCustomer {
	status?: string;
	idx?: string;
	company_user_id?: number;

	@IsOptional()
	@IsString({ message: 'First name must be string' })
	@Length(3, 30, {
		message: 'First Name must be between 3 and 30 characters long',
	})
	first_name: string;

	@IsOptional()
	@IsString({ message: 'Middle name must be string' })
	@Length(3, 30, {
		message: 'Middle Name must be between 3 and 30 characters long',
	})
	middle_name: string;

	@IsOptional()
	@IsString({ message: 'Last name must be string' })
	@Length(3, 30, {
		message: 'Last Name must be between 3 and 30 characters long',
	})
	last_name: string;

	// customer_id?: string;

	@IsOptional()
	@IsEmail({}, { message: 'Business Contact Email must be a valid email' })
	email?: string;

	@IsOptional()
	@IsString({ message: 'Gender must be string' })
	@IsIn(['MALE', 'FEMALE'], { message: 'Gender must be either Male or Female' })
	gender: string;

	@IsNotEmpty({ message: 'Mobile Number is required' })
	mobile_number: string;

	@IsOptional()
	@Matches(/^([0-9]{4})\/([0-9]{2})\/([0-9]{2})$/, {
		message: 'Date of birth must of format yyyy/mm/dd',
	})
	date_of_birth: string;

	@IsOptional()
	@IsString({ message: 'Id type must be string' })
	id_type: string;

	@IsOptional()
	@IsNumberString({ no_symbols: true }, { message: 'Id number must be number' })
	@Length(3, 30, {
		message: 'Id number must be between 3 and 30 characters long',
	})
	id_no: string;

	@IsOptional()
	@Matches(/^([0-9]{4})\/([0-9]{2})\/([0-9]{2})$/, {
		message: 'Id expiry date must of format yyyy/mm/dd',
	})
	id_expiry_date: string;

	@IsOptional()
	@IsString({ message: 'City/State must be string' })
	@Length(3, 30, {
		message: 'City/State must be between 3 and 30 characters long',
	})
	city_state: string;

	@IsOptional()
	@IsString({ message: 'District must be string' })
	@Length(3, 30, {
		message: 'District must be between 3 and 30 characters long',
	})
	district: string;

	@IsNotEmpty({ message: 'Mobile number ext days is required' })
	@Length(1, 5, {
		message: 'Mobile number ext must be between 1 and 4 characters long',
	})
	mobile_number_ext: string;

	@IsNotEmpty({ message: 'Customer number code is required' })
	customer_code: string;

	@IsOptional()
	credit_limit: string;

	@IsNotEmpty({ message: 'PAN Number is required' })
	@IsAlphanumeric('en-US', { message: 'PAN Number must be alphanumeric' })
	@Length(10, 10, {
		message: 'PAN No must be of 10 digit',
	})
	panno: string;
}
