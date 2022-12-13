import { IsNotEmpty } from 'class-validator';

export class UploadFilesDTO {
	@IsNotEmpty({ message: 'ID card front is required' })
	id_card_front;

	@IsNotEmpty({ message: 'ID card front is required' })
	id_card_back;

	@IsNotEmpty({ message: 'Verification document is required' })
	verification_doc;
}
