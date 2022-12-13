import {
	IsAlpha,
	IsAlphanumeric,
	IsEmail,
	IsIn,
	IsNotEmpty,
	IsNumberString,
	IsUUID,
	Length,
	Matches,
} from 'class-validator';
import { IsOptional } from '../common/others/customOptional';

export class UpdateCustomerDto {
	status?: string;
	idx?: string;
	company_user_id?: number;

	// @IsOptional()
	@IsNotEmpty({ message: 'First Name is required' })
	@IsAlpha('en-US', { message: 'First name must be string' })
	@Length(3, 30, {
		message: 'First Name must be between 3 and 30 characters long',
	})
	first_name: string;

	@IsOptional()
	@IsAlpha('en-US', { message: 'Middle name must be string' })
	@Length(3, 30, {
		message: 'Middle Name must be between 3 and 30 characters long',
	})
	middle_name?: string;

	@IsNotEmpty({ message: 'Last Name is required' })
	@IsAlpha('en-US', { message: 'Last name must be string' })
	@Length(3, 30, {
		message: 'Last Name must be between 3 and 30 characters long',
	})
	last_name: string;

	customer_id?: string;

	@IsNotEmpty({ message: 'Email is required' })
	@IsEmail({}, { message: 'Improper email format' })
	email: string;

	@IsNotEmpty({ message: 'Gender is required' })
	@IsIn(['Male', 'Female', 'Others'], {
		message: 'Gender must be either Male, Female or Others',
	})
	gender: string;

	@IsNotEmpty({ message: 'Mobile number is required' })
	@Length(10, 10, { message: 'Mobile number must be exactly 10 digits' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Mobile Number must be numeric' },
	)
	mobile_number: string;

	@IsOptional()
	@Matches(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/, {
		message: 'Date of birth must of format yyyy-mm-dd',
	})
	date_of_birth?: string;

	@IsNotEmpty({ message: 'ID type is required' })
	@IsIn(['NATIONAL_ID', 'PASSPORT', 'PAN'], {
		message: 'Id type must be either NATIONAL_ID and PASSPORT',
	})
	id_type: string;

	@IsNotEmpty({ message: 'ID number is required' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Id number must be numeric' },
	)
	@Length(3, 30, {
		message: 'Id number must be between 3 and 30 characters long',
	})
	id_no: string;

	@IsOptional()
	@Matches(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/, {
		message: 'Id expiry date must of format yyyy-mm-dd',
	})
	id_expiry_date?: string;

	@IsOptional()
	@IsAlpha('en-US', { message: 'City/State must be string' })
	@Length(3, 30, {
		message: 'City/State must be between 3 and 30 characters long',
	})
	city_state?: string;

	@IsOptional()
	@IsAlpha('en-US', { message: 'District must be string' })
	@Length(3, 30, {
		message: 'District must be between 3 and 30 characters long',
	})
	district?: string;

	@IsNotEmpty({ message: 'Mobile number ext is required' })
	@Length(1, 4, {
		message: 'Mobile number ext must be between 1 and 4 characters long',
	})
	mobile_number_ext: string;

	@IsNotEmpty({ message: 'Panno is required' })
	@IsAlphanumeric('en-US', { message: ' Panno must be alphanumeric' })
	@Length(10, 10, {
		message: 'Panno must be 10 characters long',
	})
	panno: string;

	customer_code: string;

	@IsNotEmpty({ message: 'Account Number is required' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Account Number must be numeric' },
	)
	@Length(1, 50, {
		message: 'Account Number must be between 1 and 50 characters',
	})
	account_number: string;

	@IsNotEmpty({ message: 'Account type is required' })
	@IsIn(['Saving', 'Current'], {
		message: 'Account type must be either Saving or Current',
	})
	account_type: string;

	extra_details?: any;

	@IsNotEmpty({ message: 'Branch ID is required' })
	@IsUUID()
	branch_idx: string;

	@IsNotEmpty({ message: 'Account Holder name is required' })
	full_name: string;

	@IsOptional()
	is_transaction_locked?: boolean;
}
