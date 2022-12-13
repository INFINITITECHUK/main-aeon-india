import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class SetSecurityQuestionDto {
	@ApiProperty()
	@IsNotEmpty({ message: 'Data are required' })
	@IsArray({ message: 'Data must be array' })
	data: Array<string>;
}
