import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateMandateDto {
	@IsNotEmpty({ message: 'Account Number is required' })
	account_number;

	@IsNotEmpty({ message: 'Account Number is required' })
	confirm_account_number;

	@IsNotEmpty({ message: 'Account type is required' })
	account_type;

	@IsNotEmpty({ message: 'Ifsc code is required' })
	ifsc;

	@IsNotEmpty({ message: 'Bank Name is required' })
	bank_name;
}
