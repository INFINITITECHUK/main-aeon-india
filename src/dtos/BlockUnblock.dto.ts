import { IsIn, IsString } from 'class-validator';

export class BlockUnblockDto {
	idx?: string;

	@IsString({ message: 'Status must be string' })
	@IsIn(['BLOCK', 'UNBLOCK'], {
		message: 'Status must be either BLOCK or UNBLOCK',
	})
	operation: string;
}
