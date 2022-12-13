import {
	IsBoolean,
	IsIn,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
} from 'class-validator';
import { Status } from '@common/constants/status.enum';

export class EmandateStatusSetDto {
	@IsIn(['PENDING', 'APPROVED', 'REJECTED'], {
		message: 'Value must be either APPROVED or REJECTED',
	})
	@IsOptional()
	penny_drop_success: Status;

	@IsOptional()
	@IsIn(['PENDING'], {
		message: 'Value must be either APPROVED or REJECTED',
	})
	physical_mandate_verification: Status;

	@IsIn(['PENDING', 'APPROVED', 'REJECTED'], {
		message: 'Value must be either APPROVED or REJECTED',
	})
	@IsOptional()
	emandate_success?: Status;

	@IsOptional()
	emandate_failure_response?: string;

	@IsOptional()
	pennydrop_failure_response?: string;

	@IsOptional()
	pennydrop_success_data?: string;

	@IsOptional()
	emandate_success_data?: string;
}
