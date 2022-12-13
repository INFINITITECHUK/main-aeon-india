import { IsNotEmpty } from 'class-validator';

export class UpdateAddressProofDto {
	@IsNotEmpty({ message: 'ID card front is required' })
	addressfile;
}
