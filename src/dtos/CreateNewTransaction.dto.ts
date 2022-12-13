import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class CreateNewTransaction {
	@IsNotEmpty({ message: 'Merchant Idx is required' })
	merchant_idx: string;

	@IsNotEmpty({ message: 'Borrowed Amount is required' })
	borrowed_amount: string;

	@IsNotEmpty({ message: 'MPIN is required' })
	@IsNumberString({ no_symbols: true }, { message: 'Mpin must be numeric' })
	@Length(4, 4, {
		message: 'MPIN must be 4 digits',
	})
	mpin: string;
}
