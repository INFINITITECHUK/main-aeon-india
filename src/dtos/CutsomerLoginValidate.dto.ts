import { IsNotEmpty, IsNumberString, Length, Matches } from 'class-validator';

// import { ApiModelProperty } from '@nestjs/swagger';

export class CustomerLoginValidateDTO {
	// @ApiModelProperty()
	@IsNotEmpty({ message: 'Otp is required' })
	@IsNumberString({ no_symbols: true }, { message: 'Otp must be numeric' })
	otp: string;

	// @ApiModelProperty()
	@IsNotEmpty({ message: 'Mobile Number is required' })
	@IsNumberString(
		{ no_symbols: true },
		{ message: 'Mobile number must be numeric' },
	)
	@Length(10, 10, {
		message: 'Mobile Number must be 10 digit',
	})
	mobile_number: string;

	// @ApiModelProperty()
	@Matches(/^([+]{1})[0-9]*$/, {
		message: 'Phone extension must start with +',
	})
	@Length(3, 5, {
		message: 'Phone extension must be of length between 2 and 4',
	})
	@IsNotEmpty({ message: 'Phone extension is required' })
	phone_ext: string;

	@IsNotEmpty({ message: 'FCM token is required' })
	fcm_token: string;

	phone_brand?: string;

	phone_os?: string;

	os_version?: string;
}
