import {
	ClassSerializerInterceptor,
	Controller,
	Get,
	Headers,
	HttpException,
	HttpStatus,
	Param,
	Query,
	Request,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { CustomerLoanService } from '@modules/customer-loan/customer-loan.service';
import { AuthGuard } from '@nestjs/passport';
import { CustomerLoginService } from '@modules/customer-login/customer-login.service';
import { SOARequestDto } from '@dtos/SOARequest.dto';

@Controller('customer-loan')
export class CustomerLoanController {
	constructor(
		private readonly customerLoanService: CustomerLoanService,
		private readonly customerLoginService: CustomerLoginService,
	) {}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('customer-products')
	async getCustomerProducts(
		@Request() request: Request,
		@Headers() Device: any,
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException('Device ID mismatch', HttpStatus.BAD_REQUEST);
		}

		return await this.customerLoanService.getCustomerProducts(
			getIdxAndCheckDeviceId,
		);
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get('customer-products/:customer_idx')
	async getCustomerProductsByIdx(
		@Request() request: Request,
		@Headers() Device: any,
		@Param('customer_idx') customer_idx: string,
	) {
		return await this.customerLoanService.getCustomerProducts(customer_idx);
	}

	@Get('playground')
	async playground(
		@Request() request: Request,
		@Query() soaQuery: SOARequestDto,
		@Headers() Device: any,
	) {
		console.log('well played!!');
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('get-customer-loan-info')
	async getCustomerLoan(
		@Request() request: Request,
		@Headers() Device: any,
	){

		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException('Device ID mismatch', HttpStatus.BAD_REQUEST);
		}

		const customerIdx = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);
		return await this.customerLoanService.getCustomerLoans(customerIdx)
	}

	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(ClassSerializerInterceptor)
	@Get('product-soa')
	async getCustomerProductSOA(
		@Request() request: Request,
		@Query() soaQuery: SOARequestDto,
		@Headers() Device: any,
	) {
		const header: any = request.headers;

		if (!header.authorization) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.BAD_REQUEST,
			);
		}
		const token = header.authorization.split(' ')[1];
		const getIdxAndCheckDeviceId = await this.customerLoginService.checkDeviceId(
			token,
			Device.device,
		);

		if (getIdxAndCheckDeviceId === 'Device does not exist') {
			throw new HttpException('Device does not exist', HttpStatus.BAD_REQUEST);
		}

		if (getIdxAndCheckDeviceId === 'Device ID Mismatch') {
			throw new HttpException('Device ID mismatch', HttpStatus.BAD_REQUEST);
		}

		return await this.customerLoanService.getCustomerProductSOA(
			getIdxAndCheckDeviceId,
			soaQuery.product_code,
		);
	}
}
