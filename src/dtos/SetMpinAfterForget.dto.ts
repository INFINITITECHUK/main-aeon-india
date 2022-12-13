import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class SetMpinAfterForgetDto {
	@IsNumberString({ no_symbols: true }, { message: 'Mpin must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	@IsNotEmpty({ message: 'MPIN cannot be empty' })
	mpin: string;

	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Confirm MPIN must be numeric' },
	)
	@Length(4, 4, {
		message: 'Confirm MPIN must be 4 digits',
	})
	@IsNotEmpty({ message: 'Confirm MPIN cannot be empty' })
	confirm_mpin: string;

	// @IsNotEmpty({ message: 'Token cannot be empty' })
	// token: string;
}
