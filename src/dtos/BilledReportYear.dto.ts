import { IsNotEmpty } from 'class-validator';

export class BilledReportYear {
	@IsNotEmpty({ message: 'Year is required' })
	year: string;

	@IsNotEmpty({ message: 'Month is required' })
	month: string;
}
