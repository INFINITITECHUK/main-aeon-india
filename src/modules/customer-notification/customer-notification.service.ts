import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CustomerDevice } from '../../entities/CustomerDevice.entity';
import { Customer } from '../../entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, getManager, getRepository, Repository } from 'typeorm';
import { CustomerCard } from '../../entities/CustomerCard.entity';
import { EMandate } from '../../entities/EMandate.entity';
import { Http } from 'winston/lib/winston/transports';

@Injectable()
export class CustomerNotificationService {
	constructor(
		@InjectRepository(CustomerDevice)
		private readonly customerDeviceRepo: Repository<CustomerDevice>,
		@InjectRepository(Customer)
		private readonly customerProfileRepo: Repository<Customer>,
		@InjectRepository(CustomerCard)
		private readonly customerCardRepo: Repository<CustomerCard>,
		@InjectRepository(EMandate)
		private readonly emandateRepo: Repository<EMandate>,
	) {}

	async getAllCustomerService() {
		const data: any = await getManager().query(
			`SELECT c.idx, c.customer_code, c.email, c.mobile_number_ext, c.mobile_number, cd.deviceid, cd.fcm_token, cd.phone_os  FROM "Customer" AS c FULL OUTER JOIN "CustomerDevice" AS cd ON c.id = cd.customer_id where c.id is not null`,
		);

		return data;
	}

	async getOneCustomerService(idx) {
		const dataProfile = await this.customerProfileRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['idx', 'id', 'email', 'mobile_number_ext', 'mobile_number'],
		});

		if (!dataProfile.mobile_number_ext) {
			dataProfile.mobile_number_ext = '91';
		}

		const deviceInfo = await this.customerDeviceRepo.findOne({
			where: {
				customer_id: dataProfile.id,
				is_obsolete: false,
			},
			select: ['deviceid', 'fcm_token', 'phone_os'],
		});

		const data = [];
		const dataObj = { ...dataProfile, ...deviceInfo };

		data.push(dataObj);

		return data;
	}

	async getOneCustomerDataService(idx: string) {
		const dataProfile = await this.customerProfileRepo.findOne({
			where: {
				idx,
				is_obsolete: false,
			},
			select: ['idx', 'first_name', 'middle_name', 'last_name', 'gender'],
		});

		if (!dataProfile) {
			throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
		}

		const cardInfo = await this.customerCardRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: ['membership_type', 'membership_number'],
		});

		const emandateInfo = await this.emandateRepo.findOne({
			where: {
				customer_idx: idx,
				is_obsolete: false,
			},
			select: ['full_name', 'account_number', 'account_type', 'branch_idx'],
		});

		const dataObj = { ...dataProfile, ...cardInfo, ...emandateInfo };

		return dataObj;
	}

	async GetCustomerIdxFromQueryService(search: string) {
		const query: any = getRepository(Customer)
			.createQueryBuilder('customer')
			.select('customer.idx')
			.where('customer.is_obsolete = :is_obsolete', {
				is_obsolete: false,
			});
		if (search !== '') {
			query.andWhere(
				new Brackets(qb => {
					qb.where(
						`CONCAT(customer.first_name, ' ', customer.middle_name, ' ', customer.last_name) ILIKE :search OR CONCAT(customer.first_name, ' ', customer.last_name) ILIKE :search`,
						{
							search: `${search}%`,
						},
					);
				}),
			);
		}
		const result = await query.getMany();
		const resultToSend = result.map(el => el.idx);

		return resultToSend;
	}
}
