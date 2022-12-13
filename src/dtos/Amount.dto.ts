import { IsNotEmpty } from 'class-validator';

export class AmountDto {
	@IsNotEmpty({ message: 'Requested Amount is required' })
	requested_amount;
}
