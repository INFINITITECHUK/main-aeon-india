import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class ValidateInitialTermsDto {
	@IsNotEmpty({ message: 'Terms and condition status is required' })
	@IsString({ message: 'Terms and condition status must be string' })
	@IsIn(['AGREE', 'DISAGREE'], {
		message: 'Terms and condition status must be either AGREE or DISAGREE',
	})
	status: string;
}
