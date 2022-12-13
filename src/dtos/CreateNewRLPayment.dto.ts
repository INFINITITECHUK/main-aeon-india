import {
	ArrayNotEmpty,
	IsArray,
	IsNotEmpty,
	IsNumber,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EmiInterface {
	@IsNotEmpty({ message: 'Amount is required' })
	@IsNumber({}, { message: 'Amount must be a number' })
	amount: number;

	// @IsNotEmpty({ message: 'Product Code is required' })
	product_code: string;

	@IsNotEmpty({ message: 'Loan Agreement Number is required' })
	loan_agreement_number: string;

	@IsNotEmpty({ message: 'Product Name is required' })
	product_name: string;
	// @IsNotEmpty({ message: 'Name is required' })
	// name: string;

	// @IsNotEmpty({ message: 'Idx is required' })
	// @IsUUID()
	// idx: string;
}

// tslint:disable-next-line:max-classes-per-file
export class CreateNewRLPaymentDto {
	// @IsNotEmpty({ message: 'Full name cannot be empty' })
	// full_name: string;

	@IsNotEmpty({ message: 'Emi cannot be empty' })
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => EmiInterface)
	payment: EmiInterface[];
}
