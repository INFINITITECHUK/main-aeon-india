import { IsNotEmpty } from 'class-validator';

export class UpdatePersonalInfoDto {
	@IsNotEmpty({ message: 'Preferred branch is required' })
	preferred_branch;
}
