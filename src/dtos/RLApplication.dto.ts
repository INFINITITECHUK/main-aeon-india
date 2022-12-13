import { IsDecimal, IsIn, IsNotEmpty } from 'class-validator';
import { branchCodeMapEnum } from '@common/constants/branchCodeMap.enum';

export class RLApplicationDto {
	@IsNotEmpty({ message: 'Branch code is required and cannot be empty' })
	@IsIn(['Virar', 'Dadar', 'Vashi', 'Phoenix Kurla'], {
		message: 'Value must be between Virar, Dadar, Vashi and Phoenix Kurla',
	})
	branch_code: branchCodeMapEnum;

	@IsNotEmpty({ message: 'Amount is required and cannot be empty' })
	request_amount: string;
}
