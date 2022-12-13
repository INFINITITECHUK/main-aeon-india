import { IsNotEmpty } from 'class-validator';

export class UpdateWorkDetailsDto {
	@IsNotEmpty({ message: 'Total data is required' })
	total_income;
}
