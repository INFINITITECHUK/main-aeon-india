import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Job } from 'bull';

@Processor('userLog')
export class UserLogProcessor {
	private readonly logger = new Logger(UserLogProcessor.name);

	constructor(
		@Inject(WINSTON_MODULE_PROVIDER)
		private readonly loggerQueue: Logger,
	) {}

	@Process('saveUserLog')
	async handleUserLog(job: Job) {
		const { dataObject } = job.data;

		// this.loggerQueue.log('info', JSON.stringify(dataObject));
		this.loggerQueue.log('info', dataObject);

		this.logger.debug('Transcoding in saveUserLog completed');
	}
}
