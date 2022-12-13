import { IsIn, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ApproveRejectDto {
	idx?: string;

	@IsNotEmpty({ message: 'Status is required' })
	@IsString({ message: 'Status must be string' })
	@IsIn(['APPROVED', 'REJECTED'], {
		message: 'Status must be either APPROVED or REJECTED',
	})
	status: string;

	@IsOptional()
	rejection_reason?: string;
}
