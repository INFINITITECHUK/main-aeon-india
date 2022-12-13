import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomerNotificationService } from './customer-notification.service';

@Controller('customer-notification')
export class CustomerNotificationController {
	constructor(
		private readonly customerNotificationService: CustomerNotificationService,
	) {}

	@Get()
	async getAllCustomer() {
		return this.customerNotificationService.getAllCustomerService();
	}

	@Get('single/:idx')
	async getOneCustomer(@Param('idx') idx: string) {
		return this.customerNotificationService.getOneCustomerService(idx);
	}

	@Get('customer-data-query')
	async GetCustomerIdxFromQuery(@Query('search') search: string) {
		return this.customerNotificationService.GetCustomerIdxFromQueryService(
			search,
		);
	}

	@Get('customer-data/:idx')
	async getOneCustomerData(@Param('idx') idx: string) {
		return this.customerNotificationService.getOneCustomerDataService(idx);
	}
}
