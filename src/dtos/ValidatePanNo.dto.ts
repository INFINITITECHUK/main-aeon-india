import {
	IsAlphanumeric,
	IsNotEmpty,
	IsNumberString,
	Length,
	Matches,
} from 'class-validator';

export class ValidatePanNoDto {
	@IsNotEmpty({ message: 'PAN Number is required' })
	@IsAlphanumeric('en-US', { message: 'PAN Number must be alphanumeric' })
	@Length(10, 10, {
		message: 'PAN No must be of 10 digit',
	})
	panno: string;

	@IsNotEmpty({ message: 'Mobile Number is required' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Mobile number must be numeric' },
	)
	@Length(10, 10, {
		message: 'Mobile Number must be 10 digit',
	})
	mobile_number: string;

	@Matches(/^([+]{1})[0-9]*$/, {
		message: 'Phone extension must start with +',
	})
	@Length(3, 5, {
		message: 'Phone extension must be of length between 2 and 4',
	})
	@IsNotEmpty({ message: 'Phone extension is required' })
	phone_ext: string;
}
