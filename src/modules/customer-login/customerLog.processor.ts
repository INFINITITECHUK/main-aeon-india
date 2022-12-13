import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Job } from 'bull';

@Processor('customerLog')
export class CustomerLogProcessor {
	private readonly logger = new Logger(CustomerLogProcessor.name);

	constructor(
		@Inject(WINSTON_MODULE_PROVIDER)
		private readonly loggerQueue: Logger,
	) {}

	@Process('saveCustomerLog')
	async handleCustomerLog(job: Job) {
		console.log('insssssss');
		const { dataObject } = job.data;

		this.loggerQueue.log('info', JSON.stringify(dataObject));

		this.logger.debug('Transcoding in saveCustomerLog completed');
	}
}
