import { Body, Controller, Get, Post } from '@nestjs/common';
import { CronJobsService } from '@modules/cron-jobs/cron-jobs.service';
import { QueryService } from '@modules/cron-jobs/query.service';
import { ChangeMobileNumberDto } from '@dtos/ChangeMobileNumber.dto';

@Controller('cron-jobs')
export class CronJobsController {
	constructor(
		private readonly cronJobsService: CronJobsService,
		private readonly queryService: QueryService,
	) {}

	@Post('loyalty-query')
	async loyaltyQuery(@Body() query: { query }) {
		return await this.queryService.loyaltyQueryService(query);
	}

	@Post('finone-query')
	async finonequeryQuery(@Body() query: { query }) {
		return await this.queryService.finoneQueryService(query);
	}

	@Get('notify-new-customers')
	async settleMerchantTxn() {
		let data = {
			customer_onboarding_hour_24_format: 11,
			customer_onboarding_minute: 58,
		};
		await this.cronJobsService.notifyNewCustomers(data);
		return {
			message: 'Successfully settled',
		};
	}

	@Get('import-auto-repayment-transactions')
	async importAutoRepaymentTransactions() {
		await this.cronJobsService.importAutoRepaymentTransactions();
		return {
			message: 'Successfully imported',
		};
	}

	@Get('import-lan-report')
	async importLanReport() {
		await this.cronJobsService.importLanReport();
		
	}
}
