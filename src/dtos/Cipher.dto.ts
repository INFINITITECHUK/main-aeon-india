import { IsNotEmpty, IsString } from 'class-validator';

export class CipherDecryptDto {
	@IsNotEmpty()
	@IsString()
	token: string;
}
