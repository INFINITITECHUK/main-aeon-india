import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateTermsAndConditionsDto {
	@IsNotEmpty({ message: 'Terms and Condition response is required' })
	@IsIn(['AGREE', 'DISAGREE'], {
		message: 'Status should be AGREE or DISAGREE',
	})
	status;
}
