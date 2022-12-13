import {
	IsAlpha,
	IsEmail,
	IsIn,
	IsNumberString,
	Length,
	Matches,
} from 'class-validator';
import { IsOptional } from '../common/others/customOptional';

export class UpdateMyProfileDto {
	@IsOptional()
	@IsAlpha('en-US', { message: 'First name must be string' })
	@Length(3, 30, {
		message: 'First Name must be between 3 and 30 characters long',
	})
	first_name?: string;

	@IsOptional()
	@IsAlpha('en-US', { message: 'Middle name must be string' })
	@Length(3, 30, {
		message: 'Middle Name must be between 3 and 30 characters long',
	})
	middle_name?: string;

	@IsOptional()
	@IsAlpha('en-US', { message: 'Last name must be string' })
	@Length(3, 30, {
		message: 'Last Name must be between 3 and 30 characters long',
	})
	last_name?: string;

	customer_id?: string;

	@IsOptional()
	@IsEmail({}, { message: 'Improper email format' })
	email?: string;

	@IsOptional()
	@IsIn(['Male', 'Female'], { message: 'Gender must be either Male or Female' })
	gender?: string;

	@IsOptional()
	@Matches(/^([0-9]{4})\/([0-9]{2})\/([0-9]{2})$/, {
		message: 'Date of birth must of format yyyy/mm/dd',
	})
	date_of_birth?: string;

	@IsOptional()
	@IsIn(['NATIONAL_ID', 'PASSPORT'], {
		message: 'Id type must be either NATIONAL_ID and PASSPORT',
	})
	id_type?: string;

	@IsOptional()
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Id number must be numeric' },
	)
	@Length(3, 30, {
		message: 'Id number must be between 3 and 30 characters long',
	})
	id_no?: string;

	@IsOptional()
	@Matches(/^([0-9]{4})\/([0-9]{2})\/([0-9]{2})$/, {
		message: 'Id expiry date must of format dd/mm/yyyy',
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

	@IsOptional()
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Mobile number ext  must be numeric' },
	)
	@Length(1, 4, {
		message: 'Mobile number ext must be between 1 and 4 characters long',
	})
	mobile_number_ext?: string;

	@IsOptional()
	profile_picture?: string;
}
