import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLoanController } from './customer-loan.controller';

describe('CustomerLoanController', () => {
	let controller: CustomerLoanController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CustomerLoanController],
		}).compile();

		controller = module.get<CustomerLoanController>(CustomerLoanController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
