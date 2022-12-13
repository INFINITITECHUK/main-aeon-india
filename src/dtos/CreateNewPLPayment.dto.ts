import { IsNotEmpty, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EmiInterface {
	@IsNotEmpty({ message: 'product is required' })
	product_code;


	@IsNotEmpty({ message: 'Loan Agreement Number is required' })
	loan_agreement_number: string;

	@IsNotEmpty({ message: 'Product Name is required' })
	product_name: string;

	@IsNotEmpty({ message: 'amount is required' })
	@IsNumber({}, { message: 'amount must be a number' })
	amount: number;
}

export class CreateNewPLPaymentDto {
	@IsNotEmpty({ message: 'Full name cannot be empty' })
	full_name: string;

	@IsNotEmpty({ message: 'Emi cannot be empty' })
	@ValidateNested({ each: true })
	@Type(() => EmiInterface)
	payment: EmiInterface[];
}
