// import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class SetMpinDto {
	// @ApiModelProperty({
	//   description: 'mpin of user',
	//   example: 'hAfsFA$%770',
	// })

	@IsNumberString({ no_symbols: true }, { message: 'MPIN must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	@IsNotEmpty({ message: 'MPIN cannot be empty' })
	mpin: string;

	@IsNumberString({ no_symbols: true }, { message: 'MPIN must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	@IsNotEmpty({ message: 'Confirm MPIN cannot be empty' })
	confirm_mpin: string;
}
