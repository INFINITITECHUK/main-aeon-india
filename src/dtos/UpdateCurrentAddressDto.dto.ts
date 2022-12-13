import { IsNotEmpty } from 'class-validator';

export class UpdateCurrentAddressDto {
	@IsNotEmpty({ message: 'Residential Address is required' })
	address1;

	@IsNotEmpty({ message: 'Residential landmark is required' })
	land_mark;

	@IsNotEmpty({ message: 'Residential pin code is required' })
	pin_code;

	@IsNotEmpty({ message: 'Residential state is required' })
	state;

	@IsNotEmpty({ message: 'Residence status is required' })
	accomodation_type;
	// resident_status;

	@IsNotEmpty({ message: 'Years at current address is required' })
	years_at_current_state;

	@IsNotEmpty({ message: 'Month at current address is required' })
	months_at_current_state;

	@IsNotEmpty({ message: 'Years at current city is required' })
	duration_at_current_city;

	@IsNotEmpty({ message: 'Months at current city is required' })
	month_duration_at_current_city;
}
