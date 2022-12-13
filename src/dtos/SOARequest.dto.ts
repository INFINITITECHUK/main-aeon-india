import { IsNotEmpty } from 'class-validator';

export class SOARequestDto {
	@IsNotEmpty({ message: 'Product is required' })
	product_code;
}
