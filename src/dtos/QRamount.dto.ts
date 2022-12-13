import {
	IsNotEmpty,
	IsNumberString,
	IsOptional,
	Length,
} from 'class-validator';

// import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

export class QRAmount {
	// @ApiModelPropertyOptional()
	@IsOptional()
	@IsNumberString({ no_symbols: true }, { message: 'Amount must be numeric' })
	amount?: string;

	@IsNotEmpty({ message: 'MPIN is required' })
	@IsNumberString({ no_symbols: true }, { message: 'Mpin must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	mpin: string;
}
