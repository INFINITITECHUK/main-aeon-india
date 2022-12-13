import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLoanService } from './customer-loan.service';

describe('CustomerLoanService', () => {
	let service: CustomerLoanService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CustomerLoanService],
		}).compile();

		service = module.get<CustomerLoanService>(CustomerLoanService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
