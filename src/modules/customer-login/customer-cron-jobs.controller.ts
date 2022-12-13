import { Controller, Get } from '@nestjs/common';
import { CustomerMembershipService } from './customer-membership.service';

@Controller('customer-cron-jobs')
export class CustomerCronJobsController {
	constructor(
		private readonly customerMembershipService: CustomerMembershipService,
	) {}
	
	@Get('checkCustomerMembershipStatus')
	async checkCustomerMembershipStatus() {
		console.log('Checking membership status...');
		// await this.customerMembershipService.isMembershipChanged();
	}

	@Get('test')
	async checkCustomerMembershipStatusNEw() {
		console.log('Checking membership status new...');
		await this.customerMembershipService.checkMembershipChanged();
	}
}
