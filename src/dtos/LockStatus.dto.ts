import { IsIn } from 'class-validator';

export class LockStatusDto {
	@IsIn(['BLOCK_RL', 'UNBLOCK_RL'], {
		message: 'Value must be either BLOCK_RL or UNBLOCK_RL',
	})
	status: string;
}
