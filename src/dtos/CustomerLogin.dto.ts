// import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Length, Matches } from 'class-validator';

export class CustomerLoginDto {
	id?: number;
	idx?: string;

	// @ApiModelProperty()
	@IsNotEmpty({ message: 'Phone Extension is required' })
	@Matches(/^([+]{1})[0-9]*$/, {
		message: 'Phone extension must start with +',
	})
	@Length(3, 5, {
		message: 'Phone extension must be of length between 2 and 4',
	})
	phone_ext: string;

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

	// // @ApiModelProperty()
	// phone_brand?: string;

	// // @ApiModelProperty()
	// phone_os?: string;

	// // @ApiModelProperty()
	// os_version?: string;

	// @ApiModelProperty()
	@IsNotEmpty({ message: 'Device ID is required' })
	deviceid: string;

	token?: string;

	// @ApiModelProperty()
	otp_type?: string;
}
