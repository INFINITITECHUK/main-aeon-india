import { Test, TestingModule } from '@nestjs/testing';
import { CronJobsController } from './cron-jobs.controller';

describe('CronJobsController', () => {
	let controller: CronJobsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CronJobsController],
		}).compile();

		controller = module.get<CronJobsController>(CronJobsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
