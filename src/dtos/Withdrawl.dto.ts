import { PickType } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumberString,
	IsOptional,
	Length,
} from 'class-validator';

export class WithdrawlDto {
	@IsNotEmpty({ message: 'Amount is required' })
	@IsNumberString({ no_symbols: true }, { message: 'Amount must be numeric' })
	amount?: string;

	@IsNotEmpty({ message: 'MPIN is required' })
	@IsNumberString({ no_symbols: true }, { message: 'Mpin must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	mpin: string;
}

export class WithdrawlInfoDto extends PickType(WithdrawlDto, [
	'amount',
] as const) {}
