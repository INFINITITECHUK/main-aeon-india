import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class ChangeMpinDto {
	@IsNotEmpty({ message: 'Current m-PIN cannot be empty' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Current m-PIN must be numeric' },
	)
	@Length(4, 4, {
		message: 'Current m-PIN must be 4 digits',
	})
	currentPin: string;

	@IsNotEmpty({ message: 'New m-PIN cannot be empty' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'New m-PIN must be numeric' },
	)
	@Length(4, 4, {
		message: 'New m-PIN must be 4 digits',
	})
	newPin: string;

	@IsNotEmpty({ message: 'Confirm m-PIN cannot be empty' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Confirm m-PIN must be numeric' },
	)
	@Length(4, 4, {
		message: 'Confirm m-PIN must be 4 digits',
	})
	confirmPin: string;
}
