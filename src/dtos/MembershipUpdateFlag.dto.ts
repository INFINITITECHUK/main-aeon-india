import {
	IsNotEmpty,IsBoolean
} from 'class-validator';

export class MembershipUpdateFlag {
	@IsNotEmpty({ message: 'Update to is required' })
	@IsBoolean({ message: 'Update to must be boolean' })
	updateTo: boolean;
}
