// import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class ChangeMobileNumberDto {
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
}
