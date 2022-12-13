import { Customer } from '@entities/customer.entity';
import { CustomerTemp } from '@entities/customerTemp.entity';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { CustomerCard } from '@entities/CustomerCard.entity';
import { CustomerPointsHistory } from '@entities/CustomerPointsHistory.entity';
import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from '@config/index';
import { CustomerController } from './customer.controller';
import {
	LoyaltyCustomer,
	LoyCustomer,
} from '../../oentities/loyaltyCustomer.entity';
import {
	FinnOneCustomers,
	FinnOneCustomerPhoneDetails,
	FinnOneCustomerIdDetailsView,
	FinnOneCustomerEmailIDView,
	FinnOneCustomerAddressDetailsView,
	FinnOneCustomerApplicationDetailsView,
	FinnOneCustomerReferencesView,
	FinnOneCustomerInstrumentalDetailsView,
	FinnOneAddressDetailsView,
	FinnOneIncomeDetailsView,
	FinnOneEmploymnetDetailsView,
	FinnOneCustomer,
	FinnOneCommunicationDetails,
} from '../../oentities/customerViews.entity';
// import { MulterModule } from '@nestjs/platform-express';
import { CustomerDevice } from '../../entities/CustomerDevice.entity';
import { CreditModule } from '../../entities/CreditModule';
import { CustomerWallet } from '../../entities/CustomerWallet';
import { NestMinioModule } from 'nestjs-minio/dist';
import { EMandate } from '../../entities/EMandate.entity';
import { EMandateTemp } from '../../entities/EMandateTemp.entity';
import { Branch } from '../../entities/Branch.entity';
import { ActivityLog } from '../../entities/ActivityLog';
import { BullModule } from '@nestjs/bull';
import { decrypt } from '../../utils/cipher';
import { ClientService, CustomerService } from './customer.service';
import { UserLogProcessor } from './userLog.processor';
import { Receipt } from '../../oentities/Receipt';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Customer,
			EMandate,
			EMandateTemp,
			Branch,
			CustomerDevice,
			CustomerTemp,
			ActivityLog,
			CustomerProfile,
			CustomerCard,
			CustomerWallet,
			CreditModule,
			CustomerPointsHistory,
		]),
		TypeOrmModule.forFeature(
			[
				Receipt,
				FinnOneCustomers,
				FinnOneCustomerPhoneDetails,
				FinnOneCustomerIdDetailsView,
				FinnOneCustomerEmailIDView,
				FinnOneCustomerAddressDetailsView,
				FinnOneCustomerApplicationDetailsView,
				FinnOneCustomerReferencesView,
				FinnOneCustomerInstrumentalDetailsView,
				FinnOneAddressDetailsView,
				FinnOneIncomeDetailsView,
				FinnOneEmploymnetDetailsView,
				FinnOneCustomer,
				FinnOneCommunicationDetails,
			],
			process.env.FINONE_DB_NAME,
		),
		TypeOrmModule.forFeature(
			[LoyaltyCustomer, LoyCustomer],
			process.env.LOYALTY_DB_NAME,
		),
		HttpModule,
		NestMinioModule.register({
			endPoint: process.env.MINIO_ENDPOINT,
			port: Number(decrypt(JSON.parse(process.env.MINIO_PORT))),
			useSSL: String(true) === process.env.MINIO_SSL,
			accessKey: decrypt(JSON.parse(process.env.MINIO_ACCESS_KEY)),
			secretKey: decrypt(JSON.parse(process.env.MINIO_SECRET_KEY)),
		}),
		BullModule.registerQueue({
			name: 'userLog',
			redis: {
				host: decrypt(JSON.parse(process.env.REDIS_HOST_QUEUE)),
				port: Number(decrypt(JSON.parse(process.env.REDIS_PORT_QUEUE))),
			},
		}),
	],
	controllers: [CustomerController],
	providers: [CustomerService, ClientService, UserLogProcessor],
	exports: [CustomerService],
})
export class CustomerModule {}
