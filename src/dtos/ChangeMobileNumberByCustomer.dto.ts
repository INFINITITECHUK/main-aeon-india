// import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class ChangeMobileNumberByCustomerDto {
	@IsNotEmpty({ message: 'Mobile Number is required' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Mobile number must be numeric' },
	)
	@Length(10, 10, {
		message: 'Mobile Number must be 10 digit',
	})
	@IsNotEmpty({ message: 'Mobile Number is required' })
	mobile_number: string;

	@IsNotEmpty({ message: 'Confirm Mobile Number is required' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Confirm Mobile number must be numeric' },
	)
	@Length(10, 10, {
		message: 'Mobile Number must be 10 digit',
	})
	confirm_mobile_number: string;

	@IsNumberString(
		{ no_symbols: true },
		{ message: 'MPIN number must be numeric' },
	)
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	@IsNotEmpty({ message: 'MPIN cannot be empty' })
	mpin: string;
}
