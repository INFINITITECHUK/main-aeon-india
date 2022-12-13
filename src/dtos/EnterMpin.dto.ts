// import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class EnterMpinDto {
	@IsNumberString({ no_symbols: true }, { message: 'Mpin must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	@IsNotEmpty({ message: 'MPIN cannot be empty' })
	mpin: string;
}
