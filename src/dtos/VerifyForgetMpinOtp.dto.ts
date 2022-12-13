import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class VerifyForgetMpinOtpDto {
	@IsNotEmpty({ message: 'OTP is required' })
	@Length(4, 4, {
		message: 'OTP must be of 4 digit',
	})
	@IsNumberString({ no_symbols: true }, { message: 'Otp must be numeric' })
	otp: string;
}
